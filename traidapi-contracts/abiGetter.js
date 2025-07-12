import { Account, Contract, json, RpcProvider} from 'starknet';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
//https://starknet-sepolia.infura.io/v3/
let provider = new RpcProvider({nodeUrl: 'http://127.0.0.1:5050/rpc'});

const accountAddress = '0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691';
const privateKey = '0x0000000000000000000000000000000071d7bb07b9a64f6f78ac4c816aff4da9';

const account = new Account(provider, accountAddress, privateKey);

const compressedContract = await provider.getClassAt('0x033d54b058f973939503475915886559098c937fcfdb815860fdb4fd943fcb13');
fs.writeFileSync('./abi.json', JSON.stringify(compressedContract.abi, undefined, 2));