"""
SwarmPay x402 demo merchant server.

Implements the HTTP 402 payment protocol (x402):
  - GET /data with no payment → 402 + payment requirements
  - GET /data with X-PAYMENT header → verify ERC-3009 sig → 200 or 402

Run:
    uvicorn merchant:app --port 9000

Env vars (load from .env):
    MERCHANT_ADDRESS   checksummed wallet address that receives payment
"""

import base64
import hashlib
import json
import os
import time
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

load_dotenv()

USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
CHAIN_ID = 8453  # Base Mainnet
PRICE_UNITS = "1000"  # 0.001 USDC (6 decimals)
PRICE_USDC = 0.001
PORT = 9000
RESOURCE = f"http://localhost:{PORT}/data"

# EIP-712 type hash for ERC-3009 TransferWithAuthorization
_TRANSFER_TYPEHASH_HEX = (
    "7c7c6cdb67a18743f49ec6fa9b35f50d52ed05cbed4cc592e13b44501c1a2267"
)

app = FastAPI(title="SwarmPay x402 Merchant Demo")


def _merchant_address() -> str:
    addr = os.getenv("MERCHANT_ADDRESS", "")
    if not addr:
        raise RuntimeError("MERCHANT_ADDRESS env var not set")
    return addr


def _payment_requirements() -> dict:
    return {
        "x402Version": 1,
        "error": "Payment required",
        "accepts": [
            {
                "scheme": "exact",
                "network": "base-mainnet",
                "maxAmountRequired": PRICE_UNITS,
                "resource": RESOURCE,
                "description": "SwarmPay Demo API — weather data",
                "mimeType": "application/json",
                "payTo": _merchant_address(),
                "maxTimeoutSeconds": 60,
                "asset": USDC_BASE,
                "extra": {"name": "USD Coin", "version": "2"},
            }
        ],
    }


# ---------------------------------------------------------------------------
# ERC-3009 / EIP-712 signature verification (off-chain, cryptographic only)
# ---------------------------------------------------------------------------

def _keccak256(data: bytes) -> bytes:
    """Return 32-byte keccak256 digest."""
    from hashlib import sha3_256  # noqa: F401 — placeholder import check

    # Use eth_hash if available, else fall back to pysha3 / sha3
    try:
        from Crypto.Hash import keccak as _keccak

        k = _keccak.new(digest_bits=256)
        k.update(data)
        return k.digest()
    except ImportError:
        pass

    try:
        import sha3 as _sha3  # pysha3

        k = _sha3.keccak_256()
        k.update(data)
        return k.digest()
    except ImportError:
        pass

    # eth_hash (bundled with web3/eth-account)
    try:
        from eth_hash.auto import keccak

        return keccak(data)
    except ImportError:
        pass

    raise RuntimeError(
        "No keccak256 implementation found. "
        "Install one of: pycryptodome, pysha3, or eth-hash"
    )


def _encode_packed(*args) -> bytes:
    """Minimal abi.encodePacked for fixed-size types used in EIP-712."""
    out = b""
    for typ, val in args:
        if typ == "bytes32":
            if isinstance(val, str):
                val = bytes.fromhex(val.removeprefix("0x"))
            out += val.rjust(32, b"\x00")
        elif typ == "address":
            addr_bytes = bytes.fromhex(val.removeprefix("0x").lower())
            out += addr_bytes.rjust(32, b"\x00")
        elif typ == "uint256":
            out += int(val).to_bytes(32, "big")
        elif typ == "bytes":
            out += val
        else:
            raise ValueError(f"Unsupported type: {typ}")
    return out


