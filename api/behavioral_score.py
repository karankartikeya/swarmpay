from datetime import datetime, timezone
from statistics import stdev

USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"


def _tx_volume_score(count: int) -> int:
    if count == 0:
        return 0
    if count <= 5:
        return 50
    if count <= 20:
        return 100
    if count <= 50:
        return 150
    return 200


def _wallet_age_score(days: float) -> int:
    if days < 1:
        return 0
    if days <= 7:
        return 50
    if days <= 30:
        return 100
    return 150


def _failure_rate_score(total: int, failed: int) -> int:
    if total == 0:
        return 150
    rate = failed / total
    if rate == 0:
        return 150
    if rate < 0.05:
        return 120
    if rate < 0.10:
        return 80
    if rate < 0.20:
        return 40
    return 0


def _counterparty_score(unique: int) -> int:
    if unique <= 1:
        return 20
    if unique <= 5:
        return 80
    if unique <= 15:
        return 140
    return 200


def _automation_score(txs: list, address: str) -> int:
    score = 0
    if len(txs) < 2:
        return score

    gas_prices = [int(t.get("gasPrice", 0)) for t in txs if t.get("gasPrice")]
    if gas_prices and len(gas_prices) > 1:
        try:
            cv = stdev(gas_prices) / (sum(gas_prices) / len(gas_prices))
            if cv < 0.05:
                score += 50
        except ZeroDivisionError:
            pass

    timestamps = sorted([int(t["timeStamp"]) for t in txs if t.get("timeStamp")])
    if len(timestamps) >= 3:
        intervals = [timestamps[i+1] - timestamps[i] for i in range(len(timestamps)-1)]
        try:
            cv = stdev(intervals) / (sum(intervals) / len(intervals))
            if cv < 0.2:
                score += 50
        except ZeroDivisionError:
            pass

    # NFT check — absence of ERC-721 input patterns (simplified: no tokenId field in erc20)
    score += 50  # caller passes only erc20; NFT check done at endpoint level

    if len(timestamps) >= 2:
        span_days = (timestamps[-1] - timestamps[0]) / 86400
        if span_days > 0 and len(txs) / span_days > 1:
            score += 50

    return min(score, 200)


def _usdc_score(erc20_txs: list) -> int:
    count = sum(
        1 for t in erc20_txs
        if t.get("contractAddress", "").lower() == USDC_BASE
    )
    if count == 0:
        return 0
    if count <= 5:
        return 40
    if count <= 20:
        return 70
    return 100


def compute_behavioral_score(txs: list, erc20_txs: list, address: str) -> dict:
    addr_lower = address.lower()

    failed = sum(1 for t in txs if t.get("isError") == "1")
    total = len(txs)

    counterparties = set()
    for t in txs:
        if t.get("from", "").lower() != addr_lower:
            counterparties.add(t["from"].lower())
        if t.get("to", "").lower() != addr_lower:
            counterparties.add(t.get("to", "").lower())

    timestamps = sorted([int(t["timeStamp"]) for t in txs if t.get("timeStamp")])
    first_ts = timestamps[0] if timestamps else None
    last_ts = timestamps[-1] if timestamps else None
    wallet_age_days = (last_ts - first_ts) / 86400 if first_ts and last_ts else 0

    vol = _tx_volume_score(total)
    age = _wallet_age_score(wallet_age_days)
    fail = _failure_rate_score(total, failed)
    cp = _counterparty_score(len(counterparties))
    auto = _automation_score(txs, addr_lower)
    usdc = _usdc_score(erc20_txs)

    score = vol + age + fail + cp + auto + usdc

    if score < 100:
        tier = "Unrated"
    elif score < 300:
        tier = "C"
    elif score < 600:
        tier = "A"
    elif score < 800:
        tier = "AA"
    else:
        tier = "AAA"

    usdc_count = sum(
        1 for t in erc20_txs
        if t.get("contractAddress", "").lower() == USDC_BASE
    )

    def _iso(ts):
        if ts is None:
            return None
        return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()

    return {
        "score": score,
        "tier": tier,
        "components": {
            "transaction_volume": vol,
            "wallet_age": age,
            "failure_rate": fail,
            "counterparty_diversity": cp,
            "automation_probability": auto,
            "usdc_activity": usdc,
        },
        "signals": {
            "total_transactions": total,
            "failed_transactions": failed,
            "unique_counterparties": len(counterparties),
            "wallet_age_days": round(wallet_age_days, 1),
            "usdc_transfers": usdc_count,
            "first_seen": _iso(first_ts),
            "last_seen": _iso(last_ts),
        },
    }
