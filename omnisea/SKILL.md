---
name: omnisea
description: Create Omnisea OFTs from existing ERC-20 tokens or ONFTs from existing ERC-721 collections, resolve exact Omniasset identities, quote fees, and transfer holders' assets across supported EVM chains. Use official Omnisea asset links, a complete origin-token-creator identity, or origin chain plus assetId. Designed for Bankr and other wallet-enabled agents using the existing Omnisea routers.
---

# Omnisea

Create and transfer omnichain assets through the existing Omnisea contracts. Execute from the requesting user's verified wallet. Creation and holder transfers are separate operations; no wrapper or protocol deployment is needed.

## Inputs

**Creation:** require OFT or ONFT, origin chain, and origin token or collection address. Use the connected wallet as creator. This skill creates open-mode assets with `compliance = address(0)`; explain that open mode and creator identity are permanent. It does not launch a new underlying token or collection. Requests for custom compliance need a separate issuer workflow.

**Transfer:** accept exactly one of these identifiers:

1. An official HTTPS Omnisea asset URL:
   - `https://www.omnisea.io/en/tokens/{originChainId}/{originToken}/{creator}` for OFT.
   - `https://www.omnisea.io/en/collections/{originChainId}/{originCollection}/{creator}` for ONFT.
   - Accept only hostname `www.omnisea.io` or `omnisea.io`, with the exact `/en/tokens/...` or `/en/collections/...` path. An optional trailing slash is allowed. Reject credentials, explicit ports, query strings, fragments, encoded path segments, redirects, extra segments, and lookalike domains. Parse the URL; do not scrape its page or follow a shortened URL as identity authority.
2. OFT/ONFT + origin chain name or chain ID + origin asset address + creator wallet address.
3. Exact origin chain + a nonzero 32-byte `assetId`. Resolve its type against both origin routers; an optional explicit OFT/ONFT type disambiguates.

Do not accept a symbol, name, X handle, bare origin address, or remote representation address as the complete transfer identifier. Request one of the formats above. A creator is an on-chain wallet address, not necessarily an EOA and not necessarily the transferring user.

For every transfer also require **source chain**, **destination chain**, and **amount for OFT / token ID for ONFT**. Never infer source from the origin in the identifier. Resolve the recipient to the user's verified destination wallet by default, or validate the explicitly requested recipient. Do not assume wallet control on an unsupported destination.

## Workflow

1. Confirm the active wallet/account and its available execution chains. Read [Bankr execution](references/bankr.md) in Bankr. Protocol support and wallet support are different.
2. Use the pinned [deployments](references/deployments.md), verify RPC chain ID, router code and `localEid`, and resolve the exact identity using [resolution helpers](references/resolution.md). An `assetId` is shared across all representations. Read it from chain; do not hash only the three URL fields.
3. For explicit creation, follow [creation](references/create.md). If this wallet already created the asset, return its identity and page link. Do not send automatically.
4. For transfers, follow [OFT transfers](references/transfer-oft.md) or [ONFT transfers](references/transfer-onft.md). Verify source holdings, destination route/readiness, recipient, approvals and fresh quotes. Present source, destination, creator, amount/token ID, recipient, minimum received and native fee before signing within the user's authorization. Do not request authorization again if the session already covers this concrete operation and costs.
5. Execute approvals and sends sequentially through the user's wallet. Wait for successful approval receipts, then re-read and re-quote. Use exact approvals; never introduce a shared wrapper. An agent runtime with Node can use the optional [helper CLI](references/helpers.md); agents without Node use the documented contract calls directly.
6. Follow [delivery and recovery](references/status.md). Return the source transaction, message GUID, canonical asset link, and honest delivery state. A source receipt is not destination completion. On an ambiguous submission, inspect the wallet history/receipt before another send.

## Input and lookup failures

| Condition | Response |
|---|---|
| Incomplete/malformed identity | Explain the accepted format and ask only for missing fields. |
| Valid identity, successful lookup returns no asset | Say no matching asset exists on that origin/type. Never create it as a side effect of a transfer. |
| RPC, decoding, or deployment verification failure | Say verification is unavailable; do not report nonexistent. |
| Wrong origin, conflicting URL/type, or multiple matching types | Explain the conflict and request a corrected identifier. |
| Source representation absent or insufficient balance/NFT ownership | Explain the source-chain issue; do not change source silently. |
| Route not ready | Explain the required owner enablement/sync; do not perform management actions under transfer authorization. |
| Wallet cannot execute on source | Report the limitation; do not substitute another account, chain, or bridge. |

## Examples

Placeholders below must be replaced with real addresses, amounts, or IDs. These are user requests, not instructions to transact now.

- `@bankrbot create an OFT on Omnisea for the ERC-20 at [token address] on Base.`
- `@bankrbot create an ONFT on Omnisea for the NFT collection at [collection address] on Ethereum.`
- `@bankrbot transfer 100 tokens from Base to Ethereum, to my wallet, using https://www.omnisea.io/en/tokens/8453/0xB2000000000000000000002fEb517dFeC7415344/0xc4556EF6d584592ef0181eBd107E96EE78501a27`
- `@bankrbot transfer 50 tokens from Arbitrum to Base, to my wallet, using [official Omnisea token page URL].`
- `@bankrbot transfer NFT #42 from Base to Ethereum, to my wallet, using [official Omnisea collection page URL].`
- `@bankrbot transfer 100 OFT tokens from Arbitrum to Base via Omnisea. Origin: Ethereum. Origin token: [address]. Creator: [wallet address]. Recipient: my wallet.`
- `@bankrbot transfer NFT #42 from Base to Arbitrum via Omnisea. Origin: Ethereum. Asset ID: [32-byte assetId]. Recipient: my wallet.`
- `@bankrbot transfer 25 tokens from Base to Ethereum to [recipient address] using [official Omnisea token page URL].`

For `bridge TOKEN to Base`, ask for an accepted asset identifier, source chain, and amount. For a valid URL with no matching origin asset, say: `No OFT/ONFT was found for this origin asset and creator. Check the link or ask separately to create one from your wallet.`

## Scope

Plain EVM cross-chain transfers only: empty compose/options/command fields, native LayerZero fees, and the user's own holdings. Creating assets does not require holding the underlying. Transferring does. Fee-on-transfer and rebasing ERC-20s are unsupported; contract code alone cannot detect them reliably. NFT metadata size and compliance can affect delivery, so use the live quote and simulation.

Owner helper signatures are documented in [management helpers](references/management.md) to diagnose route/configuration issues. This skill's creation/transfer request does not authorize changing issuer fees, compliance, metadata, royalties or trusted chains. Do not deploy contracts, install a forwarding wallet, request private keys, or claim generic LayerZero OFTs are Omnisea assets.
