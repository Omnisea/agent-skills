import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { keccak256, padHex, zeroHash, zeroAddress, encodeFunctionData, decodeFunctionData, parseAbi, toFunctionSelector } from 'viem';
import { identity, parseUrl, network, amount, tokenId, createReader, deployments } from '../scripts/omnisea.mjs';

const originAsset = '0x1111111111111111111111111111111111111111';
const creator = '0x2222222222222222222222222222222222222222';
const holder = '0x3333333333333333333333333333333333333333';
const facade = '0x4444444444444444444444444444444444444444';
const destinationFacade = '0x5555555555555555555555555555555555555555';
const vault = '0x6666666666666666666666666666666666666666';
const url = `https://www.omnisea.io/en/tokens/8453/${originAsset}/${creator}`;
const descriptor = '0x1234';
const assetId = keccak256(descriptor);
const code = '0x6000';

test('official URLs resolve type and origin, including collection/trailing slash', () => {
  assert.deepEqual(parseUrl(url), { type: 'OFT', originChain: 8453, originAsset, creator });
  assert.equal(parseUrl(url.replace('/tokens/', '/collections/') + '/').type, 'ONFT');
  assert.equal(parseUrl(url.replace('www.', '')).originChain, 8453);
});
for (const bad of [
  url.replace('https:', 'http:'), url.replace('www.omnisea.io', 'www.omnisea.io.evil.test'),
  url.replace('www.omnisea.io', 'user@www.omnisea.io'), url.replace('www.omnisea.io', 'www.omnisea.io:443'),
  url + '?creator=' + holder, url + '#x', url + '/extra', url.replace('/en/', '/foo/../en/'),
  url.replace('/tokens/', '/%74okens/'), url.replace('/en/', '/fr/'), url.replace('/' + creator, ''),
]) test('rejects unsafe/incomplete URL: ' + bad, () => assert.throws(() => parseUrl(bad), { code: 'INVALID_INPUT' }));

test('strict identifiers reject symbols, addresses alone and conflicting fields', () => {
  for (const x of [{ symbol: 'TOKEN' }, { originChain: 'Base', originAsset }, { url, creator }, { originChain: 8453, assetId, originAsset }, { originChain: 8453, assetId: zeroHash }]) assert.throws(() => identity(x));
  assert.equal(identity({ type: 'ONFT', originChain: 'Base', originAsset, creator }).type, 'ONFT');
  assert.equal(identity({ originChain: 'Base', assetId }).assetId, assetId);
  assert.throws(() => network('Moon'), { code: 'UNSUPPORTED_CHAIN' });
});
test('amount and NFT IDs never round or lose precision', () => {
  assert.equal(amount('1.123456', 6), 1123456n);
  for (const x of ['0','-1','1e3','0.0000001','NaN',1.5]) assert.throws(() => amount(x, 6));
  assert.equal(tokenId('0'), 0n);
  assert.equal(tokenId('9007199254740993'), 9007199254740993n);
  for (const x of [-1, '1.2', (2n ** 256n).toString()]) assert.throws(() => tokenId(x));
});

