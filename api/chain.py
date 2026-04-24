import os
import json
from pathlib import Path
import httpx

BASE_RPC_URL = os.getenv("BASE_RPC_URL", "https://mainnet.base.org")
IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e"
REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713"

_ABI_DIR = Path(__file__).parent / "abi"

with open(_ABI_DIR / "IdentityRegistry.json") as f:
    IDENTITY_ABI = json.load(f)

with open(_ABI_DIR / "ReputationRegistry.json") as f:
    REPUTATION_ABI = json.load(f)

# keccak256-derived selectors (verified against known transfer=0xa9059cbb)
# balanceOf(address)
_SEL_BALANCE_OF = "0x70a08231"
# getSummary(uint256,address[],string,string)
_SEL_GET_SUMMARY = "0x81bbba58"
# getClients(uint256)
_SEL_GET_CLIENTS = "0x42dd519c"

# keccak256("Registered(uint256,string,address)") — precomputed, verified
_TOPIC_REGISTERED = "0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a"


def _rpc_call(method: str, params: list) -> dict:
    payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    with httpx.Client(timeout=5.0) as client:
        resp = client.post(BASE_RPC_URL, json=payload)
        resp.raise_for_status()
        return resp.json()


def _enc_address(address: str) -> str:
    return address[2:].lower().zfill(64)


def _enc_uint256(value: int) -> str:
    return hex(value)[2:].zfill(64)


def _dec_uint256(data: str, offset: int = 0) -> int:
    start = 2 + offset * 64
    return int(data[start : start + 64], 16)


def _dec_int128(data: str, offset: int = 0) -> int:
    start = 2 + offset * 64
    raw = int(data[start : start + 64], 16)
    # int128 is sign-extended to 256 bits; check sign bit at bit 127
    if raw >= (1 << 127):
        raw -= 1 << 256
    return raw


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


def get_identity(agent_address: str) -> dict:
    """
    Check IdentityRegistry for a registered agent NFT.
    Returns {"registered": bool, "token_id": int | None, "registry": str}
    Uses balanceOf(address) to detect registration, then resolves token ID
    from the Registered event log.
    """
    result = {"registered": False, "token_id": None, "registry": "ERC-8004 Base Mainnet"}
    try:
        # balanceOf(address) → uint256
        calldata = _SEL_BALANCE_OF + _enc_address(agent_address)
        resp = _rpc_call("eth_call", [{"to": IDENTITY_REGISTRY, "data": calldata}, "latest"])
        raw = resp.get("result", "0x")
        if not raw or raw == "0x" or "error" in resp:
            return result
        balance = _dec_uint256(raw)
        if balance == 0:
            return result
        result["registered"] = True

        # Resolve token ID via Registered event: topic[2] = indexed owner address
        owner_topic = "0x" + agent_address[2:].lower().zfill(64)
        logs_resp = _rpc_call("eth_getLogs", [{
            "address": IDENTITY_REGISTRY,
            "topics": [_TOPIC_REGISTERED, None, owner_topic],
            "fromBlock": "0x0",
            "toBlock": "latest",
        }])
        logs = logs_resp.get("result", [])
        if logs:
            # agentId is topics[1] (indexed uint256)
            token_id = int(logs[-1]["topics"][1], 16)
            result["token_id"] = token_id
    except Exception:
        pass
    return result


def _get_agent_id(agent_address: str) -> int | None:
    """Resolve wallet address → ERC-8004 agentId via Registered event."""
    try:
        owner_topic = "0x" + agent_address[2:].lower().zfill(64)
        logs_resp = _rpc_call("eth_getLogs", [{
            "address": IDENTITY_REGISTRY,
            "topics": [_TOPIC_REGISTERED, None, owner_topic],
            "fromBlock": "0x0",
            "toBlock": "latest",
        }])
        logs = logs_resp.get("result", [])
        if logs:
            return int(logs[-1]["topics"][1], 16)
    except Exception:
        pass
    return None


