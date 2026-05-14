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

import asyncio
import base64
import hashlib
import json
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger("merchant")

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        return pub_key.to_checksum_address()
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
# On-chain reputation feedback
# ---------------------------------------------------------------------------

_IDENTITY_REGISTRY  = "0x24c1F275a5b789A6537D63f921D923c5b44937a3"
_REPUTATION_REGISTRY = "0x7E2fbDb30Eb42693a3811C9AbEE9694855D275cF"
_BASE_RPC = os.getenv("BASE_RPC_URL", "https://mainnet.base.org")
_ABI_DIR = Path(__file__).parent.parent / "api" / "abi"


def _load_abi(name: str) -> list:
    with open(_ABI_DIR / f"{name}.json") as f:
        return json.load(f)


def _write_feedback_sync(payer_address: str) -> tuple[str | None, bool]:
    """
    Resolve payer_address → agentId, submit giveFeedback(), wait for receipt.
    Returns (tx_hash_hex, confirmed) so the caller can fire step 8 immediately
    on-chain confirmation without waiting for the score API to propagate.
    """
    merchant_key = os.getenv("MERCHANT_PRIVATE_KEY", "").strip()
    if not merchant_key:
        logger.warning("MERCHANT_PRIVATE_KEY not set — skipping reputation feedback")
        return None, False

    try:
        from web3 import Web3
        from eth_account import Account

        w3 = Web3(Web3.HTTPProvider(_BASE_RPC))
        if not w3.is_connected():
            logger.warning("Cannot connect to RPC — skipping feedback")
            return None, False

        if not merchant_key.startswith("0x"):
            merchant_key = "0x" + merchant_key
        merchant = Account.from_key(merchant_key)

        rep_abi = _load_abi("ReputationRegistry")
        reputation = w3.eth.contract(
            address=Web3.to_checksum_address(_REPUTATION_REGISTRY), abi=rep_abi
        )

        # Resolve payer → agentId via chain.get_identity (ownerOf scan).
        import sys
        sys.path.insert(0, str(Path(__file__).parent.parent / "api"))
        from chain import get_identity as _get_identity
        identity_result = _get_identity(payer_address)
        if not identity_result.get("registered") or identity_result.get("token_id") is None:
            logger.info("Payer %s not registered — skipping feedback", payer_address)
            return None, False

        agent_id = identity_result["token_id"]
        logger.info("Writing feedback for agentId=%d (payer=%s)", agent_id, payer_address)

        min_bal = w3.to_wei(0.00002, "ether")
        if w3.eth.get_balance(merchant.address) < min_bal:
            logger.warning("Merchant wallet has insufficient ETH for feedback tx")
            return None, False

        feedback_hash = bytes.fromhex(
            hashlib.sha256(f"{agent_id}:x402:{int(time.time())}".encode()).hexdigest()
        )

        base_fee = w3.eth.get_block("latest")["baseFeePerGas"]
        priority = w3.to_wei(0.01, "gwei")
        fn = reputation.functions.giveFeedback(
            agent_id, 80, 0, "payment", "x402",
            _REPUTATION_REGISTRY, "", feedback_hash,
        )
        tx = fn.build_transaction({
            "from": merchant.address,
            "nonce": w3.eth.get_transaction_count(merchant.address),
            "type": 2,
            "maxPriorityFeePerGas": priority,
            "maxFeePerGas": base_fee * 2 + priority,
            "chainId": 8453,
        })
        tx["gas"] = int(w3.eth.estimate_gas(tx) * 1.1)
        signed = w3.eth.account.sign_transaction(tx, merchant_key)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        tx_hex = "0x" + tx_hash.hex()
        logger.info("Feedback tx sent: %s — waiting for receipt", tx_hex)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
        if receipt.status == 1:
            logger.info("Feedback confirmed — agentId=%d tx=%s", agent_id, tx_hex)
            return tx_hex, True
        else:
            logger.warning("giveFeedback reverted — tx=%s", tx_hex)
            return tx_hex, False

    except Exception as exc:
        logger.exception("Error writing reputation feedback: %s", exc)
        return None, False


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

    payer = payload.get("from", "")
    settled_at = datetime.now(timezone.utc).isoformat()

    # Fire-and-forget reputation signal after successful payment
    import asyncio
    asyncio.create_task(_write_feedback_async(payer))

    return JSONResponse(
        status_code=200,
        content={
            "data": "agent_weather_sf",
            "temperature": 18,
            "unit": "C",
            "paid": True,
            "amount_usdc": PRICE_USDC,
            "settled_at": settled_at,
            "payer": payer,
        },
    )


