import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from chain import get_agent_feedback, get_identity, get_payment_history, is_valid_address
from datetime import datetime

app = FastAPI(title="SwarmPay API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    return {
        "address": agent_address,
        "registered": result["registered"],
        "token_id": result["token_id"],
        "registry": "ERC-8004",
        "network": "base-mainnet",
        "registry_address": "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    }

# Vercel handler - try mangum, fall back to raw ASGI
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    handler = app
