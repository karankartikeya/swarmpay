"""
Deploy IdentityRegistry and ReputationRegistry as UUPS proxies to Base Mainnet.

Steps:
  1. Install solc 0.8.24 via solcx
  2. Install OZ contracts via npm into contracts/node_modules
  3. Compile both implementation contracts
  4. Deploy impl1 (IdentityRegistry)
  5. Deploy ERC-1967 proxy for IdentityRegistry, call initialize()
  6. Deploy impl2 (ReputationRegistry)
  7. Deploy ERC-1967 proxy for ReputationRegistry, call initialize(identityProxyAddr)
  8. Verify both proxies work (balanceOf, getIdentityRegistry)

Usage:
    cd /path/to/swarmpay
    python contracts/deploy.py
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from eth_account import Account
from web3 import Web3

load_dotenv("scripts/.env")

RPC_URL = os.getenv("BASE_RPC_URL", "https://mainnet.base.org")
RAW_KEY = os.getenv("DEMO_PRIVATE_KEY", "").strip()
if not RAW_KEY.startswith("0x"):
    RAW_KEY = "0x" + RAW_KEY

CONTRACTS_DIR = Path(__file__).parent
SRC_DIR = CONTRACTS_DIR / "src"
NODE_MODULES = CONTRACTS_DIR / "node_modules"

# ERC-1967 proxy bytecode (minimal UUPS proxy from OZ)
# This is the standard ERC1967Proxy constructor bytecode that:
#   - takes (address implementation, bytes memory _data) in constructor
#   - stores impl at ERC-1967 slot
#   - calls _data on impl (used for initialize())
# We build it dynamically using the OZ ERC1967Proxy ABI + bytecode from compilation.


def setup_w3():
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        sys.exit(f"Cannot connect to {RPC_URL}")
    if w3.eth.chain_id != 8453:
        sys.exit(f"Wrong chain: {w3.eth.chain_id}")
    acct = Account.from_key(RAW_KEY)
    bal = w3.eth.get_balance(acct.address)
    print(f"Wallet : {acct.address}")
    print(f"Balance: {w3.from_wei(bal, 'ether'):.6f} ETH")
    if bal == 0:
        sys.exit("Wallet has zero ETH")
    return w3, acct


def install_oz():
    if (NODE_MODULES / "@openzeppelin").exists():
        print("OZ already installed, skipping npm install")
        return
    print("Installing @openzeppelin/contracts and contracts-upgradeable...")
    pkg_json = CONTRACTS_DIR / "package.json"
    if not pkg_json.exists():
        pkg_json.write_text(json.dumps({
            "name": "swarmpay-contracts",
            "version": "1.0.0",
            "dependencies": {
                "@openzeppelin/contracts": "^5.0.0",
                "@openzeppelin/contracts-upgradeable": "^5.0.0"
            }
        }, indent=2))
    result = subprocess.run(
        ["npm", "install", "--prefix", str(CONTRACTS_DIR)],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(result.stderr)
        sys.exit("npm install failed")
    print("OZ installed")


def _read_source_with_imports(sol_file: Path, oz_path: Path, visited: set = None) -> dict:
    """Recursively collect all source files needed for compilation."""
    if visited is None:
        visited = set()
    sources = {}
    content = sol_file.read_text()
    key = str(sol_file)
    if key in visited:
        return sources
    visited.add(key)
    sources[str(sol_file)] = {"content": content}
    return sources


def compile_contracts():
    import solcx
    solcx.install_solc("0.8.24")

    oz_path = NODE_MODULES
    print("Compiling contracts via Standard JSON (via-ir, this may take ~60s)...")

    # Build source dict for all our .sol files; imports resolved via remappings
    sources = {}
    for sol_file in SRC_DIR.glob("*.sol"):
        sources[str(sol_file)] = {"content": sol_file.read_text()}

    standard_input = {
        "language": "Solidity",
        "sources": sources,
        "settings": {
            "remappings": [
                f"@openzeppelin/contracts-upgradeable/={oz_path}/@openzeppelin/contracts-upgradeable/",
                f"@openzeppelin/contracts/={oz_path}/@openzeppelin/contracts/",
            ],
            "optimizer": {"enabled": True, "runs": 200},
            "viaIR": True,
            "evmVersion": "cancun",
            "outputSelection": {
                "*": {
                    "*": ["abi", "evm.bytecode.object"]
                }
            }
        }
    }

    output = solcx.compile_standard(
        standard_input,
        allow_paths=[str(SRC_DIR), str(oz_path)],
        solc_version="0.8.24",
    )

    if "errors" in output:
        errors = [e for e in output["errors"] if e["severity"] == "error"]
        if errors:
            for e in errors:
                print(e["formattedMessage"])
            sys.exit("Compilation failed")

    artifacts = {}
    for file_path, contracts in output.get("contracts", {}).items():
        for contract_name, contract_data in contracts.items():
            bytecode = contract_data["evm"]["bytecode"]["object"]
            if bytecode:
                artifacts[contract_name] = {
                    "abi": contract_data["abi"],
                    "bytecode": bytecode,
                }
                print(f"  Compiled {contract_name} ({len(bytecode)//2} bytes)")

    return artifacts


def send_tx(w3, tx, acct):
    tx["nonce"] = w3.eth.get_transaction_count(acct.address)
    tx["chainId"] = 8453
    tx["type"] = 2  # EIP-1559
    base_fee = w3.eth.get_block("latest")["baseFeePerGas"]
    priority = w3.to_wei(0.01, "gwei")
    tx["maxPriorityFeePerGas"] = priority
    tx["maxFeePerGas"] = base_fee * 2 + priority
    if "gas" not in tx:
        try:
            tx["gas"] = int(w3.eth.estimate_gas(tx) * 1.2)
        except Exception as e:
            print(f"  gas estimate failed: {e}, using 3_000_000")
            tx["gas"] = 3_000_000
    # remove legacy gasPrice if present
    tx.pop("gasPrice", None)
    signed = w3.eth.account.sign_transaction(tx, RAW_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"  tx: 0x{tx_hash.hex()}")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
    if receipt.status != 1:
        sys.exit(f"TX REVERTED: 0x{tx_hash.hex()}")
    return receipt


def deploy_impl(w3, acct, artifact, label):
    print(f"\nDeploying {label} implementation...")
    bytecode = artifact["bytecode"]
    if not bytecode.startswith("0x"):
        bytecode = "0x" + bytecode
    tx = {
        "from": acct.address,
        "data": bytecode,
        "value": 0,
    }
    receipt = send_tx(w3, tx, acct)
    addr = receipt["contractAddress"]
    print(f"  {label} impl: {addr}")
    print(f"  Basescan: https://basescan.org/address/{addr}")
    return addr


def deploy_proxy(w3, acct, artifacts, impl_addr, init_calldata, label):
    """Deploy ERC1967Proxy with init calldata."""
    print(f"\nDeploying {label} proxy...")

    # ERC1967Proxy constructor: (address implementation, bytes memory _data)
    proxy_artifact = artifacts.get("ERC1967Proxy")
    if not proxy_artifact:
        sys.exit("ERC1967Proxy not compiled — check OZ install")

    proxy_contract = w3.eth.contract(
        abi=proxy_artifact["abi"],
        bytecode="0x" + proxy_artifact["bytecode"] if not proxy_artifact["bytecode"].startswith("0x") else proxy_artifact["bytecode"]
    )

    tx = proxy_contract.constructor(
        Web3.to_checksum_address(impl_addr),
        init_calldata,
    ).build_transaction({
        "from": acct.address,
        "value": 0,
    })

    receipt = send_tx(w3, tx, acct)
    addr = receipt["contractAddress"]
    print(f"  {label} proxy: {addr}")
    print(f"  Basescan: https://basescan.org/address/{addr}")
    return addr


def save_abis(artifacts, identity_addr, reputation_addr):
    abi_dir = Path(__file__).parent.parent / "api" / "abi"
    for name, artifact in artifacts.items():
        if name in ("IdentityRegistryUpgradeable", "ReputationRegistryUpgradeable", "ERC1967Proxy"):
            out_name = {
                "IdentityRegistryUpgradeable": "IdentityRegistry",
                "ReputationRegistryUpgradeable": "ReputationRegistry",
                "ERC1967Proxy": "ERC1967Proxy",
            }[name]
            path = abi_dir / f"{out_name}.json"
            with open(path, "w") as f:
                json.dump(artifact["abi"], f, indent=2)
            print(f"  Wrote {path}")


def verify_deployment(w3, artifacts, identity_proxy, reputation_proxy, acct):
    print("\nVerifying deployment...")

    id_contract = w3.eth.contract(
        address=Web3.to_checksum_address(identity_proxy),
        abi=artifacts["IdentityRegistryUpgradeable"]["abi"]
    )
    rep_contract = w3.eth.contract(
        address=Web3.to_checksum_address(reputation_proxy),
        abi=artifacts["ReputationRegistryUpgradeable"]["abi"]
    )

    bal = id_contract.functions.balanceOf(acct.address).call()
    print(f"  IdentityRegistry.balanceOf({acct.address}) = {bal} ✅")

    name = id_contract.functions.name().call()
    print(f"  IdentityRegistry.name() = '{name}' ✅")

    owner = id_contract.functions.owner().call()
    print(f"  IdentityRegistry.owner() = {owner}")
    assert owner.lower() == acct.address.lower(), f"owner mismatch: {owner}"
    print(f"  Owner matches deployer ✅")

    id_reg = rep_contract.functions.getIdentityRegistry().call()
    print(f"  ReputationRegistry.getIdentityRegistry() = {id_reg} ✅")
    assert id_reg.lower() == identity_proxy.lower()


def update_chain_py(identity_proxy, reputation_proxy):
    chain_py = Path(__file__).parent.parent / "api" / "chain.py"
    content = chain_py.read_text()

    old_id = None
    old_rep = None
    for line in content.splitlines():
        if "IDENTITY_REGISTRY" in line and "0x" in line:
            import re
            m = re.search(r"0x[0-9a-fA-F]{40}", line)
            if m:
                old_id = m.group()
        if "REPUTATION_REGISTRY" in line and "0x" in line:
            import re
            m = re.search(r"0x[0-9a-fA-F]{40}", line)
            if m:
                old_rep = m.group()

    if old_id:
        content = content.replace(old_id, identity_proxy)
    if old_rep:
        content = content.replace(old_rep, reputation_proxy)

    chain_py.write_text(content)
    print(f"  Updated api/chain.py")
    print(f"    IDENTITY_REGISTRY  : {old_id} → {identity_proxy}")
    print(f"    REPUTATION_REGISTRY: {old_rep} → {reputation_proxy}")


def update_register_agent(identity_proxy, reputation_proxy):
    script = Path(__file__).parent.parent / "scripts" / "register_agent.py"
    content = script.read_text()
    import re

    # Replace hardcoded addresses
    lines = content.splitlines()
    new_lines = []
    for line in lines:
        if "IDENTITY_REGISTRY" in line and "0x8004" in line:
            line = re.sub(r'"0x[0-9a-fA-F]{40}"', f'"{identity_proxy}"', line)
        if "REPUTATION_REGISTRY" in line and "0x8004" in line:
            line = re.sub(r'"0x[0-9a-fA-F]{40}"', f'"{reputation_proxy}"', line)
        new_lines.append(line)

    script.write_text("\n".join(new_lines))
    print(f"  Updated scripts/register_agent.py")


def main():
    print("=== ERC-8004 Contract Deployment ===\n")
    w3, acct = setup_w3()

    install_oz()

    # Also need to compile ERC1967Proxy from OZ
    proxy_sol = SRC_DIR / "ERC1967Proxy.sol"
    proxy_sol.write_text("""// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
