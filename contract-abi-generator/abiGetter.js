import { RpcProvider} from 'starknet';
import fs from 'fs';

let provider = new RpcProvider({nodeUrl: 'http://127.0.0.1:5050/rpc'});

const compressedContract = await provider.getClassAt('0x04c9e760bbadad1b0328bfbae6e3a08ec9141ee1836e779c32eb637f5e9ae947');
fs.writeFileSync('./abi.json', JSON.stringify(compressedContract.abi, undefined, 2));