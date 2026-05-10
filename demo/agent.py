"""
SwarmPay x402 demo agent.

Autonomously pays for API access using the HTTP 402 / x402 protocol.
Signs an ERC-3009 transferWithAuthorization using EIP-712 typed data.

Run:
    python agent.py

Env vars (.env):
    AGENT_ADDRESS       checksummed wallet address of the agent
    AGENT_PRIVATE_KEY   private key (with or without 0x prefix)
    MERCHANT_URL        base URL of merchant (default: http://localhost:9000)
"""

import base64
import json
import os
import time
import secrets
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv
from eth_account import Account

load_dotenv()

USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
CHAIN_ID = 8453

_t0 = time.monotonic()


def _ms() -> int:
    return int((time.monotonic() - _t0) * 1000)


def log(icon: str, msg: str):
    print(f"{icon} [{_ms()}ms] {msg}")


def env_required(name: str) -> str:
    val = os.getenv(name, "").strip()
    if not val:
        raise SystemExit(f"Missing env var: {name}")
    return val


def build_payment_header(
    from_addr: str,
    private_key: str,
    to_addr: str,
    value: str,
) -> str:
    """
    Sign an ERC-3009 TransferWithAuthorization using EIP-712 typed data
    and return the base64-encoded JSON payload for the X-PAYMENT header.
    """
    now = int(time.time())
    valid_before = now + 60
    nonce = "0x" + secrets.token_hex(32)

    domain_data = {
        "name": "USD Coin",
        "version": "2",
        "chainId": CHAIN_ID,
        "verifyingContract": USDC_BASE,
    }

    message_types = {
        "TransferWithAuthorization": [
            {"name": "from",        "type": "address"},
            {"name": "to",          "type": "address"},
            {"name": "value",       "type": "uint256"},
            {"name": "validAfter",  "type": "uint256"},
            {"name": "validBefore", "type": "uint256"},
            {"name": "nonce",       "type": "bytes32"},
        ]
    }

    nonce_bytes32 = bytes.fromhex(nonce.removeprefix("0x"))

    message_data = {
        "from":        from_addr,
        "to":          to_addr,
        "value":       int(value),
        "validAfter":  0,
        "validBefore": valid_before,
        "nonce":       nonce_bytes32,
    }

    key = private_key if private_key.startswith("0x") else "0x" + private_key
    signed = Account.sign_typed_data(
        key,
        domain_data=domain_data,
        message_types=message_types,
        message_data=message_data,
    )

    payload = {
        "from":         from_addr,
        "to":           to_addr,
        "value":        value,
        "validAfter":   "0",
        "validBefore":  str(valid_before),
        "nonce":        nonce,
        "signature":    signed.signature.hex()
            if not isinstance(signed.signature, str)
            else signed.signature,
        "tokenName":    "USD Coin",
        "tokenVersion": "2",
    }

    return base64.b64encode(json.dumps(payload).encode()).decode()


def main():
    agent_address = env_required("AGENT_ADDRESS")
    private_key   = env_required("AGENT_PRIVATE_KEY")
    merchant_url  = os.getenv("MERCHANT_URL", "http://localhost:9000")
    endpoint      = f"{merchant_url}/data"

    print(f"\n{'='*60}")
    print(f"  SwarmPay x402 Agent Demo")
    print(f"  Agent   : {agent_address}")
    print(f"  Endpoint: {endpoint}")
    print(f"{'='*60}\n")

    # Step 1 — initial request (no payment)
    log("🤖", f"Agent calling paid endpoint...")
    r1 = requests.get(endpoint, timeout=10)

    if r1.status_code != 402:
        print(f"Expected 402, got {r1.status_code}: {r1.text}")
        raise SystemExit(1)

    body = r1.json()
    accept = body["accepts"][0]
    pay_to      = accept["payTo"]
    amount      = accept["maxAmountRequired"]
    asset       = accept["asset"]
    description = accept["description"]
    amount_usdc = int(amount) / 1_000_000

    log("⚡", f"402 received — payment required: {amount_usdc:.4f} USDC to {pay_to}")
    log("⚡", f"    asset      : {asset}")
    log("⚡", f"    description: {description}")

    # Step 2 — sign ERC-3009
    log("✍️ ", f"Signing ERC-3009 transferWithAuthorization...")
    payment_header = build_payment_header(
        from_addr=agent_address,
        private_key=private_key,
        to_addr=pay_to,
        value=amount,
    )
    log("✍️ ", f"    signature ready ({len(payment_header)} chars base64)")

    # Step 3 — resubmit with payment proof
    log("📤", f"Submitting payment proof...")
    r2 = requests.get(
        endpoint,
        headers={"X-PAYMENT": payment_header},
        timeout=10,
    )

    if r2.status_code == 200:
        data = r2.json()
        log("✅", f"Access granted!")
        log("📦", f"Data received: {json.dumps(data, indent=2)}")
    elif r2.status_code == 402:
        err = r2.json().get("error", "unknown")
        log("❌", f"Payment rejected: {err}")
        raise SystemExit(1)
    else:
        log("❌", f"Unexpected status {r2.status_code}: {r2.text}")
        raise SystemExit(1)

    total = _ms()
    print(f"\n⏱  Total: {total}ms")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
