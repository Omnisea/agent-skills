# Contract helpers for routes and owner operations

These helpers support diagnosis and separately requested creator actions. Holding a token does not grant creator rights. All actions below must use the wallet whose address matches the asset's creator, except public read helpers and documented recovery operations. The protocol creator is fixed and facade transferOwnership always reverts.

## Shared resolving reads

| Target | Read | Meaning |
|---|---|---|
| Router | assetOf(originAsset, creator) | Origin lookup only. |
| Router | getAsset(assetId) | Local record, including facade and configuration. |
| Router | assetIdOf(facade) | Reverse lookup for a registered facade. |
| Router | descriptorOf(assetId) | Canonical descriptor whose hash is assetId. |
| Router | assetPeer(assetId, eid) | Conditional remote address prediction; not proof of deployment. |
| Router | isChainEnabled(assetId, eid) | Asset trust plus local route maturity. |
| Router | preEnabledEids / enabledEids | Initial descriptor routes / explicit enablements; not substitutes for isChainEnabled. |
| Router | descriptorSent(assetId, eid) | Source descriptor state, not destination delivery confirmation. |
| Router | routeFrozen, routeFrozenAt, peers, peerVm | Protocol route checks. |
| Lens | activePeerEids(router) | Routes a new open-mode asset would pre-enable now. |

## Enabling and synchronization

On the origin, `enableChain(id,eid,remoteCompliance,extraOptions)` enables and sends a sync to that chain. Open-mode remoteCompliance is zero bytes32. Existing compliance assets require their destination compliance contract. After origin enablement, other existing remotes may need origin `syncAsset` to learn/confirm the expanded set.

On a remote, enableChain is a LOCAL owner opt-in only, with zero remoteCompliance and zero native value. It does not send a message. Direct local management requires the creator to control the same address on that chain. Do not assume cross-chain smart-account control.

| Operation on origin | OFT Lens | ONFT Lens |
|---|---|---|
| enableChain | quoteSync(router,id,eid,remoteCompliance,options) | quoteEnableChain(router,id,eid,remoteCompliance,options) |
| syncAsset | quoteSync(router,id,eid,zeroBytes32,options) | quoteSync(router,id,eid,zeroBytes32,options) |
| setRemoteCompliance | quoteSync(router,id,eid,remoteCompliance,options) | quoteSync(router,id,eid,remoteCompliance,options) |

The OFT lens's quoteSync builds an enabled list including eid; the ONFT lens distinguishes enabling from plain sync. Use a fresh quote and simulate the actual operation. A quote does not grant permission or enable a route. Protocol-enforced route maturity still applies.

## Fee and metadata helpers

- OFT: local `setFees(id,flatFee,feeBps)` and `claimFees(id,recipient)`; origin `setRemoteFees` and `withdrawRemoteFees` have corresponding lens `quoteSetRemoteFees` / `quoteWithdrawRemoteFees`.
- ONFT: local `setFees(id,flatFee)` and `claimFees`; origin uses `sendOwnerAction`. NFTLens `encodeSetFees`, `encodeWithdrawFees`, `encodeSetTokenURI`, `encodeSetContractURI`, `encodeSetRoyalty`, `encodeSetTokenRoyalty`, `encodeClaimRoyalties` return `(op,opData)`. Pass them to `quoteOwnerAction(router,id,eid,op,opData,options)` and then `sendOwnerAction`.
- Both: setCompliance only works for assets already created in compliance mode. It cannot convert an open-mode asset.

These methods and output layouts are in the bundled ABIs and [signatures.md](signatures.md). Never infer selector/tuple layout from a method name alone.
