"""
Register a wallet as an ERC-8004 agent on Base Mainnet,
then write an initial reputation feedback entry.

Env vars (.env or environment):
    DEMO_PRIVATE_KEY   private key of the wallet to register
    BASE_RPC_URL       RPC endpoint (default: https://mainnet.base.org)

Usage:
    python register_agent.py
"""

import hashlib
import json
import os
import secrets
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from eth_account import Account
from web3 import Web3

load_dotenv()

IDENTITY_REGISTRY  = Web3.to_checksum_address("0x8004A818BFB912233c491871b3d84c89A494BD9e")
REPUTATION_REGISTRY = Web3.to_checksum_address("0x8004B663056A597Dffe9eCcC1965A193B7388713")
ABI_DIR = Path(__file__).parent.parent / "api" / "abi"

LOCAL_API = "http://localhost:8000"


def load_abi(name: str) -> list:
    with open(ABI_DIR / f"{name}.json") as f:
        return json.load(f)


def setup() -> tuple[Web3, object, str]:
    raw_key = os.getenv("DEMO_PRIVATE_KEY", "").strip()
    if not raw_key:
        sys.exit("❌  DEMO_PRIVATE_KEY env var not set")
    if not raw_key.startswith("0x"):
        raw_key = "0x" + raw_key

    rpc_url = os.getenv("BASE_RPC_URL", "https://mainnet.base.org")
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        sys.exit(f"❌  Cannot connect to RPC: {rpc_url}")

    chain_id = w3.eth.chain_id
    if chain_id != 8453:
        sys.exit(f"❌  Wrong network — expected Base Mainnet (8453), got {chain_id}")

    acct = Account.from_key(raw_key)
    print(f"✅  Connected to Base Mainnet (chain {chain_id})")
    print(f"    Wallet  : {acct.address}")

    balance = w3.eth.get_balance(acct.address)
    balance_eth = w3.from_wei(balance, "ether")
    print(f"    Balance : {balance_eth:.6f} ETH")
    if balance == 0:
        sys.exit("❌  Wallet has zero ETH — fund it before registering")

    return w3, acct, raw_key


def send_tx(w3: Web3, fn, acct, raw_key: str) -> object:
    """Build, sign, send a contract call and return the receipt."""
    tx = fn.build_transaction({
        "from": acct.address,
        "nonce": w3.eth.get_transaction_count(acct.address),
        "gasPrice": w3.eth.gas_price,
    })
    tx["gas"] = w3.eth.estimate_gas(tx)
    signed = w3.eth.account.sign_transaction(tx, raw_key)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    return tx_hash, w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)


def step1_register(w3: Web3, acct, raw_key: str) -> int:
    print(f"\n📝  Registering {acct.address} in IdentityRegistry...")

    identity = w3.eth.contract(address=IDENTITY_REGISTRY, abi=load_abi("IdentityRegistry"))

    # Skip if already registered
    if identity.functions.balanceOf(acct.address).call() > 0:
        print("    Already registered — fetching existing agentId...")
        logs = identity.events.Registered.get_logs(
            from_block=0,
            argument_filters={"owner": acct.address},
        )
        if not logs:
            sys.exit("❌  Registered but cannot find agentId in logs")
        agent_id = logs[-1]["args"]["agentId"]
        print(f"    agentId : {agent_id}")
        return agent_id

    agent_uri = f"https://swarmpay.tech/agents/{acct.address.lower()}"
    fn = identity.functions.register(agent_uri)

    tx_hash, receipt = send_tx(w3, fn, acct, raw_key)
    if receipt.status != 1:
        sys.exit(f"❌  register() reverted — tx: 0x{tx_hash.hex()}")

    # Parse agentId from Registered event in receipt
    events = identity.events.Registered().process_receipt(receipt)
    if not events:
        sys.exit("❌  Registered event not found in receipt")
    agent_id = events[0]["args"]["agentId"]

    print(f"✅  Registered — tx: 0x{tx_hash.hex()}")
    print(f"    Basescan : https://basescan.org/tx/0x{tx_hash.hex()}")
    print(f"    agentId  : {agent_id}")
    return agent_id


def step2_feedback(w3: Web3, acct, raw_key: str, agent_id: int):
    print(f"\n⭐  Writing reputation feedback (score: 75)...")

    reputation = w3.eth.contract(address=REPUTATION_REGISTRY, abi=load_abi("ReputationRegistry"))

    # value=75, valueDecimals=0 → score of 75 (out of 100)
    feedback_hash = bytes.fromhex(
        hashlib.sha256(f"{agent_id}:initial_seed:{int(time.time())}".encode()).hexdigest()
    )

    fn = reputation.functions.giveFeedback(
        agent_id,       # agentId: uint256
        75,             # value: int128
        0,              # valueDecimals: uint8
        "reliability",  # tag1: string
        "payment",      # tag2: string
        f"https://swarmpay.tech/agents/{acct.address.lower()}",  # endpoint: string
        "",             # feedbackURI: string
        feedback_hash,  # feedbackHash: bytes32
    )

    tx_hash, receipt = send_tx(w3, fn, acct, raw_key)
    if receipt.status != 1:
        sys.exit(f"❌  giveFeedback() reverted — tx: 0x{tx_hash.hex()}")

    print(f"✅  Feedback written — tx: 0x{tx_hash.hex()}")
    print(f"    Basescan : https://basescan.org/tx/0x{tx_hash.hex()}")


def step3_verify(address: str):
    print(f"\n🔍  Verifying via API ({LOCAL_API})...")

    try:
        score_r = requests.get(f"{LOCAL_API}/v0/score/{address}", timeout=10)
        id_r    = requests.get(f"{LOCAL_API}/v0/agent/{address}/identity", timeout=10)
    except requests.exceptions.ConnectionError:
        print(f"⚠️   API not running at {LOCAL_API} — start with:")
        print(f"      cd api && uvicorn api.index:app --port 8000")
        return

    score_data = score_r.json()
    id_data    = id_r.json()

    score      = score_data.get("score", "?")
    tier       = score_data.get("tier", "?")
    registered = id_data.get("registered", False)
    token_id   = id_data.get("token_id")

    print(f"✅  Score: {score} ({tier}) | Registered: {str(registered).lower()} | TokenId: {token_id}")
    print(f"\n    Score response  : {score_r.text}")
    print(f"    Identity response: {id_r.text}")


def main():
    w3, acct, raw_key = setup()
    agent_id = step1_register(w3, acct, raw_key)
    step2_feedback(w3, acct, raw_key, agent_id)
    step3_verify(acct.address)
    print(f"\n🎉  Done. Agent {acct.address} registered as agentId={agent_id}.")


if __name__ == "__main__":
    main()
