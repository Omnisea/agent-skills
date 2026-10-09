# Create an OFT or ONFT

Required request: type + origin chain + origin asset address. This skill's creation profile is open mode, `compliance = address(0)`. The wallet calling createAsset becomes permanent creator. No balance in the underlying is needed to create. No token approval is needed for creation.

1. Resolve the user's execution wallet and origin network. Read the pinned router's code/hash and localEid. Validate the origin address has code and is an ERC-20 (OFT) or ERC-721 (ONFT). For ONFT check ERC-165 `supportsInterface(0x80ac58cd)`; ERC-1155 is not supported. Reject Omnisea facades and the router vault as underlying.
2. Read `assetOf(originAsset, wallet)`. If nonzero, verify the record and return the existing page. Do not silently replace its creator or compliance mode. If creation races, read back after AssetAlreadyExists; it is not a reason to change identity.
3. Read token metadata or collection name/symbol and simulate creation from this wallet. For ERC-20, establish plain-transfer behavior from reliable token documentation/source: fee-on-transfer and rebasing tokens are unsupported. Metadata reads alone cannot establish compatibility. If uncertain, say so and resolve compatibility before execution.
4. Explain origin, asset, creator and permanent open mode. The creator may later manage fees and enable chains; open mode cannot later become compliance mode. Review active initial routes with `lens.activePeerEids(router)`; the creation-time route set is what the transaction registers.
5. Call the selected origin router, from the user's wallet, with native value zero:

```solidity
createAsset(address originAsset, address compliance)
// compliance = 0x0000000000000000000000000000000000000000
```

6. Wait for a successful transaction receipt. Decode `AssetCreated` ONLY from the expected router. Transactions do not expose Solidity return values as normal receipt fields. Cross-check `assetOf`, `getAsset`, deployed adapter and descriptor hash. Return type, assetId, creator, adapter, canonical page URL and transaction hash.

The ONFT `ownerVerified` flag reflects whether the calling wallet matched the underlying collection's owner() at creation. Any wallet can otherwise register an asset; this flag grants no extra management power.

Creation deploys the origin adapter. Remote OFTs/ONFTs appear on first transfer or a creator's enabling sync. Do not promise a deployed token address on every remote just because prediction succeeds. A creation request does not authorize an immediate transfer.
