# Deployment snapshot

Snapshot: 2026-10-09. Exported from confirmed local release manifests, not a guarantee of current route readiness or Bankr support. Recheck RPC chain ID, router bytecode hash, localEid, peers and live asset routes before execution. Unknown chains are unsupported by this skill version. No secret RPC URLs are bundled.

| Chain | EVM chain ID | LayerZero EID | Native fee unit (18 decimals) |
|---|---|---|---|
| Ethereum | 1 | 30101 | ETH |
| Base | 8453 | 30184 | ETH |
| Arbitrum | 42161 | 30110 | ETH |
| Optimism | 10 | 30111 | ETH |
| Polygon | 137 | 30109 | POL |
| BNB Chain | 56 | 30102 | BNB |
| Robinhood Chain | 4663 | 30416 | ETH |
| Ink | 57073 | 30339 | ETH |
| Abstract | 2741 | 30324 | ETH |
| Arc | 5042 | 30417 | USDC |

| Type | Router | Lens |
|---|---|---|
| OFT | 0x96c756BAEFf18BC1A7871b2F5d4173E958be2d89 | 0x31f4D19cE904b523abFe78ECD4Cd0F1150403a29 |
| ONFT | 0x4ee0a410385c7b9A0746D2De0F24aa004ecC0734 | 0xC6254fdC3F65Bd88F57657273353B2f9edD6353C |

These releases use the listed addresses on all ten chains. Per-chain addresses, router runtime hashes and public RPC defaults are in `data/deployments.json`. Do not infer a future deployment from address equality. Arc transaction value is native 18-decimal USDC, not an ERC-20 approval.

ABI subsets are in `abi/`; exact readable signatures are in [signatures.md](signatures.md). Snapshot source paths and SHA-256 hashes are in `data/provenance.json`. The export reads public contract/release data only. It does not copy deployment signers, environment variables, private keys or operator scripts.
