import TokenConfigInterface from "../lib/TokenConfigInterface";
import * as Networks from "../lib/Networks";

const TokenConfig: TokenConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: "TFTToken",
  contractAddress: "0xf722Af07428382C8D4AfdE5602a387878A00F9ed",
};

export default TokenConfig;
