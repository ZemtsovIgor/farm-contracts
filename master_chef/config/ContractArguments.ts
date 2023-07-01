import TokenConfig from './TokenConfig';

// Update the following array if you change the constructor arguments...
const ContractArguments = [
  TokenConfig.tft,
  TokenConfig.tbccDefiApes,
  TokenConfig.tftPerBlock,
  TokenConfig.startBlock,
  TokenConfig.claimAmount,
] as const;

export default ContractArguments;
