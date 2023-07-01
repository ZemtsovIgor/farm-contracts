import TokenConfigInterface from '../lib/TokenConfigInterface';
import * as Networks from '../lib/Networks';

const TokenConfig: TokenConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: "TBCCMasterChef",
  tft: "0xf722Af07428382C8D4AfdE5602a387878A00F9ed",
  tftPerBlock: "172923569799590200",
  startBlock: "26120788",
  tbccDefiApes: "0x7097b965E3540Ab3B595855e57A4D584Ef5332b5",
  claimAmount: "1000000000000000000",
  contractAddress: "0x6f1C52e11eDF7239a884250C0943A6b30A9D19F3",
};

export default TokenConfig;
