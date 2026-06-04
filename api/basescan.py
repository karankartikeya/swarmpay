import os
import requests

ALCHEMY_API_KEY = os.getenv("ALCHEMY_API_KEY", "")
ALCHEMY_BASE_URL = f"https://base-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}"

USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"


def _asset_transfers(address: str, category: list, contract_addresses: list = None) -> list:
    payload = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "alchemy_getAssetTransfers",
        "params": [{
            "fromBlock": "0x0",
            "toBlock": "latest",
            "withMetadata": True,
            "excludeZeroValue": False,
            "maxCount": "0x64",  # 100
            "category": category,
            **({"contractAddresses": contract_addresses} if contract_addresses else {}),
        }],
    }

    results = []

    # fetch sent
    payload["params"][0]["fromAddress"] = address
    r = requests.post(ALCHEMY_BASE_URL, json=payload, timeout=10)
    data = r.json()
    results += data.get("result", {}).get("transfers", [])

    # fetch received
    del payload["params"][0]["fromAddress"]
    payload["params"][0]["toAddress"] = address
    r = requests.post(ALCHEMY_BASE_URL, json=payload, timeout=10)
    data = r.json()
    results += data.get("result", {}).get("transfers", [])

    # deduplicate by hash, sort desc by blockNum
    seen = {}
    for t in results:
        seen[t["hash"]] = t
    return sorted(seen.values(), key=lambda x: int(x["blockNum"], 16), reverse=True)


def _normalize_tx(t: dict, address: str) -> dict:
    """Convert Alchemy transfer format to flat dict compatible with behavioral_score.py"""
    addr = address.lower()
    from_addr = (t.get("from") or "").lower()
    to_addr = (t.get("to") or "").lower()

    # map value to wei string
    value = t.get("value") or 0
    value_wei = int(value * 1e18) if isinstance(value, float) else 0

    metadata = t.get("metadata", {})
    ts_raw = metadata.get("blockTimestamp", "")
    # convert ISO to unix timestamp
    ts = 0
    if ts_raw:
        from datetime import datetime, timezone
        try:
            dt = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
            ts = int(dt.timestamp())
        except Exception:
            pass

    return {
        "hash": t.get("hash", ""),
        "from": from_addr,
        "to": to_addr,
        "value": str(value_wei),
        "timeStamp": str(ts),
        "isError": "0",
        "input": "0x" if t.get("category") == "external" else "0xa9059cbb",
        "gasPrice": "0",
        # keep original for erc20 contract detection
        "_contractAddress": (t.get("rawContract", {}).get("address") or "").lower(),
        "_category": t.get("category", ""),
    }


def get_transactions(address: str, page: int = 1, offset: int = 100) -> list:
    """Fetch normal + internal transactions for address on Base via Alchemy"""
    url = f"https://base-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}"
    transfers = _asset_transfers(address, ["external", "internal"])
    return [_normalize_tx(t, address) for t in transfers[:offset]]


def get_erc20_transfers(address: str) -> list:
    """Fetch ERC-20 transfers for address on Base via Alchemy"""
    transfers = _asset_transfers(address, ["erc20"])
    normalized = []
    for t in transfers:
        n = _normalize_tx(t, address)
        n["contractAddress"] = n["_contractAddress"]
        normalized.append(n)
    return normalized
