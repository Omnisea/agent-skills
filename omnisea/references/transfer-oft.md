# Transfer OFT

Resolve with [resolution.md](resolution.md). Require explicit source, destination, positive decimal amount, and a verified recipient. Source and destination must differ. Use the wallet that owns the SOURCE holdings, not the creator's wallet. Reject zero recipient and destination router, vault or selected asset facade addresses.

Read source `getAsset(id).localDecimals` and `sharedDecimals`. Convert the human amount exactly into base units using strings/big integers. Reject more fractional digits than localDecimals instead of rounding. Source facade `token()` identifies the balance contract; require `balanceOf(wallet) >= amountLD`.

## Quote

Build the standard IOFT SendParam on the source facade:

```text
dstEid       = destination LayerZero EID (NOT EVM chainId)
to           = recipient address left-padded to bytes32
amountLD     = amount in source local units
minAmountLD  = 0 for initial discovery quote only
extraOptions = 0x
composeMsg   = 0x
oftCmd       = 0x
```

Call with `account/from = wallet`:

```text
(limit, feeDetails, receipt) = facade.quoteOFT(sendParam)
sendParam.minAmountLD = receipt.amountReceivedLD
fee = facade.quoteSend(sendParam, false)
```

For this plain-transfer profile, default minimum received to the exact quoted received amount, or use an explicitly user-authorized minimum. Requote if this cannot be met; never silently loosen it. Reject zero output. Amount sent may be lower than requested because shared-decimal dust is retained; show actual sent, dust, owner token fee and received amount. `quoteSend` includes the flat asset fee and LayerZero delivery fee. Native execution gas is additional. Quotes do not prove compliance or future token behavior.

`fee.lzTokenFee` must be zero. `fee.nativeFee` is the source native fee in base units. There is no fixed bridging fee and no hardcoded destination gas; first deployment and configured destination gas floors affect the quote.

## Approval and send

If `approvalRequired()` is true, read `underlying.allowance(wallet, facade)`. If insufficient, approve this adapter for the requested amount. For an existing nonzero allowance, reset to zero if needed before setting the new exact amount; wait and read back each successful receipt. Never approve the router/vault or grant an unlimited amount. Remote OFTs require no approval to send their owner's balance.

After approval, refresh route checks, holdings and both quotes. Respect the accepted minimum and native fee budget. Simulate the exact send from the holder, then execute:

```text
facade.send(sendParam, fee, wallet)
msg.value = fee.nativeFee
```

The last parameter is the native-fee refund address. Refund it to the requesting wallet. The router requires `msg.value == fee.nativeFee`; do not attach an extra buffer without changing the fee tuple and verifying the wallet's cost policy. Prefer a fresh exact quote.

Use the expanded tuple signature in [signatures.md](signatures.md). Do NOT call `Omnisea.send(from,...)` directly; only the registered facade can. Do not wrap the call in a generic multicall contract: that would become the recorded sender. Wallet-native batching requires separately verified support.

Record source receipt, `TransferSent.guid`/`OFTSent.guid`, id and expected destination. Follow [status.md](status.md). Do not resubmit an already successful source send while delivery is pending.
