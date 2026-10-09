// Maintainer-only, offline export. Not needed to install or use the skill.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/refresh-contracts.mjs <Omnisea workspace root>');
const provenance = { snapshotDate: '2026-10-09', files: {} };
function read(path) {
  const bytes = readFileSync(resolve(source, path));
  provenance.files[path] = createHash('sha256').update(bytes).digest('hex');
  return JSON.parse(bytes);
}
function save(path, value) {
  mkdirSync(dirname(resolve(root, path)), { recursive: true });
  writeFileSync(resolve(root, path), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
}
const contracts = ['Omnisea', 'OmniseaLens', 'OFT', 'OFTAdapter', 'onft/OmniseaNFT', 'onft/OmniseaNFTLens', 'onft/ONFT721', 'onft/ONFT721Adapter'];
const common = ['createAsset', 'getAsset', 'assetOf', 'assetIdOf', 'descriptorOf', 'assetPeer', 'predictAdapter', 'predictOFT', 'predictONFT', 'localEid', 'vault', 'peers', 'peerVm', 'routeFrozen', 'routeFrozenAt', 'ROUTE_ACTIVATION_DELAY', 'isChainEnabled', 'preEnabledEids', 'enabledEids', 'descriptorSent', 'peerEids', 'failedMessages', 'restore', 'retry', 'enableChain', 'syncAsset', 'setFees', 'claimFees', 'setRemoteFees', 'withdrawRemoteFees', 'setCompliance', 'setRemoteCompliance', 'sendOwnerAction', 'claimRoyalties', 'setTokenURI', 'setContractURI', 'setRoyalty', 'setTokenRoyalty', 'ownerNativeFees', 'ownerTokenFees', 'originContractURI'];
const facade = ['assetId', 'creator', 'omnisea', 'token', 'approvalRequired', 'quoteOFT', 'quoteSend', 'send', 'owner', 'name', 'symbol', 'decimals', 'sharedDecimals', 'decimalConversionRate', 'peers', 'enforcedOptions', 'combineOptions', 'balanceOf', 'ownerOf', 'getApproved', 'isApprovedForAll', 'approve', 'supportsInterface', 'tokenURI'];
const events = ['AssetCreated', 'TransferSent', 'TransferReceived', 'MessageFailed', 'MessageRetried', 'MessageRestored', 'OFTSent', 'OFTReceived', 'ONFTSent', 'ONFTReceived'];
let signatures = '# Exact contract signatures\n\nGenerated from the bundled ABI snapshot. Tuple fields are expanded for Bankr function-call tools. Use the deployed address in deployments.md. Router send/quote methods are intentionally excluded: holders call the asset facade.\n';
function param(p) { return (p.type.startsWith('tuple') ? '(' + p.components.map(param).join(',') + ')' + p.type.slice(5) : p.type) + (p.name ? ' ' + p.name : ''); }
for (const path of contracts) {
  const name = path.split('/').at(-1);
  const full = read('solidity-v2/abi/' + path + '.json');
  const selected = full.filter(x => x.type === 'error' || (x.type === 'event' && events.includes(x.name)) || (x.type === 'function' && (name.includes('Lens') || (['Omnisea', 'OmniseaNFT'].includes(name) ? common : facade).includes(x.name))));
  save('abi/' + name + '.json', selected);
  signatures += '\n## ' + name + '\n\n```solidity\n' + selected.filter(x => x.type === 'function').map(x => 'function ' + x.name + '(' + x.inputs.map(param).join(',') + ') external' + (x.stateMutability !== 'nonpayable' ? ' ' + x.stateMutability : '') + (x.outputs.length ? ' returns (' + x.outputs.map(param).join(',') + ')' : '') + ';').join('\n') + '\n```\n';
}
save('references/signatures.md', signatures);
const networks = [
  ['ethereum', 'Ethereum', 1, 'ETH', 'https://ethereum-rpc.publicnode.com'],
  ['base', 'Base', 8453, 'ETH', 'https://mainnet.base.org'],
  ['arbitrum', 'Arbitrum', 42161, 'ETH', 'https://arb1.arbitrum.io/rpc'],
  ['optimism', 'Optimism', 10, 'ETH', 'https://mainnet.optimism.io'],
  ['polygon', 'Polygon', 137, 'POL', 'https://polygon.drpc.org'],
  ['bnb', 'BNB Chain', 56, 'BNB', 'https://bsc-dataseed.binance.org'],
  ['robinhood', 'Robinhood Chain', 4663, 'ETH', 'https://rpc.mainnet.chain.robinhood.com'],
  ['ink', 'Ink', 57073, 'ETH', 'https://rpc-gel.inkonchain.com'],
  ['abstract', 'Abstract', 2741, 'ETH', 'https://api.mainnet.abs.xyz'],
  ['arc', 'Arc', 5042, 'USDC', 'https://rpc.mainnet.arc.io'],
];
const deployments = networks.map(([slug, name, chainId, nativeSymbol, rpc]) => {
  const oft = read('solidity-v2/releases/' + (slug === 'arc' ? 'core-v1-arc-20261008' : 'core-v1-abstract-20261008') + '/' + slug + '.json');
  const onft = read('solidity-v2/releases/onft-v1-arc-abstract-20261008/' + slug + '.json');
  if (oft.chainId !== chainId || onft.chainId !== chainId || oft.eid !== onft.eid) throw new Error('Release mismatch: ' + slug);
  return { name, slug, chainId, eid: oft.eid, nativeSymbol, nativeDecimals: 18, rpc,
    OFT: { router: oft.addresses.Omnisea, lens: oft.addresses.OmniseaLens, runtimeHash: oft.contracts.Omnisea.runtimeHash },
    ONFT: { router: onft.addresses.OmniseaNFT, lens: onft.addresses.OmniseaNFTLens, runtimeHash: onft.contracts.OmniseaNFT.runtimeHash } };
});
save('data/deployments.json', { snapshotDate: provenance.snapshotDate, networks: deployments });
save('data/provenance.json', provenance);
save('references/deployments.md', '# Deployment snapshot\n\nSnapshot: 2026-10-09. Exported from confirmed local release manifests, not a guarantee of current route readiness or Bankr support. Recheck RPC chain ID, router bytecode hash, localEid, peers and live asset routes before execution. Unknown chains are unsupported by this skill version. No secret RPC URLs are bundled.\n\n| Chain | EVM chain ID | LayerZero EID | Native fee unit (18 decimals) |\n|---|---|---|---|\n' + deployments.map(x => `| ${x.name} | ${x.chainId} | ${x.eid} | ${x.nativeSymbol} |`).join('\n') + '\n\n| Type | Router | Lens |\n|---|---|---|\n' + ['OFT','ONFT'].map(type => `| ${type} | ${deployments[0][type].router} | ${deployments[0][type].lens} |`).join('\n') + '\n\nThese releases use the listed addresses on all ten chains. Per-chain addresses, router runtime hashes and public RPC defaults are in `data/deployments.json`. Do not infer a future deployment from address equality. Arc transaction value is native 18-decimal USDC, not an ERC-20 approval.\n\nABI subsets are in `abi/`; exact readable signatures are in [signatures.md](signatures.md). Snapshot source paths and SHA-256 hashes are in `data/provenance.json`. The export reads public contract/release data only. It does not copy deployment signers, environment variables, private keys or operator scripts.\n');
console.log('Exported ABIs, signatures and ' + deployments.length + ' deployment records.');