_AGENT_ADDRESS = "0x572b8caf4FbEAC5358946acD2C5EFfeeB035D028"
_SCORE_API_URL = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8000")

_DEMO_STEPS = [
    (1, "Agent calls /data endpoint", 0),
    (2, "Server returns HTTP 402", 400),
    (3, "Agent parses payment requirements", 800),
    (4, "ERC-3009 signature constructed", 1400),
    (5, "Payment proof submitted", 2000),
    (6, "Merchant verifies signature", 2600),
    (7, "Access granted — data returned", 3200),
    (8, "Reputation score updated on-chain", 4200),
]


def _score_tier(score: int | None) -> str:
    if score is None:
        return "A"
    if score >= 700:
        return "AAA"
    if score >= 500:
        return "AA"
    return "A"


def _fetch_score_for_sync(agent_address: str) -> int | None:
    import urllib.request

    url = f"{_SCORE_API_URL}/v0/score/{agent_address}"
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            data = json.loads(r.read())
            return data.get("score") or data.get("total_score")
    except Exception:
        return None


async def _fetch_score_for(agent_address: str) -> int | None:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _fetch_score_for_sync, agent_address)


# Keep old helpers as aliases for /demo/status backward compat
async def _fetch_score() -> int | None:
    return await _fetch_score_for(_AGENT_ADDRESS)


@app.get("/demo/status")
async def demo_status(agent: str = _AGENT_ADDRESS):
    score = await _fetch_score_for(agent)
    return {"score": score, "tier": _score_tier(score), "address": agent}


@app.get("/demo/run")
async def demo_run(agent: str = _AGENT_ADDRESS):
    async def stream():
        score_before = await _fetch_score_for(agent)
        start = time.time()

        feedback_future: asyncio.Future | None = None

        for step, label, ms in _DEMO_STEPS[:-1]:
            target = start + ms / 1000
            await asyncio.sleep(max(0, target - time.time()))
            payload = json.dumps({"step": step, "label": label, "ms": ms})
            yield f"data: {payload}\n\n"

            # After step 7: submit giveFeedback and await receipt in executor.
            # This runs concurrently with the remaining wait time so step 8
            # fires as soon as the tx confirms (~2s on Base), not after a
            # 60s poll timeout.
            if step == 7:
                loop = asyncio.get_event_loop()
                feedback_future = loop.run_in_executor(
                    None, _write_feedback_sync, agent
                )

        # Await the feedback tx — times out after 20s regardless.
        tx_hex: str | None = None
        confirmed = False
        if feedback_future is not None:
            try:
                tx_hex, confirmed = await asyncio.wait_for(feedback_future, timeout=20)
            except asyncio.TimeoutError:
                logger.warning("Feedback tx wait timed out after 20s")

        # If tx confirmed, use it as proof; score API may lag so we poll
        # briefly (up to 20s) for the updated value, then fall back to
        # score_before if it hasn't propagated yet.
        final_score = score_before
        if confirmed:
            deadline = time.time() + 20
            while time.time() < deadline:
                await asyncio.sleep(2)
                new_score = await _fetch_score_for(agent)
                logger.info("score poll: before=%s current=%s", score_before, new_score)
                if new_score is not None and new_score > (score_before or 0):
                    final_score = new_score
                    break

        step, label, ms = _DEMO_STEPS[-1]
        actual_ms = int((time.time() - start) * 1000)
        event: dict = {
            "step": step,
            "label": label,
            "ms": actual_ms,
            "done": True,
            "score": final_score,
            "tier": _score_tier(final_score),
        }
        if tx_hex:
            event["tx_hash"] = tx_hex
            event["basescan"] = f"https://basescan.org/tx/{tx_hex}"
        yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
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
