# Optional Node helper

The skill works with direct contract calls. This CLI adds strict input parsing, on-chain asset resolution and live quotes where a Node runtime is available. It does not connect a wallet, simulate sends, sign, broadcast, or automatically create an asset. Native gas estimation and exact-send simulation remain steps for the wallet tools after any approval.

From the installed skill directory:

```sh
npm ci --ignore-scripts
node scripts/omnisea.mjs parse examples/identity.json
node scripts/omnisea.mjs resolve examples/identity.json
node scripts/omnisea.mjs quote request.local.json
```

`parse` is offline. `resolve` and `quote` make read-only RPC calls. Public RPC defaults are bundled; optionally configure `OMNISEA_RPC_<chainId>` in the host environment. Do not put credential-bearing URLs in prompts, requests, output artifacts or the skill package. Errors suppress raw RPC details.

## Identity input

Use exactly one object shape:

```json
{"url":"https://www.omnisea.io/en/tokens/8453/0xB2000000000000000000002fEb517dFeC7415344/0xc4556EF6d584592ef0181eBd107E96EE78501a27"}
```

```json
{"type":"OFT","originChain":"Base","originAsset":"<address>","creator":"<address>"}
```

```json
{"originChain":"Base","assetId":"<bytes32>"}
```

The last form permits an optional type if needed for disambiguation. Addresses must be lower/upper case or correctly checksummed. The example URL is a parsing fixture supplied in the project brief, not a guarantee that its asset exists or that a user owns it.

## Quote input

```json
{
  "identity": {"url":"<official complete Omnisea URL>"},
  "sourceChain":"Base",
  "destinationChain":"Ethereum",
  "wallet":"<authenticated source wallet>",
  "recipient":"<verified destination recipient>",
  "amount":"100"
}
```

For ONFT replace amount with `"tokenId":"42"`. Both are strings, never floating point. Source is required even when it equals origin. The agent must fill wallet and recipient from actual account evidence; the CLI intentionally does not infer authentication or default recipient.

Output includes resolved identity/page, source facade, destination prediction/deployment state, SendParam, fee tuple, approval requirements, OFT sent/received/dust amounts, native currency, fee in both units and quote block. `simulated:false` is deliberate: do not present the quote as an execution guarantee. A quote is stale after state changes or approval transactions; re-quote, retain the user's minimum/fee cap, then simulate the exact send.

No transaction is emitted for automatic broadcasting. To encode after verification, use `encodeFunctionData` with `abi/OFTAdapter.json` or `abi/ONFT721Adapter.json`, functionName `send`, arguments `[params,fee,wallet]`; use fee.nativeFee as transaction value in base units. Creation uses the matching router ABI and `[originAsset,zeroAddress]` with zero value after the [creation checks](create.md).

The helper does not classify arbitrary ERC-20 token behavior, manage assets, recover messages, or poll delivery. Follow the references for those checks. Runtime code hashes are checked against the snapshot and may require a reviewed skill update if deployments change; do not disable the check to make a request pass.
