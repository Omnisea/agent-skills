# Delivery, retry and restore

Save the source chain, transaction hash, source facade/router, assetId, destination EID, recipient, amount/tokenId and message GUID when sending. Read logs only from the expected contracts and match all fields.

1. A reverted source receipt means the send did not succeed. An unknown receipt means submission is uncertain; inspect history/nonce/receipt rather than resubmit.
2. A successful source receipt plus TransferSent confirms source submission, not delivery. Report `submitted; destination pending` until destination evidence exists.
3. On destination, query the expected router's `TransferReceived` logs for the GUID, confirm assetId/recipient/amount or tokenId and `restored == false`, and obtain the destination transaction receipt. OFTReceived/ONFTReceived on the verified facade provide additional evidence. Check resulting holdings as corroboration; a balance alone is not proof of this message and can change through other activity.
4. Query `failedMessages(guid)` on destination if delivery stalls. Nonzero messageHash records a router-handled failure. Zero does NOT prove success: the endpoint may not have delivered the message, it may have failed before the router handler, or it may have been cleared by recovery.
5. Use wallet/indexer or LayerZero message tracking for diagnosis if available. Do not invent a delivered status from elapsed time. Bound polling and return a pending status when evidence is unavailable.

## Helpers

Both lenses expose `restoreMessageOf(message)` and `quoteRestore(router,guid,message,extraOptions)`. Both routers expose `retry(guid,message)` and payable `restore(guid,message,extraOptions)`; read their ABI exactly. The original message bytes must match the recorded messageHash. Do not construct them from a guessed amount or URI.

Restore is called on the failed destination and sends a new message returning assets to their original sender on the source. During the grace period only the named restorer (or default original sender) can initiate it; afterwards the protocol allows anyone. The receiver of restored assets never becomes the person calling restore merely because they paid for it. In this skill, direct wallet sends keep the user as original sender.

A retry of the same GUID is not a new transfer. Recovery may involve new native fees; diagnose first and follow the user's actual recovery authorization. Never replay the source send to fix a delivery failure. Endpoint-level failures may require a different LayerZero recovery path; do not claim router.retry fixes every pending message.