// Deterministic RPC fixtures: only reads exist. Expected source/holder and fee math are asserted.
function fixture(options = {}) {
  const calls = [];
  const type = options.type ?? 'OFT';
  const original = deployments.map(n => [n, n.OFT.runtimeHash, n.ONFT.runtimeHash]);
  for (const [n] of original) { n.OFT.runtimeHash = keccak256(code); n.ONFT.runtimeHash = keccak256(code); }
  const a = { exists: true, token: facade, originEid: 30184, creator: padHex(creator, { size: 32 }), originToken: padHex(originAsset, { size: 32 }), originCollection: padHex(originAsset, { size: 32 }), complianceMode: false, localDecimals: 6, sharedDecimals: 4 };
  const clientFor = n => ({
    getChainId: async () => options.wrongChain ? 9999 : n.chainId,
    getCode: async () => options.badCode ? '0x6001' : code,
    getBlock: async () => ({ number: 123n, timestamp: 10000n }),
    readContract: async call => {
      calls.push({ chainId: n.chainId, ...call });
      const isOft = call.address.toLowerCase() === n.OFT.router.toLowerCase();
      if (options.rpcFailure && n.chainId === 8453 && call.functionName === 'getAsset') throw new Error('RPC down');
      switch (call.functionName) {
        case 'localEid': return n.eid;
        case 'assetOf': return options.absent ? zeroHash : assetId;
        case 'getAsset': return options.absent || (isOft ? type !== 'OFT' : type !== 'ONFT') && !options.bothTypes || options.destinationMissing && n.chainId === 1 ? { exists: false } : { ...a, ...(n.chainId === 1 ? { token: destinationFacade } : {}), ...(options.wrongOrigin ? { originEid: 30101 } : {}) };
        case 'descriptorOf': return options.badDescriptor ? '0xabcd' : descriptor;
        case 'assetIdOf': return assetId;
        case 'omnisea': return n[type].router;
        case 'peers': return padHex(deployments.find(x => x.eid === call.args[0])[type].router, { size: 32 });
        case 'peerVm': return 1;
        case 'routeFrozen': return true;
        case 'routeFrozenAt': return 100n;
        case 'ROUTE_ACTIVATION_DELAY': return 300n;
        case 'isChainEnabled': return !options.disabled && !(options.destinationDisabled && n.chainId === 1);
        case 'preEnabledEids': return options.notPreEnabled ? [] : [30110];
        case 'assetPeer': return padHex(destinationFacade, { size: 32 });
        case 'vault': return vault;
        case 'token': return n.chainId === 8453 ? originAsset : facade;
        case 'approvalRequired': return n.chainId === 8453;
        case 'balanceOf': return options.insufficient ? 0n : 1000000000n;
        case 'allowance': return 1n;
        case 'ownerOf': return options.wrongOwner ? creator : holder;
        case 'getApproved': return zeroAddress;
        case 'isApprovedForAll': return false;
        case 'quoteOFT': return [{ minAmountLD: 0n, maxAmountLD: 999999999n }, [], { amountSentLD: 1123400n, amountReceivedLD: 1112166n }];
        case 'quoteSend': return { nativeFee: 1000000000000000n, lzTokenFee: 0n };
        default: throw new Error('Unexpected call ' + call.functionName);
      }
    },
  });
  return { reader: createReader(clientFor), calls, restore: () => { for (const [n, oft, onft] of original) { n.OFT.runtimeHash = oft; n.ONFT.runtimeHash = onft; } } };
}
async function using(options, run) { const f = fixture(options); try { await run(f); } finally { f.restore(); } }
const tuple = { type: 'OFT', originChain: 'Base', originAsset, creator };
const request = { identity: tuple, sourceChain: 'Base', destinationChain: 'Ethereum', wallet: holder, recipient: holder, amount: '1.123456' };

