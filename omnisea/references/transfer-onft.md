# Transfer ONFT

Resolve with [resolution.md](resolution.md). Require explicit source and destination chains, a base-10 uint256 tokenId (zero is valid), and a verified recipient. Source and destination must differ. Reject zero recipient and destination router, vault or selected asset facade addresses.

Read source facade `token()` to locate the underlying collection on origin or representation on a remote. Require `ownerOf(tokenId) == requestingWallet`. An approved NFT operator cannot send the holder's NFT as itself: the facade forwards its caller as the sender.

## Quote

Build the IONFT721 SendParam:

```text
dstEid       = destination LayerZero EID
to           = recipient left-padded to bytes32
tokenId      = bigint parsed without floating point
extraOptions = 0x
composeMsg   = 0x
onftCmd      = 0x
```

From the holder account read `facade.quoteSend(sendParam, false)`. It returns `(nativeFee,lzTokenFee)`; require lzTokenFee zero. This covers the flat asset fee plus delivery, including first deployment and the actual metadata payload. Source execution gas is extra. Do not reuse an OFT SendParam or invent an amount/minAmountLD for NFTs. There is no quoteOFT equivalent needed for ONFT.

Current ONFT messages carry full token URI, contract URI and royalty snapshots. Long metadata affects fees/gas and route limits; unreadable metadata can make the quote fail. Do not truncate metadata to force a quote.

## Approval and send

On origin, if `approvalRequired()` is true, read `getApproved(tokenId)` and `isApprovedForAll(wallet, facade)` on the underlying collection. If neither authorizes the adapter, submit `collection.approve(facade, tokenId)`. Prefer this token-specific approval over setApprovalForAll. Wait for success and read it back.

On a remote, the holder calls the ONFT representation directly; no approval is needed. Refresh ownerOf, route readiness and quote after any approval. Simulate and execute from the owner:

```text
facade.send(sendParam, fee, wallet)
msg.value = fee.nativeFee
```

Respect the accepted native fee budget and refund address. Use [signatures.md](signatures.md) for tuple expansion. Do not call OmniseaNFT.send directly or forward through a shared wrapper.

Record source receipt and `TransferSent.guid`/`ONFTSent.guid`. Verify destination `TransferReceived` for the same message/id/tokenId/recipient and the resulting owner. A return to origin releases the original NFT; other destinations receive its representation. Follow [status.md](status.md).
