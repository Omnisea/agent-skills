// Read-only helper. No keys, signing, broadcasting or wallet connection.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createPublicClient, http, getAddress, isAddress, keccak256, padHex, parseUnits, formatUnits, zeroAddress, zeroHash, erc20Abi, erc721Abi } from 'viem';

export const deployments = JSON.parse(readFileSync(new URL('../data/deployments.json', import.meta.url))).networks;
const abi = name => JSON.parse(readFileSync(new URL('../abi/' + name + '.json', import.meta.url)));
const routerAbis = { OFT: abi('Omnisea'), ONFT: abi('OmniseaNFT') };
const tokenAbis = { OFT: abi('OFTAdapter'), ONFT: abi('ONFT721Adapter') };
const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
export function fail(code, message) { throw Object.assign(new Error(message), { code }); }
export function address(value) {
  if (typeof value !== 'string' || !isAddress(value, { strict: true }) || same(value, zeroAddress)) fail('INVALID_INPUT', 'Expected a nonzero EVM address (valid checksum if mixed-case).');
  return getAddress(value);
}
function id(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value) || same(value, zeroHash)) fail('INVALID_INPUT', 'assetId must be nonzero bytes32.');
  return value.toLowerCase();
}
export function evmAddress(value) {
  if (typeof value !== 'string' || !/^0x0{24}[0-9a-fA-F]{40}$/.test(value)) fail('IDENTITY_MISMATCH', 'Expected an EVM bytes32 identity.');
  return address('0x' + value.slice(-40));
}
export function network(value) {
  const key = String(value ?? '').trim().toLowerCase();
  const aliases = { 'arbitrum one': 'arbitrum', bsc: 'bnb', 'robinhood': 'robinhood' };
  const n = deployments.find(n => String(n.chainId) === key || n.name.toLowerCase() === key || n.slug === (aliases[key] ?? key));
  if (!n) fail('UNSUPPORTED_CHAIN', 'Specify a supported origin/source/destination chain name or numeric chain ID.');
  return n;
}
function type(value) {
  if (!['OFT', 'ONFT'].includes(value)) fail('INVALID_INPUT', 'Type must be OFT or ONFT.');
  return value;
}
export function parseUrl(value) {
  if (typeof value !== 'string') fail('INVALID_INPUT', 'Expected an official Omnisea URL.');
  let url;
  try { url = new URL(value); } catch { fail('INVALID_INPUT', 'Invalid Omnisea URL.'); }
  // Check raw authority/path too: URL normalization can remove ports and dot segments.
  const raw = /^https:\/\/(www\.omnisea\.io|omnisea\.io)(\/en\/(tokens|collections)\/([1-9][0-9]*)\/(0x[0-9a-fA-F]{40})\/(0x[0-9a-fA-F]{40})\/?)$/.exec(value);
  if (!raw || !['www.omnisea.io', 'omnisea.io'].includes(url.hostname) || url.username || url.password || url.port || url.search || url.hash) fail('INVALID_INPUT', 'Use the exact official /en/tokens/chainId/address/creator or /en/collections/chainId/address/creator URL.');
  return { type: raw[3] === 'tokens' ? 'OFT' : 'ONFT', originChain: network(raw[4]).chainId, originAsset: address(raw[5]), creator: address(raw[6]) };
}
export function identity(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('INVALID_INPUT', 'Expected an identity object.');
  const allowed = ['url','type','originChain','originAsset','creator','assetId'];
  if (Object.keys(input).some(k => !allowed.includes(k))) fail('INVALID_INPUT', 'Unknown identity field.');
  if (input.url !== undefined) {
    if (Object.keys(input).length !== 1) fail('INVALID_INPUT', 'Supply the URL alone, not conflicting identity fields.');
    return parseUrl(input.url);
  }
  const originChain = network(input.originChain).chainId;
  if (input.assetId !== undefined) {
    if (input.originAsset !== undefined || input.creator !== undefined) fail('INVALID_INPUT', 'Choose assetId or the full tuple, not both.');
    return { originChain, assetId: id(input.assetId), ...(input.type ? { type: type(input.type) } : {}) };
  }
  return { type: type(input.type), originChain, originAsset: address(input.originAsset), creator: address(input.creator) };
}
export function tokenId(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value) || BigInt(value) >= 2n ** 256n) fail('INVALID_INPUT', 'tokenId must be a decimal uint256 string.');
  return BigInt(value);
}
export function amount(value, decimals) {
  if (typeof value !== 'string' || !/^\d+(\.\d+)?$/.test(value) || (value.split('.')[1]?.length ?? 0) > decimals) fail('INVALID_INPUT', 'Amount must be an exact positive decimal string within token precision.');
  const result = parseUnits(value, decimals);
  if (result <= 0n || result >= 2n ** 256n) fail('INVALID_INPUT', 'Amount must fit positive uint256.');
  return result;
}
export function pageUrl(i) {
  return `https://www.omnisea.io/en/${i.type === 'OFT' ? 'tokens' : 'collections'}/${i.originChain}/${address(i.originAsset)}/${address(i.creator)}`;
}

