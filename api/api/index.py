import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import re
import time
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from chain import get_agent_feedback, get_identity, get_payment_history, is_valid_address
from basescan import get_transactions, get_erc20_transfers
from behavioral_score import compute_behavioral_score
from datetime import datetime, timezone

app = FastAPI(title="SwarmPay API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://swarmpay.tech",
        "https://www.swarmpay.tech",
        "https://swarmpay.viberank.co.in",
        "https://api.swarmpay.viberank.co.in",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "version": "0.1.0", "network": "base-mainnet"}

@app.get("/v0/score/{agent_address}")
def get_score(agent_address: str):
    if not is_valid_address(agent_address):
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")

    feedback = get_agent_feedback(agent_address)
    payment = get_payment_history(agent_address)

    raw_score = feedback.get("raw_score")
    tx_count = payment.get("tx_count", 0)

    if raw_score is None:
        reputation_component = 0
        volume_component = min(tx_count / 500, 1.0) * 250
        payment_component = 0
        validation_component = 0
    else:
        reputation_component = raw_score * 0.40 * 10
        volume_component = min(tx_count / 500, 1.0) * 0.25 * 1000
        payment_component = raw_score * 0.20 * 10
        validation_component = raw_score * 0.15 * 10

    final_score = round(
        reputation_component + volume_component +
        payment_component + validation_component
    )

    tier = (
        "AAA" if final_score > 850 else
        "AA" if final_score > 700 else
        "A" if final_score > 550 else
        "BBB" if final_score > 400 else
        "Unrated"
    )

    confidence = (
        "high" if tx_count > 100 else
        "medium" if tx_count > 20 else
        "low"
    )

    return {
        "agent_id": agent_address,
        "score": final_score,
        "tier": tier,
        "confidence": confidence,
        "components": {
            "reputation": round(reputation_component),
            "volume": round(volume_component),
            "payment_reliability": round(payment_component),
            "validation_rate": round(validation_component),
        },
        "data_sources": ["ERC-8004 Reputation Registry", "On-chain transaction volume (Base Mainnet)"],
        "last_updated": datetime.utcnow().isoformat(),
    }

@app.get("/v0/agent/{agent_address}/identity")
def get_agent_identity(agent_address: str):
    if not is_valid_address(agent_address):
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")
    try:
        result = get_identity(agent_address)
    except Exception:
        raise HTTPException(status_code=503, detail="rpc_unavailable")
    from chain import IDENTITY_REGISTRY
    return {
        "address": agent_address,
        "registered": result["registered"],
        "token_id": result["token_id"],
        "registry": "ERC-8004",
        "network": "base-mainnet",
        "registry_address": IDENTITY_REGISTRY,
    }


_ETH_ADDRESS_RE = re.compile(r"^0x[0-9a-fA-F]{40}$")

USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"


def _format_tx(tx: dict, address: str) -> dict:
    addr = address.lower()
    is_failed = tx.get("isError") == "1"
    value_wei = int(tx.get("value", 0))
    value_eth = f"{value_wei / 1e18:.6f}".rstrip("0").rstrip(".")

    from_addr = tx.get("from", "").lower()
    to_addr = tx.get("to", "").lower()
    counterparty = to_addr if from_addr == addr else from_addr

    input_data = tx.get("input", "0x")
    if is_failed:
        tx_type = "failed"
    elif input_data and input_data != "0x":
        tx_type = "contract_call"
    elif value_wei > 0:
        tx_type = "payment"
    else:
        tx_type = "transfer"

    ts = int(tx.get("timeStamp", 0))
    iso_ts = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts else None

    return {
        "hash": tx.get("hash"),
        "type": tx_type,
        "value_eth": value_eth if value_eth else "0",
        "counterparty": counterparty,
        "timestamp": iso_ts,
        "status": "failed" if is_failed else "success",
    }


@app.get("/v0/explore/{address}")
def explore_address(address: str):
    if not _ETH_ADDRESS_RE.match(address):
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")

    txs = get_transactions(address)
    erc20_txs = get_erc20_transfers(address)

    if not txs:
        return {
            "address": address,
            "score": 0,
            "tier": "Unrated",
            "message": "No transaction history found on Base mainnet",
        }

    result = compute_behavioral_score(txs, erc20_txs, address)

    recent = [_format_tx(t, address) for t in txs[:10]]

    return {
        "address": address,
        "score": result["score"],
        "tier": result["tier"],
        "components": result["components"],
        "signals": result["signals"],
        "recent_transactions": recent,
        "powered_by": "SwarmPay Behavioral Intelligence",
        "network": "base-mainnet",
    }


