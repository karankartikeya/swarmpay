import os
import httpx

BASE_RPC_URL = os.getenv("BASE_RPC_URL", "https://mainnet.base.org")
# NOTE: supplied address was 41 chars; padded to valid 42-char form
REPUTATION_REGISTRY = "0x00Da9958aCDCe8f1e7B0BB0F2Ef23C0C644BbE7e"

# reputationOf(address) selector: keccak256("reputationOf(address)")[:4]
REPUTATION_OF_SELECTOR = "0x7abe06e1"


def _rpc_call(method: str, params: list) -> dict:
    payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    with httpx.Client(timeout=5.0) as client:
        resp = client.post(BASE_RPC_URL, json=payload)
        resp.raise_for_status()
        return resp.json()


def _encode_address(address: str) -> str:
    """ABI-encode a single address argument (32-byte zero-padded)."""
    return address[2:].lower().zfill(64)


def _decode_uint256(hex_str: str) -> int:
    """Decode a 32-byte ABI-encoded uint256 from hex string."""
    return int(hex_str, 16)


def is_valid_address(address: str) -> bool:
    if not isinstance(address, str):
        return False
    if not address.startswith("0x"):
        return False
    if len(address) != 42:
        return False
    try:
        int(address[2:], 16)
        return True
    except ValueError:
        return False


def get_agent_feedback(agent_address: str) -> dict:
    try:
        calldata = REPUTATION_OF_SELECTOR + _encode_address(agent_address)
        result = _rpc_call(
            "eth_call",
            [{"to": REPUTATION_REGISTRY, "data": calldata}, "latest"],
        )
        raw_hex = result.get("result", "0x")
        if not raw_hex or raw_hex == "0x" or "error" in result:
            return {"raw_score": None, "source": "ERC-8004"}
        score = _decode_uint256(raw_hex)
        # Unregistered agents return 0; treat as None so callers can distinguish
        return {"raw_score": score if score > 0 else None, "source": "ERC-8004"}
    except Exception:
        return {"raw_score": None, "source": "ERC-8004"}


def get_payment_history(agent_address: str) -> dict:
    try:
        result = _rpc_call(
            "eth_getTransactionCount",
            [agent_address, "latest"],
        )
        raw_hex = result.get("result", "0x0")
        tx_count = int(raw_hex, 16)
        return {"tx_count": tx_count, "source": "x402-proxy"}
    except Exception:
        return {"tx_count": 0, "source": "x402-proxy"}
