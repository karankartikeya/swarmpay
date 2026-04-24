from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

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
    return {
        "agent_id": agent_address,
        "score": 742,
        "tier": "AA",
        "confidence": "medium",
        "components": {
            "reputation": 297,
            "volume": 186,
            "payment_reliability": 148,
            "validation_rate": 111,
        },
        "data_sources": ["ERC-8004 Reputation Registry", "x402 Payment History"],
        "last_updated": "2026-04-24T00:00:00",
    }
