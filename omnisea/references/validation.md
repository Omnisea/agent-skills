# Validation record

Validated locally on 2026-10-09. No transaction was signed or broadcast.

## Automated checks

- Skill frontmatter/name validator: passed.
- `npm test`: 28 tests passed. Covers strict official URLs, unsafe URL rejection, all three identity forms, missing fields, exact token units, large NFT IDs, absence versus RPC failure, wrong origin/RPC/runtime/descriptor, type ambiguity, origin and remote holdings, approval requirements, first-arrival route checks, OFT dust/minimum output, ONFT holder-only sending, and both send ABI layouts.
- Every expanded function signature parses and matches a bundled ABI selector.
- Package check verifies internal Markdown links and Bankr import size limits (excluding node_modules and ignored local inputs).

RPC fixtures verify helper behavior; they are not a new security audit or an end-to-end transfer test.

## Live read-only evidence

The supplied Base URL resolved to OFT assetId:

`0x2db470ba8b308a1d5d24483646896084f82f9d50e8694bd3909faf281aee347c`

Origin adapter: `0xd710372A309D46D208A87f4274b0F85AEdaC7057`. Resolution verified the pinned Base router runtime, origin EID, descriptor hash and origin reverse lookup.

The optional `node tests/live-read.mjs` also resolved and quoted the protocol's public smoke-test assets:

| Type | Source → destination | Source quote block | Native fee at that block (base units) |
|---|---|---|---|
| OFT | Base → Ethereum | 52390195 | 1415815816155128 |
| ONFT | Base → Arc | 52390198 | 174522811783889 |

Both fee values are historical source-chain ETH quotes, not fees to reuse. Both returned an approval requirement. The script only reads existing public holders and contracts; it has no signer. It checks runtime hashes, route readiness, asset identity, holdings and live quote decoding. It does not simulate or execute approval/send.

## Not yet validated

- Installation and operation inside a live Bankr account or via its X surface.
- Real wallet creation/approval/send and destination delivery through this skill.
- Every supported chain pair or every token's behavior.

Before announcing a public integration, test Bankr installation, account selection, encoding, native-value units and a separately authorized transaction flow. The skill is now publicly hosted at [Omnisea/agent-skills](https://github.com/Omnisea/agent-skills/tree/main/omnisea); Bankr catalog submission remains a separate step. The public RPC smoke can fail later if assets move or routes/RPCs change; report current evidence rather than treating this historical record as live readiness.