""")

    artifacts = compile_contracts()
    proxy_sol.unlink()  # clean up temp file

    if "IdentityRegistryUpgradeable" not in artifacts:
        print("Available:", list(artifacts.keys()))
        sys.exit("IdentityRegistryUpgradeable not compiled")
    if "ReputationRegistryUpgradeable" not in artifacts:
        sys.exit("ReputationRegistryUpgradeable not compiled")
    if "ERC1967Proxy" not in artifacts:
        sys.exit("ERC1967Proxy not compiled")

    # Deploy IdentityRegistry impl
    id_impl = deploy_impl(w3, acct, artifacts["IdentityRegistryUpgradeable"], "IdentityRegistry")
    time.sleep(2)

    # Encode initialize() calldata for IdentityRegistry
    id_impl_contract = w3.eth.contract(
        address=Web3.to_checksum_address(id_impl),
        abi=artifacts["IdentityRegistryUpgradeable"]["abi"]
    )
    id_init_data = id_impl_contract.encode_abi("initialize", args=[])

    # Deploy IdentityRegistry proxy (calls initialize() in constructor)
    id_proxy = deploy_proxy(w3, acct, artifacts, id_impl, bytes.fromhex(id_init_data[2:]), "IdentityRegistry")
    time.sleep(2)

    # Deploy ReputationRegistry impl
    rep_impl = deploy_impl(w3, acct, artifacts["ReputationRegistryUpgradeable"], "ReputationRegistry")
    time.sleep(2)

    # Encode initialize(address) calldata for ReputationRegistry
    rep_impl_contract = w3.eth.contract(
        address=Web3.to_checksum_address(rep_impl),
        abi=artifacts["ReputationRegistryUpgradeable"]["abi"]
    )
    rep_init_data = rep_impl_contract.encode_abi(
        "initialize",
        args=[Web3.to_checksum_address(id_proxy)]
    )

    # Deploy ReputationRegistry proxy (calls initialize(identityProxy) in constructor)
    rep_proxy = deploy_proxy(w3, acct, artifacts, rep_impl, bytes.fromhex(rep_init_data[2:]), "ReputationRegistry")
    time.sleep(2)

    verify_deployment(w3, artifacts, id_proxy, rep_proxy, acct)

    print("\nSaving ABIs and updating addresses...")
    save_abis(artifacts, id_proxy, rep_proxy)
    update_chain_py(id_proxy, rep_proxy)
    update_register_agent(id_proxy, rep_proxy)

    print(f"""
=== DEPLOYMENT COMPLETE ===

IdentityRegistry  proxy : {id_proxy}
IdentityRegistry  impl  : {id_impl}
ReputationRegistry proxy: {rep_proxy}
ReputationRegistry impl : {rep_impl}

Basescan:
  https://basescan.org/address/{id_proxy}
  https://basescan.org/address/{rep_proxy}
""")


if __name__ == "__main__":
    main()
