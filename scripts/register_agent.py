"""
Register a wallet as an ERC-8004 agent on Base Mainnet.

Usage:
    python register_agent.py --address 0x...

Env vars:
    DEMO_PRIVATE_KEY   private key of the signing wallet (required)
    BASE_RPC_URL       RPC endpoint (default: https://mainnet.base.org)
"""

import argparse
import hashlib
import json
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e"
REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713"

ABI_DIR = Path(__file__).parent.parent / "api" / "abi"


def load_abi(name: str) -> list:
    with open(ABI_DIR / f"{name}.json") as f:
        return json.load(f)


def get_w3() -> Web3:
    rpc = os.getenv("BASE_RPC_URL", "https://mainnet.base.org")
    w3 = Web3(Web3.HTTPProvider(rpc))
    if not w3.is_connected():
        sys.exit(f"Cannot connect to RPC: {rpc}")
    return w3


def get_signer(w3: Web3):
    key = os.getenv("DEMO_PRIVATE_KEY")
    if not key:
        sys.exit("DEMO_PRIVATE_KEY env var not set")
    if not key.startswith("0x"):
        key = "0x" + key
    account = w3.eth.account.from_key(key)
    return account, key


def wait_receipt(w3: Web3, tx_hash, label: str):
    print(f"  Waiting for {label} confirmation...", end="", flush=True)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    if receipt.status != 1:
        sys.exit(f"\nTransaction reverted: {tx_hash.hex()}")
    print(" confirmed.")
    return receipt


def register_identity(w3: Web3, account, key: str, address: str) -> int:
    """Call register(agentURI) and return the new agentId."""
    abi = load_abi("IdentityRegistry")
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(IDENTITY_REGISTRY), abi=abi
    )

    # Check already registered
    balance = contract.functions.balanceOf(
        Web3.to_checksum_address(address)
    ).call()
    if balance > 0:
        print(f"Address {address} already registered. Fetching existing agentId...")
        logs = contract.events.Registered.get_logs(
            from_block=0,
            argument_filters={"owner": Web3.to_checksum_address(address)},
        )
        if logs:
            agent_id = logs[-1]["args"]["agentId"]
            print(f"  Existing agentId: {agent_id}")
            return agent_id
        sys.exit("Could not retrieve existing agentId from logs")

    agent_uri = f"https://swarmpay.tech/agents/{address.lower()}"

    nonce = w3.eth.get_transaction_count(account.address)
    gas_price = w3.eth.gas_price

    tx = contract.functions.register(agent_uri).build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "gasPrice": gas_price,
        }
    )
    tx["gas"] = w3.eth.estimate_gas(tx)

    signed = w3.eth.account.sign_transaction(tx, key)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)

    print(f"\n[1/3] Registering identity")
    print(f"  Tx hash : 0x{tx_hash.hex()}")
    print(f"  Basescan: https://basescan.org/tx/0x{tx_hash.hex()}")

    receipt = wait_receipt(w3, tx_hash, "register")

    # Parse Registered event from receipt
    reg_event = contract.events.Registered()
    processed = reg_event.process_receipt(receipt)
    if not processed:
        sys.exit("Registered event not found in receipt")

    agent_id = processed[0]["args"]["agentId"]
    print(f"  agentId : {agent_id}")
    return agent_id


def write_feedback(w3: Web3, account, key: str, agent_id: int):
    """Call giveFeedback() to write an initial reputation entry."""
    abi = load_abi("ReputationRegistry")
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(REPUTATION_REGISTRY), abi=abi
    )

    # value=75 with decimals=0 → score of 75/100
    value = 75
    value_decimals = 0
    tag1 = "payment"
    tag2 = "reliability"
    endpoint = f"https://swarmpay.tech/agents/{account.address.lower()}"
    feedback_uri = ""
    # deterministic hash from agent_id + timestamp
    raw = f"{agent_id}:{int(time.time())}".encode()
    feedback_hash = bytes.fromhex(hashlib.sha256(raw).hexdigest())

    nonce = w3.eth.get_transaction_count(account.address)
    gas_price = w3.eth.gas_price

    tx = contract.functions.giveFeedback(
        agent_id,
        value,
        value_decimals,
        tag1,
        tag2,
        endpoint,
        feedback_uri,
        feedback_hash,
    ).build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "gasPrice": gas_price,
        }
    )
    tx["gas"] = w3.eth.estimate_gas(tx)

    signed = w3.eth.account.sign_transaction(tx, key)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)

    print(f"\n[2/3] Writing reputation feedback")
    print(f"  value   : {value} (tag1={tag1}, tag2={tag2})")
    print(f"  Tx hash : 0x{tx_hash.hex()}")
    print(f"  Basescan: https://basescan.org/tx/0x{tx_hash.hex()}")

    wait_receipt(w3, tx_hash, "giveFeedback")


def fetch_score(address: str):
    """Hit the local API and print the computed score."""
    url = f"http://localhost:8000/v0/score/{address}"
    print(f"\n[3/3] Fetching score from {url}")
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        print(f"  score     : {data['score']} ({data['tier']})")
        print(f"  confidence: {data['confidence']}")
        print(f"  components: {data['components']}")
    except requests.exceptions.ConnectionError:
        print("  API not running locally. Start with: cd api && uvicorn api.index:app")
    except Exception as e:
        print(f"  Error fetching score: {e}")


def main():
    parser = argparse.ArgumentParser(description="Register an ERC-8004 agent")
    parser.add_argument("--address", required=True, help="Wallet address to register")
    args = parser.parse_args()

    address = args.address
    if not address.startswith("0x") or len(address) != 42:
        sys.exit(f"Invalid address: {address}")

    w3 = get_w3()
    account, key = get_signer(w3)

    print(f"Signer  : {account.address}")
    print(f"Target  : {address}")
    print(f"Network : Base Mainnet (chain {w3.eth.chain_id})")
    balance_wei = w3.eth.get_balance(account.address)
    balance_eth = w3.from_wei(balance_wei, "ether")
    print(f"Balance : {balance_eth:.6f} ETH")
    if balance_wei == 0:
        sys.exit("Signer has zero ETH — fund the wallet before registering")

    agent_id = register_identity(w3, account, key, address)
    write_feedback(w3, account, key, agent_id)
    fetch_score(address)

    print(f"\nDone. Agent {address} registered as agentId={agent_id}.")


if __name__ == "__main__":
    main()
