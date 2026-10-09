# Exact contract signatures

Generated from the bundled ABI snapshot. Tuple fields are expanded for Bankr function-call tools. Use the deployed address in deployments.md. Router send/quote methods are intentionally excluded: holders call the asset facade.

## Omnisea

```solidity
function ROUTE_ACTIVATION_DELAY() external view returns (uint64);
function assetIdOf(address token) external view returns (bytes32);
function assetOf(address originToken,address creator) external view returns (bytes32);
function assetPeer(bytes32 assetId,uint32 eid) external view returns (bytes32);
function claimFees(bytes32 assetId,address recipient) external;
function createAsset(address originToken,address compliance) external returns (bytes32 assetId,address token);
function descriptorOf(bytes32 assetId) external view returns (bytes);
function descriptorSent(bytes32 assetId,uint32 eid) external view returns (bool);
function enableChain(bytes32 assetId,uint32 eid,bytes32 remoteCompliance,bytes extraOptions) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee) receipt);
function enabledEids(bytes32 assetId) external view returns (uint32[]);
function failedMessages(bytes32 guid) external view returns (bytes32 messageHash,uint32 srcEid,uint64 nonce,uint64 failedAt);
function getAsset(bytes32 assetId) external view returns ((address token,uint32 originEid,uint8 localDecimals,uint8 sharedDecimals,bool complianceMode,bool exists,uint16 feeBps,address underlying,address compliance,uint128 flatFee,bytes32 creator,bytes32 originToken));
function isChainEnabled(bytes32 assetId,uint32 eid) external view returns (bool);
function localEid() external view returns (uint32);
function ownerNativeFees(bytes32 assetId) external view returns (uint256);
function ownerTokenFees(bytes32 assetId) external view returns (uint256);
function peerEids() external view returns (uint32[]);
function peerVm(uint32 eid) external view returns (uint8 vm);
function peers(uint32 eid) external view returns (bytes32 peer);
function preEnabledEids(bytes32 assetId) external view returns (uint32[]);
function predictAdapter(bytes32 assetId) external view returns (address);
function predictOFT(bytes32 assetId) external view returns (address);
function restore(bytes32 guid,bytes message,bytes extraOptions) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee) receipt);
function retry(bytes32 guid,bytes message) external;
function routeFrozen(uint32 eid) external view returns (bool);
function routeFrozenAt(uint32 eid) external view returns (uint64);
function setCompliance(bytes32 assetId,address compliance) external;
function setFees(bytes32 assetId,uint128 flatFee,uint16 feeBps) external;
function setRemoteCompliance(bytes32 assetId,uint32 eid,bytes32 compliance,bytes extraOptions) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee));
function setRemoteFees(bytes32 assetId,uint32 eid,uint128 flatFee,uint16 feeBps,bytes extraOptions) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee));
function syncAsset(bytes32 assetId,uint32 eid,bytes extraOptions) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee));
function vault() external view returns (address);
function withdrawRemoteFees(bytes32 assetId,uint32 eid,bytes32 recipient,bytes extraOptions) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee));
```

## OmniseaLens

```solidity
function activePeerEids(address omnisea) external view returns (uint32[] active);
function quoteRestore(address omnisea,bytes32 guid,bytes message,bytes extraOptions) external view returns (uint256 nativeFee);
function quoteSetRemoteFees(address omnisea,bytes32 assetId,uint32 eid,uint128 flatFee,uint16 feeBps,bytes extraOptions) external view returns (uint256 nativeFee);
function quoteSync(address omnisea,bytes32 assetId,uint32 eid,bytes32 remoteCompliance,bytes extraOptions) external view returns (uint256 nativeFee);
function quoteWithdrawRemoteFees(address omnisea,bytes32 assetId,uint32 eid,bytes32 recipient,bytes extraOptions) external view returns (uint256 nativeFee);
function restoreMessageOf(bytes message) external pure returns (bytes restoreMessage,bytes32 sender,bytes32 restorer);
```

## OFT

```solidity
function approvalRequired() external pure returns (bool);
function approve(address spender,uint256 value) external returns (bool);
function assetId() external view returns (bytes32);
function balanceOf(address account) external view returns (uint256);
function combineOptions(uint32 eid,uint16 msgType,bytes extraOptions) external view returns (bytes);
function creator() external view returns (bytes32);
function decimalConversionRate() external view returns (uint256);
function decimals() external view returns (uint8);
function enforcedOptions(uint32 eid,uint16 msgType) external view returns (bytes);
function name() external view returns (string);
function omnisea() external view returns (address);
function owner() external view returns (address);
function peers(uint32 eid) external view returns (bytes32);
function quoteOFT((uint32 dstEid,bytes32 to,uint256 amountLD,uint256 minAmountLD,bytes extraOptions,bytes composeMsg,bytes oftCmd) sendParam) external view returns ((uint256 minAmountLD,uint256 maxAmountLD),(int256 feeAmountLD,string description)[],(uint256 amountSentLD,uint256 amountReceivedLD));
function quoteSend((uint32 dstEid,bytes32 to,uint256 amountLD,uint256 minAmountLD,bytes extraOptions,bytes composeMsg,bytes oftCmd) sendParam,bool payInLzToken) external view returns ((uint256 nativeFee,uint256 lzTokenFee));
function send((uint32 dstEid,bytes32 to,uint256 amountLD,uint256 minAmountLD,bytes extraOptions,bytes composeMsg,bytes oftCmd) sendParam,(uint256 nativeFee,uint256 lzTokenFee) fee,address refundAddress) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee) receipt,(uint256 amountSentLD,uint256 amountReceivedLD) oftReceipt);
function sharedDecimals() external view returns (uint8);
function symbol() external view returns (string);
function token() external view returns (address);
```

