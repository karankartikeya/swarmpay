import os
import json
from pathlib import Path
import httpx
from web3 import Web3

BASE_RPC_URL = os.getenv("BASE_RPC_URL", "https://mainnet.base.org")
IDENTITY_REGISTRY = "0x24c1F275a5b789A6537D63f921D923c5b44937a3"
REPUTATION_REGISTRY = "0x7E2fbDb30Eb42693a3811C9AbEE9694855D275cF"

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


def _rpc_call(method: str, params: list, _retries: int = 3) -> dict:
    import time as _time
    payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    with httpx.Client(timeout=8.0) as client:
        for attempt in range(_retries):
            resp = client.post(BASE_RPC_URL, json=payload)
            if resp.status_code == 429 and attempt < _retries - 1:
                _time.sleep(0.5 * (attempt + 1))
                continue
            resp.raise_for_status()
            return resp.json()
    resp.raise_for_status()  # final raise if all retries exhausted
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


def _ownerof_scan(agent_address: str) -> int | None:
    """
    Find the agentId (tokenId) owned by agent_address via sequential ownerOf calls.
    Scans tokenIds 0..N until ERC721NonexistentToken reverts. Returns first match.
    Avoids eth_getLogs which 413s on public Base RPC when fromBlock=0.
    """
    # ownerOf(uint256) selector
    sel = "0x6352211e"
    addr_lower = agent_address.lower()
    for tid in range(200):
        calldata = sel + _enc_uint256(tid)
        try:
            resp = _rpc_call("eth_call", [{"to": IDENTITY_REGISTRY, "data": calldata}, "latest"])
            raw = resp.get("result", "0x")
            if not raw or raw == "0x" or "error" in resp:
                break  # token doesn't exist — no more tokens after this
            owner = "0x" + raw[-40:]
            if owner == addr_lower:
                return tid
        except Exception:
            break
    return None


def get_identity(agent_address: str) -> dict:
    """
    Check IdentityRegistry for a registered agent NFT.
    Returns {"registered": bool, "token_id": int | None, "registry": str}
    """
    result = {"registered": False, "token_id": None, "registry": "ERC-8004 Base Mainnet"}
    try:
        calldata = _SEL_BALANCE_OF + _enc_address(agent_address)
        resp = _rpc_call("eth_call", [{"to": IDENTITY_REGISTRY, "data": calldata}, "latest"])
        raw = resp.get("result", "0x")
        if not raw or raw == "0x" or "error" in resp:
            return result
        balance = _dec_uint256(raw)
        if balance == 0:
            return result
        result["registered"] = True
        token_id = _ownerof_scan(agent_address)
        result["token_id"] = token_id
    except Exception:
        pass
    return result


def _get_clients(agent_id: int) -> list[str]:
    """
    Call getClients(uint256) → address[] on ReputationRegistry.
    Returns list of checksummed addresses that have submitted feedback.
    """
    calldata = _SEL_GET_CLIENTS + _enc_uint256(agent_id)
    try:
        resp = _rpc_call("eth_call", [{"to": REPUTATION_REGISTRY, "data": calldata}, "latest"])
        raw = resp.get("result", "0x")
        if not raw or raw == "0x" or "error" in resp:
            return []
        # ABI-decode dynamic address[]:
        # bytes 0-31  : offset to array data (always 0x20 for single return)
        # bytes 32-63 : array length
        # bytes 64+   : addresses (padded to 32 bytes each)
        data = raw[2:]  # strip 0x
        if len(data) < 128:
            return []
        arr_len = int(data[64:128], 16)
        clients = []
        for i in range(arr_len):
            start = 128 + i * 64
            addr = "0x" + data[start + 24 : start + 64]
            clients.append(Web3.to_checksum_address(addr))
        return clients
    except Exception:
        return []


def _enc_address_array(addresses: list[str]) -> str:
    """ABI-encode address[] as a dynamic type body (length + elements)."""
    n = len(addresses)
    encoded = _enc_uint256(n)
    for addr in addresses:
        encoded += _enc_address(addr)
    return encoded


def get_agent_feedback(agent_address: str) -> dict:
    """
    Fetch feedback summary from ReputationRegistry.
    Resolves address → agentId via ownerOf scan, fetches client list via
    getClients(), then calls getSummary(agentId, clients, "", "").
    Returns {"raw_score": float | None, "source": "ERC-8004", "reason": str | None}
    """
    base = {"source": "ERC-8004", "raw_score": None, "reason": None}

    identity = get_identity(agent_address)
    if not identity["registered"]:
        return {**base, "reason": "unregistered or no feedback"}

    agent_id = identity["token_id"]
    if agent_id is None:
        return {**base, "reason": "could not resolve agentId"}

    clients = _get_clients(agent_id)
    if not clients:
        return {**base, "reason": "no feedback recorded"}

    # ABI-encode getSummary(uint256 agentId, address[] clients, string tag1, string tag2)
    # Head: agentId | offset_clients | offset_tag1 | offset_tag2
    # offset_clients = 4 head slots * 32 = 0x80
    # clients body   = 32 (len) + 32*n bytes
    # offset_tag1    = 0x80 + 32 + 32*n
    # offset_tag2    = offset_tag1 + 32  (tag1 length=0, no data)
    n = len(clients)
    clients_body_len = 32 + 32 * n   # length word + n address words
    off_clients = 0x80
    off_tag1    = off_clients + clients_body_len
    off_tag2    = off_tag1 + 32       # tag1 is empty string: just a length word (=0)

    clients_body = _enc_address_array(clients)

    calldata = (
        _SEL_GET_SUMMARY
        + _enc_uint256(agent_id)
        + _enc_uint256(off_clients)
        + _enc_uint256(off_tag1)
        + _enc_uint256(off_tag2)
        + clients_body
        + _enc_uint256(0)   # tag1 length = 0
        + _enc_uint256(0)   # tag2 length = 0
    )

    try:
        resp = _rpc_call("eth_call", [{"to": REPUTATION_REGISTRY, "data": calldata}, "latest"])
        raw = resp.get("result", "0x")
        if raw and raw != "0x" and "error" not in resp:
            count = _dec_uint256(raw, 0)
            if count > 0:
                summary_value = _dec_int128(raw, 1)
                decimals = _dec_uint256(raw, 2)
                score_float = summary_value / (10 ** decimals) if decimals >= 0 else float(summary_value)
                return {**base, "raw_score": max(0.0, min(100.0, score_float))}
            return {**base, "reason": "no feedback recorded"}
    except Exception:
        pass

    return {**base, "reason": "getSummary call failed"}


def get_payment_history(agent_address: str) -> dict:
    try:
        resp = _rpc_call("eth_getTransactionCount", [agent_address, "latest"])
        raw = resp.get("result", "0x0")
        return {"tx_count": int(raw, 16), "source": "transaction_history"}
    except Exception:
        return {"tx_count": 0, "source": "transaction_history"}
