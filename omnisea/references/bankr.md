# Bankr execution

Use the requesting user's active Bankr wallet, not a deployer, shared wrapper or the Omniasset creator's wallet. Resolve the authenticated account through Bankr's wallet tools (`bankr whoami` or `GET /wallet/me` in an API integration). That endpoint returns wallet addresses and linked social accounts. A username mentioned as creator is not an accepted asset identifier. [Wallet identity](https://docs.bankr.bot/wallet-api/wallet-info/)

Read and encode calls with the included ABI or [expanded signatures](signatures.md). Use Bankr's existing contract-call tools when no script runtime is available. Installing supporting files does not establish that Node or wallet batching is available. [Skill installation](https://docs.bankr.bot/skills/in-bankr/from-github/)

## Value units

The helper emits both native base units and formatted whole units. Omnisea quote values are base units. Bankr's chat contract-call interface currently describes attached native value in WHOLE units, whereas the Wallet API expects base units. State the amount and native currency explicitly in chat, inspect the resulting transaction and ensure its on-chain value equals fee.nativeFee. Never paste a wei integer into a whole-unit input. Arbitrary calls need native gas funding; they are not gas-sponsored. [Bankr arbitrary transactions](https://raw.githubusercontent.com/BankrBot/skills/main/bankr/references/arbitrary-transaction.md)

## API execution (when already configured)

The current Wallet API shape is:

```json
{
  "transaction": {
    "to": "<verified facade or creation router>",
    "chainId": 8453,
    "data": "<ABI-encoded call>",
    "value": "<native base-unit integer string>"
  },
  "description": "Omnisea transfer",
  "waitForConfirmation": true
}
```

Submit through `POST /wallet/submit` only with the user's existing authorized wallet integration. Do not ask the user to paste API keys into chat or store them in this skill. A failure response containing a transaction hash may already have broadcast. This endpoint has no idempotency key: inspect that transaction before another attempt. [Submit reference](https://raw.githubusercontent.com/BankrBot/skills/main/bankr/references/sign-submit-api.md)

## Capability boundary

Check current Bankr support for the source chain before approving or sending. At the 2026-10-09 documentation check, its raw-transaction list overlaps this skill on Ethereum, Base, Polygon, Arbitrum, BNB Chain, Robinhood Chain and Arc. Optimism, Ink and Abstract appear in Omnisea's deployment snapshot but not that Bankr list. Do not claim Bankr execution there without a newer supported capability. A destination also requires a verified controlled recipient; having a protocol route alone does not establish wallet access. [Supported execution chains](https://raw.githubusercontent.com/BankrBot/skills/main/bankr/references/arbitrary-transaction.md)

Follow Bankr's active wallet authorization, security settings and spend limits. Do not change those settings to bypass a rejection. Use separate creation/approval/send calls unless the actual wallet integration demonstrably supports batching while preserving the wallet as msg.sender. A social request or successful skill install alone does not prove a specific transaction was executed.