def _domain_separator(token_name: str, token_version: str) -> bytes:
    """
    EIP-712 domain separator for USDC on Base:
      keccak256(abi.encode(
        TYPE_HASH, name_hash, version_hash, chainId, verifyingContract
      ))
    """
    domain_typehash = _keccak256(
        b"EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    )
    name_hash = _keccak256(token_name.encode())
    version_hash = _keccak256(token_version.encode())

    encoded = _encode_packed(
        ("bytes32", domain_typehash),
        ("bytes32", name_hash),
        ("bytes32", version_hash),
        ("uint256", CHAIN_ID),
        ("address", USDC_BASE),
    )
    return _keccak256(encoded)


def _struct_hash(
    from_addr: str,
    to_addr: str,
    value: int,
    valid_after: int,
    valid_before: int,
    nonce: str,
) -> bytes:
    """
    keccak256(abi.encode(
      TRANSFER_TYPEHASH, from, to, value, validAfter, validBefore, nonce
    ))
    """
    typehash = bytes.fromhex(_TRANSFER_TYPEHASH_HEX)
    nonce_bytes = bytes.fromhex(nonce.removeprefix("0x")).rjust(32, b"\x00")

    encoded = _encode_packed(
        ("bytes32", typehash),
        ("address", from_addr),
        ("address", to_addr),
        ("uint256", value),
        ("uint256", valid_after),
        ("uint256", valid_before),
        ("bytes32", nonce_bytes),
    )
    return _keccak256(encoded)


def _eip712_hash(struct_hash: bytes, domain_sep: bytes) -> bytes:
    """Final EIP-712 digest: keccak256(0x1901 || domainSep || structHash)"""
    return _keccak256(b"\x19\x01" + domain_sep + struct_hash)


def _recover_signer(digest: bytes, signature_hex: str) -> str:
    """Recover signer address from digest + signature using eth_account."""
    try:
        from eth_account import Account
        from eth_account._utils.signing import sign_message_hash  # noqa
        from eth_keys import keys

        sig = bytes.fromhex(signature_hex.removeprefix("0x"))
        if len(sig) != 65:
            raise ValueError(f"Signature must be 65 bytes, got {len(sig)}")

        r = int.from_bytes(sig[0:32], "big")
        s = int.from_bytes(sig[32:64], "big")
        v = sig[64]
        if v >= 27:
            v -= 27

        pub_key = keys.Signature(vrs=(v, r, s)).recover_public_key_from_msg_hash(
            digest
        )
        return "0x" + pub_key.to_checksum_address()
    except ImportError:
        raise RuntimeError(
            "eth-account / eth-keys not installed. "
            "Run: pip install eth-account"
        )


def verify_erc3009_payment(payload: dict) -> tuple[bool, str]:
    """
    Verify an ERC-3009 TransferWithAuthorization payment payload.

    Expected payload keys:
        from, to, value, validAfter, validBefore, nonce, signature
        tokenName (default "USD Coin"), tokenVersion (default "2")

    Returns (ok, reason).
    """
    try:
        from_addr = payload["from"]
        to_addr = payload["to"]
        value = int(payload["value"])
        valid_after = int(payload["validAfter"])
        valid_before = int(payload["validBefore"])
        nonce = payload["nonce"]
        signature = payload["signature"]
        token_name = payload.get("tokenName", "USD Coin")
        token_version = payload.get("tokenVersion", "2")
    except KeyError as e:
        return False, f"Missing field: {e}"

    now = int(time.time())

    if now <= valid_after:
        return False, f"Payment not yet valid (validAfter={valid_after})"
    if now >= valid_before:
        return False, f"Payment expired (validBefore={valid_before})"

    max_amount = int(PRICE_UNITS)
    if value > max_amount:
        return False, f"Payment value {value} exceeds required {max_amount}"
    if value <= 0:
        return False, "Payment value must be positive"

    merchant = _merchant_address().lower()
    if to_addr.lower() != merchant:
        return False, f"Payment destination mismatch: got {to_addr}, want {merchant}"

    try:
        domain_sep = _domain_separator(token_name, token_version)
        struct_h = _struct_hash(from_addr, to_addr, value, valid_after, valid_before, nonce)
        digest = _eip712_hash(struct_h, domain_sep)
        signer = _recover_signer(digest, signature)
    except Exception as e:
        return False, f"Signature verification error: {e}"

    if signer.lower() != from_addr.lower():
        return False, f"Signer {signer} does not match from {from_addr}"

    return True, "ok"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/data")
async def get_data(request: Request):
    payment_header = request.headers.get("X-PAYMENT", "")

    if not payment_header:
        return JSONResponse(status_code=402, content=_payment_requirements())

    # Decode X-PAYMENT header (base64-encoded JSON)
    try:
        decoded = base64.b64decode(payment_header + "==").decode("utf-8")
        payload = json.loads(decoded)
    except Exception:
        # Try raw JSON fallback
        try:
            payload = json.loads(payment_header)
        except Exception:
            return JSONResponse(
                status_code=402,
                content={**_payment_requirements(), "error": "Invalid X-PAYMENT header encoding"},
            )

    ok, reason = verify_erc3009_payment(payload)

    if not ok:
        return JSONResponse(
            status_code=402,
            content={**_payment_requirements(), "error": f"Payment invalid: {reason}"},
        )

    return JSONResponse(
        status_code=200,
        content={
            "data": "agent_weather_sf",
            "temperature": 18,
            "unit": "C",
            "paid": True,
            "amount_usdc": PRICE_USDC,
            "settled_at": datetime.now(timezone.utc).isoformat(),
            "payer": payload.get("from"),
        },
    )


@app.get("/")
async def root():
    return {
        "service": "SwarmPay x402 Merchant Demo",
        "endpoint": "/data",
        "price_usdc": PRICE_USDC,
        "asset": USDC_BASE,
        "network": "base-mainnet",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("merchant:app", host="0.0.0.0", port=PORT, reload=True)
