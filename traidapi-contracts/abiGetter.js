import { Provider } from 'starknet';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

let provider = new Provider({
    rpc: { nodeUrl: 'https://starknet-sepolia.infura.io/v3/' + process.env.RPC_PROVIDER_KEY }
});

const compressedContract = await provider.getClassAt('0x02d2a4804f83c34227314dba41d5c2f8a546a500d34e30bb5078fd36b5af2d77');
fs.writeFileSync('./abi.json', JSON.stringify(compressedContract.abi, undefined, 2));