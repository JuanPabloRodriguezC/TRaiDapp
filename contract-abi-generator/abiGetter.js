import { Account, RpcProvider} from 'starknet';
import fs from 'fs';

let provider = new RpcProvider({nodeUrl: 'http://127.0.0.1:5050/rpc'});

const accountAddress = '0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691';
const privateKey = '0x0000000000000000000000000000000071d7bb07b9a64f6f78ac4c816aff4da9';
const compressedContract = await provider.getClassAt('0x06dba12b81f6abb06b184dc42df57ebda6572eacf2a142bf0d1426c27bc92adf');
fs.writeFileSync('./abi.json', JSON.stringify(compressedContract.abi, undefined, 2));