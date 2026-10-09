# Resolve an exact asset

Use the ABI subsets in `abi/` or the expanded [signatures](signatures.md). These are reads; no signing is required. Always distinguish EVM chain ID (wallet/RPC) from LayerZero EID (contract routes).

## Origin identity

For a URL or complete tuple, select the origin chain and router by type, then read:

```text
assetId = originRouter.assetOf(originAsset, creator)
asset = originRouter.getAsset(assetId)
```

Zero ID or `exists == false` after successful reads means absent. RPC failures, wrong RPC chain, missing router code, and ABI failures mean verification unavailable. They do not mean absent.

For origin chain + assetId without a type, read `getAsset(assetId)` on BOTH origin routers. Exactly one must return `exists == true`. If both do, require OFT/ONFT; if either read fails, type resolution is incomplete. Verify `originEid` equals the supplied origin chain's EID: a remote copy on the supplied chain is not proof it is the origin.

Verify the origin record's `creator` and `originToken` (OFT) / `originCollection` (ONFT) against the requested identity. These are bytes32-encoded addresses; require the high 12 bytes to be zero before converting to an EVM address. Verify `keccak256(descriptorOf(assetId)) == assetId` and the reverse `assetOf(originAsset, creator) == assetId`.

The asset ID is the hash of the full creation descriptor, including initial metadata, compliance mode and pre-enabled routes (and ONFT ownerVerified). It is NOT just a hash of origin + address + creator. It remains identical across all representations; changing fees or enabling later chains does not create a different asset ID. An ONFT asset ID identifies a collection's Omniasset, while tokenId identifies one NFT.

Return the canonical page with checksummed addresses:

```text
https://www.omnisea.io/en/tokens/{originChainId}/{originToken}/{creator}
https://www.omnisea.io/en/collections/{originChainId}/{originCollection}/{creator}
```

## Source token

Read `sourceRouter.getAsset(assetId)` on the explicitly supplied SOURCE chain. Require `exists`, matching origin EID/creator/original asset, matching descriptor hash, and deployed code at `asset.token`. Verify `sourceRouter.assetIdOf(asset.token) == assetId` and `asset.token.omnisea() == sourceRouter`.

`asset.token` is the call target for `quoteSend` and `send`: the adapter on the origin or the representation on a remote. `assetIdOf` maps a facade, not an arbitrary origin ERC-20/ERC-721, to its ID. A raw representation address is an internal resolving helper, not a fourth accepted user-input form.

The source token's `token()` gives the balance/approval contract: underlying ERC-20/ERC-721 on origin, itself on remotes. `approvalRequired()` is true on origin adapters, false on remote representations. Do not confuse the router with the spender.

## Destination and route readiness

On both source and destination, verify the pinned router, `localEid`, matching peer router bytes32, `peerVm == 1` (EVM), `routeFrozen`, and `routeFrozenAt + ROUTE_ACTIVATION_DELAY <= block.timestamp` for the relevant direction. Source `isChainEnabled(assetId, destinationEid)` must be true.

- If destination `getAsset(assetId).exists`, verify its descriptor/identity and `isChainEnabled(assetId, sourceEid)`.
- If absent, first arrival can deploy it. A successful source quote alone does not prove its incoming asset route will be accepted. Inspect source `preEnabledEids(assetId)`, the origin EID and destination route maturity. An absent destination can initially trust a source that is the origin or a pre-enabled chain, with a mature local route. Otherwise request creator-origin enablement/synchronization before transferring. Compliance-mode destinations require explicit configuration; do not assume first-arrival configuration exists.

`sourceRouter.assetPeer(assetId, destinationEid)` returns a bytes32 prediction when that source route is enabled. Zero can mean disabled/unknown/non-EVM; a nonzero result does NOT mean deployment or destination readiness. Read the destination registry and code. `predictOFT(id)` / `predictONFT(id)` and `predictAdapter(id)` predict local addresses only. Do not substitute the underlying address for an origin adapter.

For a third-chain hop between remotes, both representations use the SAME assetId. The URL remains anchored to the origin.