export function createReader(clientFor = n => createPublicClient({ transport: http(process.env['OMNISEA_RPC_' + n.chainId] || n.rpc, { timeout: 15000, retryCount: 1 }) })) {
  const clients = new Map();
  const client = n => { if (!clients.has(n.chainId)) clients.set(n.chainId, clientFor(n)); return clients.get(n.chainId); };
  const read = (n, target, abi, functionName, args = [], account) => client(n).readContract({ address: target, abi, functionName, args, ...(account ? { account } : {}) });
  const router = (n, t, fn, args = []) => read(n, n[t].router, routerAbis[t], fn, args);
  async function verify(n, t) {
    if (await client(n).getChainId() !== n.chainId) fail('CHAIN_MISMATCH', 'RPC returned a different chain ID.');
    const code = await client(n).getCode({ address: n[t].router });
    if (!code || code === '0x') fail('DEPLOYMENT_MISMATCH', 'Router is not deployed.');
    if (!same(keccak256(code), n[t].runtimeHash)) fail('DEPLOYMENT_MISMATCH', 'Router runtime differs from pinned release.');
    if (Number(await router(n, t, 'localEid')) !== n.eid) fail('DEPLOYMENT_MISMATCH', 'Router endpoint ID differs from registry.');
  }
  async function record(n, t, assetId) {
    const a = await router(n, t, 'getAsset', [assetId]);
    if (!a.exists) return null;
    if (!same(keccak256(await router(n, t, 'descriptorOf', [assetId])), assetId)) fail('IDENTITY_MISMATCH', 'Descriptor hash differs from asset ID.');
    return a;
  }
  async function resolve(input) {
    const i = identity(input), n = network(i.originChain);
    const matches = [];
    // Never catch RPC errors as absence; every relevant router must be checked.
    for (const t of i.type ? [i.type] : ['OFT', 'ONFT']) {
      await verify(n, t);
      const assetId = i.assetId ?? await router(n, t, 'assetOf', [i.originAsset, i.creator]);
      if (same(assetId, zeroHash)) continue;
      const a = await record(n, t, assetId);
      if (!a) continue;
      if (Number(a.originEid) !== n.eid) fail('WRONG_ORIGIN', 'Asset exists here as a remote; supply its actual origin chain.');
      const creator = evmAddress(a.creator), originAsset = evmAddress(t === 'OFT' ? a.originToken : a.originCollection);
      if ((i.creator && !same(i.creator, creator)) || (i.originAsset && !same(i.originAsset, originAsset))) fail('IDENTITY_MISMATCH', 'Origin record conflicts with requested identity.');
      if (!same(await router(n, t, 'assetOf', [originAsset, creator]), assetId)) fail('IDENTITY_MISMATCH', 'Origin reverse lookup differs.');
      const found = { type: t, originChain: n.chainId, originAsset, creator, assetId, originAdapter: a.token, complianceMode: a.complianceMode };
      matches.push({ ...found, url: pageUrl(found) });
    }
    if (!matches.length) fail('ASSET_NOT_FOUND', 'No matching asset exists on the supplied origin. Transfer does not create one.');
    if (matches.length > 1) fail('AMBIGUOUS_TYPE', 'assetId exists in both routers; specify OFT or ONFT.');
    return matches[0];
  }
  async function route(a, b, t) {
    if (!same(await router(a, t, 'peers', [b.eid]), padHex(b[t].router, { size: 32 }))) fail('ROUTE_UNAVAILABLE', 'Peer does not match the pinned destination router.');
    if (Number(await router(a, t, 'peerVm', [b.eid])) !== 1 || !await router(a, t, 'routeFrozen', [b.eid])) fail('ROUTE_UNAVAILABLE', 'Route is not frozen EVM.');
    const frozen = BigInt(await router(a, t, 'routeFrozenAt', [b.eid]));
    const delay = BigInt(await router(a, t, 'ROUTE_ACTIVATION_DELAY'));
    if (frozen === 0n || frozen + delay > (await client(a).getBlock()).timestamp) fail('ROUTE_UNAVAILABLE', 'Route is not mature.');
  }
  async function quote(input) {
    const source = network(input.sourceChain), destination = network(input.destinationChain);
    if (source.chainId === destination.chainId) fail('INVALID_INPUT', 'Cross-chain source and destination must differ.');
    const wallet = address(input.wallet), recipient = address(input.recipient); // Caller resolves own-wallet defaults explicitly.
    const i = await resolve(input.identity), t = i.type;
    if (t === 'OFT' && input.tokenId !== undefined || t === 'ONFT' && input.amount !== undefined) fail('INVALID_INPUT', 'Supply amount for OFT or tokenId for ONFT, not both.');
    await verify(source, t); await verify(destination, t);
    const a = await record(source, t, i.assetId);
    if (!a) fail('SOURCE_ASSET_MISSING', 'No deployed source representation for this asset.');
    const code = await client(source).getCode({ address: a.token });
    if (!code || code === '0x' || !same(await router(source, t, 'assetIdOf', [a.token]), i.assetId)) fail('IDENTITY_MISMATCH', 'Source facade is not registered/deployed.');
    const facade = (fn, args = []) => read(source, a.token, tokenAbis[t], fn, args, wallet);
    if (!same(await facade('omnisea'), source[t].router)) fail('IDENTITY_MISMATCH', 'Facade router differs.');
    await route(source, destination, t); await route(destination, source, t);
    if (!await router(source, t, 'isChainEnabled', [i.assetId, destination.eid])) fail('ASSET_ROUTE_DISABLED', 'Creator must enable/confirm the source asset route.');
    const dest = await record(destination, t, i.assetId);
    if (dest) {
      if (!await router(destination, t, 'isChainEnabled', [i.assetId, source.eid])) fail('ASSET_ROUTE_DISABLED', 'Destination needs creator enablement/sync.');
    } else {
      const pre = await router(source, t, 'preEnabledEids', [i.assetId]);
      if (a.complianceMode || (source.eid !== Number(a.originEid) && !pre.map(Number).includes(source.eid))) fail('DESTINATION_NOT_READY', 'First-arrival trust/compliance needs creator-origin sync before this transfer.');
    }
    const predicted = await router(source, t, 'assetPeer', [i.assetId, destination.eid]);
    if (same(predicted, zeroHash)) fail('DESTINATION_NOT_READY', 'No destination facade can be resolved.');
    const destinationFacade = evmAddress(predicted);
    if (dest && !same(dest.token, destinationFacade)) fail('IDENTITY_MISMATCH', 'Destination facade differs from prediction.');
    const forbidden = [destination[t].router, await router(destination, t, 'vault'), destinationFacade];
    if (forbidden.some(v => same(v, recipient))) fail('INVALID_RECIPIENT', 'Recipient cannot be the destination router, vault or asset facade.');
    const underlying = await facade('token'), needsApproval = await facade('approvalRequired');
    const p = { dstEid: destination.eid, to: padHex(recipient, { size: 32 }), extraOptions: '0x', composeMsg: '0x' };
    let approval = null, amounts = null;
    if (t === 'OFT') {
      const requested = amount(input.amount, Number(a.localDecimals));
      if (await read(source, underlying, erc20Abi, 'balanceOf', [wallet]) < requested) fail('INSUFFICIENT_BALANCE', 'Insufficient source balance.');
      Object.assign(p, { amountLD: requested, minAmountLD: 0n, oftCmd: '0x' });
      const [, feeDetails, receipt] = await facade('quoteOFT', [p]);
      if (receipt.amountReceivedLD <= 0n) fail('ZERO_OUTPUT', 'Transfer would deliver zero.');
      p.minAmountLD = receipt.amountReceivedLD;
      amounts = { requestedLD: requested, ...receipt, dustLD: requested - receipt.amountSentLD, feeDetails, formattedReceived: formatUnits(receipt.amountReceivedLD, Number(a.localDecimals)) };
      if (needsApproval) {
        const allowance = await read(source, underlying, erc20Abi, 'allowance', [wallet, a.token]);
        if (allowance < requested) approval = { contract: underlying, spender: a.token, amount: requested, resetNonzeroFirst: allowance > 0n };
      }
    } else {
      const nftId = tokenId(input.tokenId);
      if (!same(await read(source, underlying, erc721Abi, 'ownerOf', [nftId]), wallet)) fail('NOT_NFT_OWNER', 'Requesting wallet is not the NFT owner on source.');
      Object.assign(p, { tokenId: nftId, onftCmd: '0x' });
      if (needsApproval && !same(await read(source, underlying, erc721Abi, 'getApproved', [nftId]), a.token) && !await read(source, underlying, erc721Abi, 'isApprovedForAll', [wallet, a.token])) approval = { contract: underlying, spender: a.token, tokenId: nftId };
    }
    const fee = await facade('quoteSend', [p, false]);
    if (fee.lzTokenFee !== 0n) fail('UNSUPPORTED_FEE', 'Only native LayerZero fee payment is supported.');
    const block = await client(source).getBlock();
    // Do not generate a broadcast-ready transaction: approvals, fee authorization and fresh simulation remain.
    return { identity: i, sourceChain: source.chainId, destinationChain: destination.chainId, wallet, recipient, sourceFacade: a.token, underlying, destinationFacade, destinationDeployed: !!dest, params: p, fee, amounts, approval, nativeSymbol: source.nativeSymbol, nativeFeeBaseUnits: fee.nativeFee, nativeFeeWholeUnits: formatUnits(fee.nativeFee, source.nativeDecimals), quotedAtBlock: block.number, simulated: false, next: approval ? 'Approve, await success, then re-quote and simulate send through the wallet.' : 'Review fees, then re-quote and simulate send through the wallet. Native execution gas is additional.' };
  }
  return { resolve, quote };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [command, file] = process.argv.slice(2);
    if (!['parse','resolve','quote'].includes(command) || !file) fail('INVALID_INPUT', 'Usage: node scripts/omnisea.mjs parse|resolve|quote request.json');
    const input = JSON.parse(readFileSync(file, 'utf8'));
    const reader = createReader();
    const result = command === 'parse' ? identity(input) : await reader[command](input);
    console.log(JSON.stringify({ ok: true, result }, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  } catch (e) {
    // Avoid echoing RPC URLs that may contain caller-provided credentials.
    console.error(JSON.stringify({ ok: false, code: e.code && typeof e.code === 'string' ? e.code : 'VERIFICATION_FAILED', message: e.code && typeof e.code === 'string' ? e.message : 'RPC/contract verification failed. This does not prove absence; inspect the RPC and contract call locally.' }));
    process.exitCode = 1;
  }
}
