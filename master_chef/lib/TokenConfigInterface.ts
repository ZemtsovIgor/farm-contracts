import NetworkConfigInterface from '../lib/NetworkConfigInterface';

export default interface TokenConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  tft: string;
  tftPerBlock: string;
  startBlock: string;
  tbccDefiApes: string;
  claimAmount: string;
  contractAddress: string|null;
};