## OFTAdapter

```solidity
function approvalRequired() external pure returns (bool);
function assetId() external view returns (bytes32);
function combineOptions(uint32 eid,uint16 msgType,bytes extraOptions) external view returns (bytes);
function creator() external view returns (bytes32);
function decimalConversionRate() external view returns (uint256);
function decimals() external view returns (uint8);
function enforcedOptions(uint32 eid,uint16 msgType) external view returns (bytes);
function name() external view returns (string);
function omnisea() external view returns (address);
function owner() external view returns (address);
function peers(uint32 eid) external view returns (bytes32);
function quoteOFT((uint32 dstEid,bytes32 to,uint256 amountLD,uint256 minAmountLD,bytes extraOptions,bytes composeMsg,bytes oftCmd) sendParam) external view returns ((uint256 minAmountLD,uint256 maxAmountLD),(int256 feeAmountLD,string description)[],(uint256 amountSentLD,uint256 amountReceivedLD));
function quoteSend((uint32 dstEid,bytes32 to,uint256 amountLD,uint256 minAmountLD,bytes extraOptions,bytes composeMsg,bytes oftCmd) sendParam,bool payInLzToken) external view returns ((uint256 nativeFee,uint256 lzTokenFee));
function send((uint32 dstEid,bytes32 to,uint256 amountLD,uint256 minAmountLD,bytes extraOptions,bytes composeMsg,bytes oftCmd) sendParam,(uint256 nativeFee,uint256 lzTokenFee) fee,address refundAddress) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee) receipt,(uint256 amountSentLD,uint256 amountReceivedLD) oftReceipt);
function sharedDecimals() external view returns (uint8);
function symbol() external view returns (string);
function token() external view returns (address);
```

## OmniseaNFT

```solidity
function ROUTE_ACTIVATION_DELAY() external view returns (uint64);
function assetIdOf(address token) external view returns (bytes32);
function assetOf(address collection,address creator) external view returns (bytes32);
function assetPeer(bytes32 assetId,uint32 eid) external view returns (bytes32);
function claimFees(bytes32 assetId,address recipient) external;
function claimRoyalties(bytes32 assetId,address royaltyToken,address recipient) external;
function createAsset(address collection,address compliance) external returns (bytes32 assetId,address token);
function descriptorOf(bytes32 assetId) external view returns (bytes);
function descriptorSent(bytes32 assetId,uint32 eid) external view returns (bool);
function enableChain(bytes32 assetId,uint32 eid,bytes32 remoteCompliance,bytes extraOptions) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee) receipt);
function enabledEids(bytes32 assetId) external view returns (uint32[]);
function failedMessages(bytes32 guid) external view returns (bytes32 messageHash,uint32 srcEid,uint64 nonce,uint64 failedAt);
function getAsset(bytes32 assetId) external view returns ((address token,uint32 originEid,bool complianceMode,bool ownerVerified,bool exists,address collection,address compliance,uint128 flatFee,bytes32 creator,bytes32 originCollection));
function isChainEnabled(bytes32 assetId,uint32 eid) external view returns (bool);
function localEid() external view returns (uint32);
function originContractURI(bytes32 assetId) external view returns (bytes);
function ownerNativeFees(bytes32 assetId) external view returns (uint256);
function peerEids() external view returns (uint32[]);
function peerVm(uint32 eid) external view returns (uint8 vm);
function peers(uint32 eid) external view returns (bytes32 peer);
function preEnabledEids(bytes32 assetId) external view returns (uint32[]);
function predictAdapter(bytes32 assetId) external view returns (address);
function predictONFT(bytes32 assetId) external view returns (address);
function restore(bytes32 guid,bytes message,bytes extraOptions) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee) receipt);
function retry(bytes32 guid,bytes message) external;
function routeFrozen(uint32 eid) external view returns (bool);
function routeFrozenAt(uint32 eid) external view returns (uint64);
function sendOwnerAction(bytes32 assetId,uint32 eid,uint8 op,bytes opData,bytes extraOptions) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee) receipt);
function setCompliance(bytes32 assetId,address compliance) external;
function setContractURI(bytes32 assetId,string uri) external;
function setFees(bytes32 assetId,uint128 flatFee) external;
function setRemoteCompliance(bytes32 assetId,uint32 eid,bytes32 compliance,bytes extraOptions) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee));
function setRoyalty(bytes32 assetId,uint16 bps) external;
function setTokenRoyalty(bytes32 assetId,uint256 tokenId,uint16 bps) external;
function setTokenURI(bytes32 assetId,uint256 tokenId,string uri) external;
function syncAsset(bytes32 assetId,uint32 eid,bytes extraOptions) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee));
function vault() external view returns (address);
```