_TIER_COLORS = {
    "AAA": "#1ABC9C",
    "AA":  "#27AE60",
    "A":   "#2F80ED",
    "C":   "#E4C63A",
    "Unrated": "#9B9B9B",
}

def _make_badge_svg(score: int, tier: str) -> str:
    right_color = _TIER_COLORS.get(tier, "#9B9B9B")
    right_text = f"{score} | {tier}"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="200" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="90" height="20" fill="#555"/>
    <rect x="90" width="110" height="20" fill="{right_color}"/>
    <rect width="200" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" font-family="Verdana,Geneva,sans-serif" font-size="11" text-anchor="middle">
    <text x="45" y="15" fill="#010101" fill-opacity=".3">SwarmPay Score</text>
    <text x="45" y="14">SwarmPay Score</text>
    <text x="145" y="15" fill="#010101" fill-opacity=".3">{right_text}</text>
    <text x="145" y="14">{right_text}</text>
  </g>
</svg>"""


@app.get("/v0/badge/{address}")
def get_badge(address: str):
    if not _ETH_ADDRESS_RE.match(address):
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")

    txs = get_transactions(address)
    erc20_txs = get_erc20_transfers(address)

    if not txs:
        score, tier = 0, "Unrated"
    else:
        result = compute_behavioral_score(txs, erc20_txs, address)
        score, tier = result["score"], result["tier"]

    svg = _make_badge_svg(score, tier)
    return Response(
        content=svg,
        media_type="image/svg+xml",
        headers={"Cache-Control": "no-cache, max-age=3600"},
    )


# ── Leaderboard ──────────────────────────────────────────────────────────────

_SEED_ADDRESSES = [
    "0x572b8caf4FbEAC5358946acD2C5EFfeeB035D028",  # SwarmPay demo
    "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",  # vitalik.eth
    "0x3304E22DDaa22bCdC5fCa2269b418046aE7b566A",  # Base early deployer
    "0x77777777770B7bC0b6E0E2b9dC9b1F06C0A8C5D5",  # Active Base trader
    "0x6969696969696969696969696969696969696969",  # Known Base meme addr
    "0xAbCd1234567890aBcD1234567890aBcD12345678",  # Placeholder active
    "0x000000000000000000000000000000000000dEaD",  # Burn address
    "0xbaAA2a3237035A2c7fA2A33c76B44a8C6Fe18e87",  # Base active EOA
    "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",  # Uniswap v3 router Base
    "0x2626664c2603336E57B271c5C0b26F421741e481",  # Uniswap v3 swap router
    "0xDef1C0ded9bec7F1a1670819833240f027b25EfF",  # 0x exchange proxy
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",  # Uniswap v2 router
]

_leaderboard_cache: dict = {"ts": 0.0, "data": []}
_CACHE_TTL = 3600  # 1 hour


def _score_address(address: str) -> dict | None:
    try:
        txs = get_transactions(address)
        erc20_txs = get_erc20_transfers(address)
        if not txs:
            return None
        result = compute_behavioral_score(txs, erc20_txs, address)
        return {
            "address": address,
            "short": address[:6] + "…" + address[-4:],
            "score": result["score"],
            "tier": result["tier"],
            "total_txs": result["signals"]["total_transactions"],
            "wallet_age_days": result["signals"]["wallet_age_days"],
        }
    except Exception:
        return None


@app.get("/v0/leaderboard")
def get_leaderboard(refresh: bool = Query(default=False)):
    global _leaderboard_cache
    now = time.time()
    if not refresh and now - _leaderboard_cache["ts"] < _CACHE_TTL and _leaderboard_cache["data"]:
        return {
            "entries": _leaderboard_cache["data"],
            "cached_at": datetime.fromtimestamp(_leaderboard_cache["ts"], tz=timezone.utc).isoformat(),
            "network": "base-mainnet",
        }

    scored = []
    for addr in _SEED_ADDRESSES:
        entry = _score_address(addr)
        if entry:
            scored.append(entry)

    scored.sort(key=lambda x: x["score"], reverse=True)
    for i, entry in enumerate(scored[:10]):
        entry["rank"] = i + 1

    top10 = scored[:10]
    _leaderboard_cache = {"ts": now, "data": top10}

    return {
        "entries": top10,
        "cached_at": datetime.fromtimestamp(now, tz=timezone.utc).isoformat(),
        "network": "base-mainnet",
    }


@app.get("/v1/why/{reason}")
def why(reason: str, session_id: str = ""):
    return {"reason": reason, "session_id": session_id}


@app.post("/v1/events")
def post_event(payload: dict = None):
    return {"ok": True}

# Vercel handler - try mangum, fall back to raw ASGI
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    handler = app
