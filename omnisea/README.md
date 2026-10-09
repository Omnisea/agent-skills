# Omnisea agent skill

Create OFTs from existing ERC-20 tokens and ONFTs from existing ERC-721 collections. Transfer holders' assets across Omnisea chains using an exact asset identity and their own wallet.

The skill targets Bankr and other wallet-enabled agents. It uses the current Omnisea routers, with explicit creation followed by holder transfers. It deploys no wrapper or replacement protocol contracts.

## Start with an asset link

Tell your agent which asset to use, where your holdings are, and where to send them:

> Transfer 100 tokens from Base to Ethereum, to my wallet, using [the official Omnisea asset URL].

The URL includes origin chain, underlying address and creator. It does not select the transfer's source chain. For NFTs specify a token ID instead of an amount. [SKILL.md](SKILL.md) contains complete examples and accepted identity formats.

## Install and share

This directory is self-contained and published in [Omnisea/agent-skills](https://github.com/Omnisea/agent-skills/tree/main/omnisea). Send Bankr:

```text
Install the Omnisea skill from https://github.com/Omnisea/agent-skills/tree/main/omnisea
```

Other compatible agents can install the same directory through their skill loader. A direct raw SKILL.md link is useful for discovery, but the reference documents and optional ABI/helper files should remain accessible together. Bankr supports public repository, folder and skill-file links. [Bankr installation](https://docs.bankr.bot/skills/in-bankr/from-github/)

The skill is publicly hosted on GitHub. Bankr Discover listing and live Bankr execution have not yet been validated. The included catalog.json points installation to this repository; adding that file alone does not register the skill with Bankr.

## What is included

- Strict creation/transfer input rules and user-message examples.
- Resolution, creation, OFT/ONFT quoting and transfer procedures.
- Deployment snapshot for ten EVM chains, ABI subsets and exact readable signatures.
- Owner/Lens helper reference, route checks, delivery and recovery guidance.
- Optional read-only Node resolver/quote CLI and behavioral tests.
- Bankr value-unit and chain-capability guidance.

The skill defaults creation to permanent open mode. Compliance-configured creation and general issuer administration are outside its creation/transfer scope. Existing compliance assets may be transferred only after their configured checks pass.

## Local validation

```sh
npm ci --ignore-scripts
npm test
npm run check:package
node scripts/omnisea.mjs parse examples/identity.json
```

Live resolve/quote commands only read RPCs. They do not request keys or spend funds. See [helper usage](references/helpers.md) and [validation record](references/validation.md).

## Publication and maintenance

1. Keep the public skill directory current. Exclude node_modules, local request files and all credentials. Preserve ABI provenance and licensing notices.
2. Test installation in Bankr; verify reference and helper availability, active wallet identity, contract-call encoding and attached native value. Start with read-only resolution/quotes; transaction validation uses a separately authorized account/network/budget.
3. For Bankr Discover, submit the skill with `catalog.json` to BankrBot/skills. Its external-install entry points to the canonical Omnisea GitHub directory. Follow the current [contribution requirements](https://github.com/BankrBot/skills#adding-a-skill); listing requires Bankr's review.
4. Pin/tag a release. Treat deployment/ABI changes as reviewed updates; regenerate with `node scripts/refresh-contracts.mjs <Omnisea workspace root>`, inspect changes and run tests. Consumers do not need that workspace. If changing releases/chains, update the exporter inputs and snapshot date as well.

`data/provenance.json` records exact source hashes. This skill's instructions/helpers and the source distribution's exported ABIs use the included MIT license. The logo remains Omnisea branding; the software license grants no trademark rights. This package does not copy deployable core implementation code or relicense it. Core implementation licensing remains governed by the source project's `solidity-v2/LICENSING.md` and associated licenses.