test('resolves all accepted identity forms to the same ID', async () => using({}, async ({reader}) => {
  for (const i of [{url}, tuple, {originChain:'Base',assetId}]) assert.equal((await reader.resolve(i)).assetId, assetId);
}));
test('absence is distinct from RPC failure', async () => {
  await using({absent:true}, async ({reader}) => assert.rejects(reader.resolve(tuple), {code:'ASSET_NOT_FOUND'}));
  await using({rpcFailure:true}, async ({reader}) => assert.rejects(reader.resolve(tuple), /RPC down/));
});
for (const [flag, error] of [['wrongOrigin','WRONG_ORIGIN'],['wrongChain','CHAIN_MISMATCH'],['badCode','DEPLOYMENT_MISMATCH'],['badDescriptor','IDENTITY_MISMATCH'],['bothTypes','AMBIGUOUS_TYPE']]) {
  test('rejects ' + flag, async () => using({[flag]:true}, async ({reader}) => assert.rejects(reader.resolve({originChain:'Base',assetId}), {code:error})));
}
test('OFT quote retains holder, exact units, dust, minReceived and adapter approval', async () => using({}, async ({reader,calls}) => {
  const q = await reader.quote(request);
  assert.equal(q.params.amountLD, 1123456n);
  assert.equal(q.params.minAmountLD, 1112166n);
  assert.equal(q.amounts.dustLD, 56n);
  assert.equal(q.approval.spender, facade);
  assert.equal(q.approval.resetNonzeroFirst, true);
  assert.equal(q.nativeFeeWholeUnits, '0.001');
  assert.equal(q.simulated, false);
  assert.equal(calls.find(x=>x.functionName==='quoteSend').account, holder);
}));
test('third-chain source uses remote holdings, same assetId and no approval', async () => using({}, async ({reader,calls}) => {
  const q = await reader.quote({...request, sourceChain:'Arbitrum'});
  assert.equal(q.identity.originChain, 8453);
  assert.equal(q.sourceChain, 42161);
  assert.equal(q.approval, null);
  assert.equal(calls.find(x=>x.functionName==='balanceOf').chainId, 42161);
}));
test('first arrival from origin can quote; untrusted third-chain first arrival cannot', async () => {
  await using({destinationMissing:true}, async ({reader}) => assert.equal((await reader.quote(request)).destinationDeployed,false));
  await using({destinationMissing:true,notPreEnabled:true}, async ({reader}) => assert.rejects(reader.quote({...request,sourceChain:'Arbitrum'}),{code:'DESTINATION_NOT_READY'}));
});
test('source/destination/holdings/recipient validation', async () => {
  for (const [opts, code] of [[{disabled:true},'ASSET_ROUTE_DISABLED'],[{destinationDisabled:true},'ASSET_ROUTE_DISABLED'],[{insufficient:true},'INSUFFICIENT_BALANCE']]) await using(opts, async ({reader}) => assert.rejects(reader.quote(request),{code}));
  await using({}, async ({reader}) => {
    await assert.rejects(reader.quote({...request,sourceChain:undefined}),{code:'UNSUPPORTED_CHAIN'});
    await assert.rejects(reader.quote({...request,destinationChain:'Base'}),{code:'INVALID_INPUT'});
    await assert.rejects(reader.quote({...request,recipient:destinationFacade}),{code:'INVALID_RECIPIENT'});
  });
});
test('ONFT quote uses tokenId and token-specific approval; rejects operators', async () => {
  const req = {...request, identity:{...tuple,type:'ONFT'}, amount:undefined, tokenId:'9007199254740993'};
  await using({type:'ONFT'}, async ({reader}) => {
    const q = await reader.quote(req);
    assert.equal(q.params.tokenId,9007199254740993n);
    assert.equal(q.approval.tokenId,q.params.tokenId);
    assert.equal(q.params.amountLD,undefined);
  });
  await using({type:'ONFT',wrongOwner:true}, async ({reader}) => assert.rejects(reader.quote(req),{code:'NOT_NFT_OWNER'}));
});
test('bundled ABI encodes both actual send tuple layouts and creation', () => {
  for (const type of ['OFT','ONFT']) {
    const abi = JSON.parse(readFileSync(new URL('../abi/' + (type==='OFT'?'OFTAdapter':'ONFT721Adapter') + '.json',import.meta.url)));
    const params = {dstEid:30101,to:padHex(holder,{size:32}),extraOptions:'0x',composeMsg:'0x',...(type==='OFT'?{amountLD:1n,minAmountLD:1n,oftCmd:'0x'}:{tokenId:0n,onftCmd:'0x'})};
    const data = encodeFunctionData({abi,functionName:'send',args:[params,{nativeFee:1n,lzTokenFee:0n},holder]});
    assert.equal(decodeFunctionData({abi,data}).functionName,'send');
    const routerAbi = JSON.parse(readFileSync(new URL('../abi/' + (type==='OFT'?'Omnisea':'OmniseaNFT') + '.json',import.meta.url)));
    assert.equal(encodeFunctionData({abi:routerAbi,functionName:'createAsset',args:[originAsset,zeroAddress]}).slice(0,10),'0x' + keccak256(new TextEncoder().encode('createAsset(address,address)')).slice(2,10));
  }
});
test('readable Bankr signatures parse and match every bundled function selector', () => {
  const markdown = readFileSync(new URL('../references/signatures.md', import.meta.url), 'utf8');
  for (const [,name,body] of markdown.matchAll(/## (\w+)\n\n```solidity\n([\s\S]*?)\n```/g)) {
    const readable = parseAbi(body.trim().split('\n').map(line => line.replace(/;$/, '')));
    const json = JSON.parse(readFileSync(new URL('../abi/' + name + '.json', import.meta.url))).filter(x => x.type === 'function');
    assert.equal(readable.length, json.length);
    for (const fn of json) assert.ok(readable.some(x => toFunctionSelector(x) === toFunctionSelector(fn)), name + '.' + fn.name);
  }
});
