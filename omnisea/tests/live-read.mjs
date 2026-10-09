// Optional read-only smoke against public protocol smoke assets. No wallet signer.
// This checks RPC integration only; it is not a Bankr execution test.
import { createPublicClient, http, erc721Abi } from 'viem';
import { createReader, network } from '../scripts/omnisea.mjs';
const reader = createReader();
for (const spec of [
  { type: 'OFT', assetId: '0x8265fbeff1c88009c0fcf20d3103d2538ef396895f511a5ed14dd4dc70ec650c', amount: '0.01', destinationChain: 'Ethereum' },
  { type: 'ONFT', assetId: '0x99c43f66b535333961e35b7edd727b2f804c05a69eb8f6157442acbaae69f9bd', tokenId: '5042', destinationChain: 'Arc' },
]) {
  const identity = { type: spec.type, originChain: 'Base', assetId: spec.assetId };
  const asset = await reader.resolve(identity);
  let holder = asset.creator;
  if (spec.type === 'ONFT') {
    const client = createPublicClient({transport:http(process.env.OMNISEA_RPC_8453 || network('Base').rpc, {timeout:15000,retryCount:1})});
    holder = await client.readContract({address:asset.originAsset,abi:erc721Abi,functionName:'ownerOf',args:[BigInt(spec.tokenId)]});
  }
  const quote = await reader.quote({identity,sourceChain:'Base',destinationChain:spec.destinationChain,wallet:holder,recipient:holder,...(spec.type==='OFT'?{amount:spec.amount}:{tokenId:spec.tokenId})});
  console.log(JSON.stringify({type:spec.type,assetId:asset.assetId,sourceChain:quote.sourceChain,destinationChain:quote.destinationChain,quotedAtBlock:quote.quotedAtBlock,nativeFee:quote.nativeFeeBaseUnits,nativeSymbol:quote.nativeSymbol,approvalRequired:!!quote.approval,simulated:quote.simulated},(_,v)=>typeof v==='bigint'?v.toString():v));
}
