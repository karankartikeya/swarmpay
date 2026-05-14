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
# Also load demo/.env for MERCHANT_PRIVATE_KEY
_demo_env = Path(__file__).parent.parent / "demo" / ".env"
if _demo_env.exists():
    load_dotenv(_demo_env, override=False)

IDENTITY_REGISTRY  = Web3.to_checksum_address("0x24c1F275a5b789A6537D63f921D923c5b44937a3")
REPUTATION_REGISTRY = Web3.to_checksum_address("0x7E2fbDb30Eb42693a3811C9AbEE9694855D275cF")
ABI_DIR = Path(__file__).parent.parent / "api" / "abi"

LOCAL_API = "http://localhost:8000"
FUND_AMOUNT_WEI = Web3.to_wei(0.00005, "ether")  # enough for ~3 giveFeedback txs


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
    base_fee = w3.eth.get_block("latest")["baseFeePerGas"]
    priority = w3.to_wei(0.01, "gwei")
    max_fee = base_fee * 2 + priority
    # Pass gas=1 to suppress web3's auto estimate_gas in build_transaction;
    # we replace it immediately after with our own estimate.
    tx = fn.build_transaction({
        "from": acct.address,
        "nonce": w3.eth.get_transaction_count(acct.address),
        "type": 2,
        "maxPriorityFeePerGas": priority,
        "maxFeePerGas": max_fee,
        "chainId": 8453,
        "gas": 1,  # placeholder — overwritten below
    })
    estimated = w3.eth.estimate_gas({k: v for k, v in tx.items() if k != "gas"})
    tx["gas"] = int(estimated * 1.1)
    cost_eth = w3.from_wei(tx["gas"] * max_fee, "ether")
    print(f"    gas estimate : {estimated:,} (limit {tx['gas']:,})")
    print(f"    max cost     : {cost_eth:.8f} ETH ({float(cost_eth)*2900:.4f} USD)")
    signed = w3.eth.account.sign_transaction(tx, raw_key)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    return tx_hash, w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)


def step1_register(w3: Web3, acct, raw_key: str) -> int:
    print(f"\n📝  Registering {acct.address} in IdentityRegistry...")

    identity = w3.eth.contract(address=IDENTITY_REGISTRY, abi=load_abi("IdentityRegistry"))

    # Skip if already registered
    if identity.functions.balanceOf(acct.address).call() > 0:
        print("    Already registered — scanning ownerOf to find agentId...")
        # Scan token IDs sequentially until we find one owned by this wallet.
        # Cheaper than get_logs(from_block=0) which 413s on public RPCs.
        agent_id = None
        for tid in range(100):
            try:
                owner = identity.functions.ownerOf(tid).call()
                if owner.lower() == acct.address.lower():
                    agent_id = tid
                    break
            except Exception:
                break  # ERC721NonexistentToken — no more tokens
        if agent_id is None:
            sys.exit("❌  Registered but could not find agentId via ownerOf scan")
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


def _get_or_create_merchant(w3: Web3) -> tuple[object, str]:
    """Load merchant wallet from demo/.env MERCHANT_PRIVATE_KEY, or generate + persist one."""
    demo_env = Path(__file__).parent.parent / "demo" / ".env"
    existing_key = os.getenv("MERCHANT_PRIVATE_KEY", "").strip()

    if existing_key:
        if not existing_key.startswith("0x"):
            existing_key = "0x" + existing_key
        merchant = Account.from_key(existing_key)
        print(f"    Merchant wallet: {merchant.address} (loaded from MERCHANT_PRIVATE_KEY)")
        return merchant, existing_key

    # Generate new throwaway wallet
    merchant = Account.create()
    key_hex = merchant.key.hex()
    print(f"    Merchant wallet: {merchant.address} (newly generated)")

    # Persist to demo/.env
    if demo_env.exists():
        env_content = demo_env.read_text().rstrip("\n")
        demo_env.write_text(env_content + f"\nMERCHANT_PRIVATE_KEY=0x{key_hex}\n")
        print(f"    Saved MERCHANT_PRIVATE_KEY to {demo_env}")
    else:
        demo_env.write_text(f"MERCHANT_PRIVATE_KEY=0x{key_hex}\n")
        print(f"    Created {demo_env} with MERCHANT_PRIVATE_KEY")

    return merchant, "0x" + key_hex


def _send_eth(w3: Web3, from_acct, raw_key: str, to_addr: str, amount_wei: int):
    """Send plain ETH transfer."""
    base_fee = w3.eth.get_block("latest")["baseFeePerGas"]
    priority = w3.to_wei(0.01, "gwei")
    tx = {
        "from": from_acct.address,
        "to": Web3.to_checksum_address(to_addr),
        "value": amount_wei,
        "nonce": w3.eth.get_transaction_count(from_acct.address),
        "type": 2,
        "maxPriorityFeePerGas": priority,
        "maxFeePerGas": base_fee * 2 + priority,
        "chainId": 8453,
        "gas": 21_000,
    }
    signed = w3.eth.account.sign_transaction(tx, raw_key)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
    if receipt.status != 1:
        sys.exit(f"❌  ETH transfer reverted: 0x{tx_hash.hex()}")
    return tx_hash


def step2_feedback(w3: Web3, acct, raw_key: str, agent_id: int):
    print(f"\n⭐  Writing reputation feedback via merchant wallet (score: 75)...")

    merchant, merchant_key = _get_or_create_merchant(w3)

    # Fund merchant if needed
    merchant_bal = w3.eth.get_balance(merchant.address)
    if merchant_bal < FUND_AMOUNT_WEI:
        needed = FUND_AMOUNT_WEI - merchant_bal
        agent_bal = w3.eth.get_balance(acct.address)
        if agent_bal < needed + Web3.to_wei(0.00001, "ether"):
            sys.exit(f"❌  Agent wallet has insufficient ETH to fund merchant ({w3.from_wei(agent_bal,'ether'):.8f} ETH)")
        print(f"    Funding merchant with {w3.from_wei(needed,'ether'):.6f} ETH...")
        fund_tx = _send_eth(w3, acct, raw_key, merchant.address, needed)
        print(f"    Fund tx: 0x{fund_tx.hex()}")
        print(f"    Basescan: https://basescan.org/tx/0x{fund_tx.hex()}")
    else:
        print(f"    Merchant already funded: {w3.from_wei(merchant_bal,'ether'):.8f} ETH")

    reputation = w3.eth.contract(address=REPUTATION_REGISTRY, abi=load_abi("ReputationRegistry"))

    feedback_hash = bytes.fromhex(
        hashlib.sha256(f"{agent_id}:initial_seed:{int(time.time())}".encode()).hexdigest()
    )

    fn = reputation.functions.giveFeedback(
        agent_id,
        75,              # value: int128 (score 75/100)
        0,               # valueDecimals: uint8
        "reliability",   # tag1
        "payment",       # tag2
        f"https://swarmpay.tech/agents/{acct.address.lower()}",  # endpoint
        "",              # feedbackURI
        feedback_hash,   # feedbackHash: bytes32
    )

    tx_hash, receipt = send_tx(w3, fn, merchant, merchant_key)
    if receipt.status != 1:
        sys.exit(f"❌  giveFeedback() reverted — tx: 0x{tx_hash.hex()}")

    print(f"✅  Feedback written — tx: 0x{tx_hash.hex()}")
    print(f"    Basescan: https://basescan.org/tx/0x{tx_hash.hex()}")


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