## OmniseaNFTLens

```solidity
function activePeerEids(address omnisea) external view returns (uint32[] active);
function encodeClaimRoyalties(bytes32 token,bytes32 recipient) external pure returns (uint8 op,bytes opData);
function encodeSetContractURI(string uri) external pure returns (uint8 op,bytes opData);
function encodeSetFees(uint128 flatFee) external pure returns (uint8 op,bytes opData);
function encodeSetRoyalty(uint16 bps) external pure returns (uint8 op,bytes opData);
function encodeSetTokenRoyalty(uint256 tokenId,uint16 bps) external pure returns (uint8 op,bytes opData);
function encodeSetTokenURI(uint256 tokenId,string uri) external pure returns (uint8 op,bytes opData);
function encodeWithdrawFees(bytes32 recipient) external pure returns (uint8 op,bytes opData);
function quoteEnableChain(address omnisea,bytes32 assetId,uint32 eid,bytes32 remoteCompliance,bytes extraOptions) external view returns (uint256 nativeFee);
function quoteOwnerAction(address omnisea,bytes32 assetId,uint32 eid,uint8 op,bytes opData,bytes extraOptions) external view returns (uint256 nativeFee);
function quoteRestore(address omnisea,bytes32 guid,bytes message,bytes extraOptions) external view returns (uint256 nativeFee);
function quoteSync(address omnisea,bytes32 assetId,uint32 eid,bytes32 compliance,bytes extraOptions) external view returns (uint256 nativeFee);
function restoreMessageOf(bytes message) external pure returns (bytes restoreMessage,bytes32 sender,bytes32 restorer);
```

## ONFT721

```solidity
function approvalRequired() external pure returns (bool);
function approve(address to,uint256 tokenId) external;
function assetId() external view returns (bytes32);
function balanceOf(address owner) external view returns (uint256);
function combineOptions(uint32 eid,uint16 msgType,bytes extraOptions) external view returns (bytes);
function creator() external view returns (bytes32);
function enforcedOptions(uint32 eid,uint16 msgType) external view returns (bytes);
function getApproved(uint256 tokenId) external view returns (address);
function isApprovedForAll(address owner,address operator) external view returns (bool);
function name() external view returns (string);
function omnisea() external view returns (address);
function owner() external view returns (address);
function ownerOf(uint256 tokenId) external view returns (address);
function peers(uint32 eid) external view returns (bytes32);
function quoteSend((uint32 dstEid,bytes32 to,uint256 tokenId,bytes extraOptions,bytes composeMsg,bytes onftCmd) sendParam,bool payInLzToken) external view returns ((uint256 nativeFee,uint256 lzTokenFee));
function send((uint32 dstEid,bytes32 to,uint256 tokenId,bytes extraOptions,bytes composeMsg,bytes onftCmd) sendParam,(uint256 nativeFee,uint256 lzTokenFee) fee,address refundAddress) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee) receipt);
function supportsInterface(bytes4 interfaceId) external view returns (bool);
function symbol() external view returns (string);
function token() external view returns (address);
function tokenURI(uint256 tokenId) external view returns (string);
```

## ONFT721Adapter

```solidity
function approvalRequired() external pure returns (bool);
function assetId() external view returns (bytes32);
function combineOptions(uint32 eid,uint16 msgType,bytes extraOptions) external view returns (bytes);
function creator() external view returns (bytes32);
function enforcedOptions(uint32 eid,uint16 msgType) external view returns (bytes);
function name() external view returns (string);
function omnisea() external view returns (address);
function owner() external view returns (address);
function peers(uint32 eid) external view returns (bytes32);
function quoteSend((uint32 dstEid,bytes32 to,uint256 tokenId,bytes extraOptions,bytes composeMsg,bytes onftCmd) sendParam,bool payInLzToken) external view returns ((uint256 nativeFee,uint256 lzTokenFee));
function send((uint32 dstEid,bytes32 to,uint256 tokenId,bytes extraOptions,bytes composeMsg,bytes onftCmd) sendParam,(uint256 nativeFee,uint256 lzTokenFee) fee,address refundAddress) external payable returns ((bytes32 guid,uint64 nonce,(uint256 nativeFee,uint256 lzTokenFee) fee) receipt);
function symbol() external view returns (string);
function token() external view returns (address);
```