def get_agent_feedback(agent_address: str) -> dict:
    """
    Fetch feedback summary from ReputationRegistry.
    Resolves address → agentId, calls getSummary(agentId, clients, "", ""),
    falls back to raw eth_call with selector 0x7abe06e1 if getSummary fails.
    Returns {"raw_score": float | None, "source": "ERC-8004", "reason": str | None}
    """
    base = {"source": "ERC-8004", "raw_score": None, "reason": None}

    # Check identity first
    identity = get_identity(agent_address)
    if not identity["registered"]:
        return {**base, "reason": "unregistered or no feedback"}

    agent_id = identity["token_id"]
    if agent_id is None:
        agent_id = _get_agent_id(agent_address)
    if agent_id is None:
        return {**base, "reason": "unregistered or no feedback"}

    # Try getSummary(agentId, clientAddresses=[], tag1="", tag2="")
    # ABI encoding: uint256 agentId | offset_for_array(64*3+32=?) | offset_tag1 | offset_tag2 | array_len=0 | tag1_len=0 | tag2_len=0
    # getSummary(uint256, address[], string, string) — dynamic params
    # Slot 0: agentId
    # Slot 1: offset to address[] = 0x80 (4 slots from slot0)
    # Slot 2: offset to string tag1
    # Slot 3: offset to string tag2
    # Slot 4 (0x80): array length = 0
    # Slot 5: tag1 length = 0
    # Slot 6: tag2 length = 0
    calldata = (
        _SEL_GET_SUMMARY
        + _enc_uint256(agent_id)     # agentId
        + _enc_uint256(0x80)         # offset to address[]
        + _enc_uint256(0xA0)         # offset to tag1 string
        + _enc_uint256(0xC0)         # offset to tag2 string
        + _enc_uint256(0)            # address[] length = 0
        + _enc_uint256(0)            # tag1 string length = 0
        + _enc_uint256(0)            # tag2 string length = 0
    )
    try:
        resp = _rpc_call("eth_call", [{"to": REPUTATION_REGISTRY, "data": calldata}, "latest"])
        raw = resp.get("result", "0x")
        if raw and raw != "0x" and "error" not in resp:
            # Returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)
            # Slot 0: count (uint64, zero-padded to 256)
            # Slot 1: summaryValue (int128, sign-extended)
            # Slot 2: summaryValueDecimals (uint8)
            count = _dec_uint256(raw, 0)
            if count > 0:
                summary_value = _dec_int128(raw, 1)
                decimals = _dec_uint256(raw, 2)
                # Normalise to 0-100 float: value / 10^decimals, clamped
                score_float = summary_value / (10 ** decimals) if decimals >= 0 else float(summary_value)
                score_normalised = max(0.0, min(100.0, score_float))
                return {**base, "raw_score": score_normalised}
            else:
                return {**base, "reason": "no feedback recorded"}
    except Exception:
        pass

    # Fallback: raw eth_call with original selector 0x7abe06e1
    try:
        fallback_calldata = "0x7abe06e1" + _enc_address(agent_address)
        resp2 = _rpc_call("eth_call", [{"to": REPUTATION_REGISTRY, "data": fallback_calldata}, "latest"])
        raw2 = resp2.get("result", "0x")
        if raw2 and raw2 != "0x" and "error" not in resp2:
            score = _dec_uint256(raw2, 0)
            if score > 0:
                return {**base, "raw_score": float(min(score, 100))}
    except Exception:
        pass

    return {**base, "reason": "unregistered or no feedback"}


def get_payment_history(agent_address: str) -> dict:
    try:
        resp = _rpc_call("eth_getTransactionCount", [agent_address, "latest"])
        raw = resp.get("result", "0x0")
        return {"tx_count": int(raw, 16), "source": "x402-proxy"}
    except Exception:
        return {"tx_count": 0, "source": "x402-proxy"}
