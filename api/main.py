from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from mangum import Mangum

from chain import get_agent_feedback, get_identity, get_payment_history, is_valid_address

load_dotenv()

app = FastAPI(
    title="SwarmPay API",
    description="Agent credit scoring for the x402 payment ecosystem",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/v0/score/{agent_address}")
def get_agent_score(agent_address: str):
    if not is_valid_address(agent_address):
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")

    feedback = get_agent_feedback(agent_address)
    payment = get_payment_history(agent_address)

    rep_score = feedback["raw_score"] if feedback["raw_score"] is not None else 0
    tx_count = payment["tx_count"]

    raw = (rep_score * 0.60) + (min(tx_count / 500, 1.0) * 100 * 0.40)
    final_score = round(raw * 10)

    if final_score > 850:
        tier = "AAA"
    elif final_score > 700:
        tier = "AA"
    elif final_score > 550:
        tier = "A"
    elif final_score >= 400:
        tier = "BBB"
    else:
        tier = "Unrated"

    confidence = "high" if feedback["raw_score"] is not None else "low"

    rep_component = round(rep_score * 0.60 * 10)
    volume_component = round(min(tx_count / 500, 1.0) * 100 * 0.40 * 10)

    return {
        "agent_id": agent_address,
        "score": final_score,
        "tier": tier,
        "confidence": confidence,
        "components": {
            "reputation": rep_component,
            "volume": volume_component,
            "payment_reliability": 0,
            "validation_rate": 0,
        },
        "data_sources": ["ERC-8004 Reputation Registry", "x402 Payment History"],
        "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S"),
    }


@app.get("/v0/agent/{agent_address}/identity")
def get_agent_identity(agent_address: str):
    if not is_valid_address(agent_address):
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")
    return get_identity(agent_address)


handler = Mangum(app, lifespan="off")
