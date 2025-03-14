import { Account, Contract, json, RpcProvider } from 'starknet';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

class BlockchainService {
  constructor() {
    // Connect to Starknet network
    this.provider = new RpcProvider({
      // Starknet RPC endpoint
      nodeUrl: 'https://starknet-sepolia.infura.io/v3/' + process.env.RPC_PROVIDER_KEY 
    });

    this.testAddress = '0x02d2a4804f83c34227314dba41d5c2f8a546a500d34e30bb5078fd36b5af2d77';

  }

    async connectWallet(account_contract_address, privateKey) {
        // Create account interface for interacting with contract
        this.account = new Account(
        this.provider, 
        account_contract_address, 
        privateKey
        );
    }

    async makePayment(amount) {
        // Call payment method in Cairo smart contract
        const transaction = await this.account.execute({
        contractAddress: 'PAYMENT_CONTRACT_ADDRESS',
        entrypoint: 'process_payment',
        calldata: [amount]
        });

        return transaction;
    }

    async verifyServiceAccess(user) {
        // Check if user has paid/has access via contract
        const hasAccess = await this.account.call(
        'SERVICE_CONTRACT', 
        'check_user_access', 
        [user]
        );

        return hasAccess;
    }

    async readTestData() {
        const compiledContract = json.parse(
            fs.readFileSync('./abi.json').toString('ascii')
            );

        const myTestContract = new Contract(compiledContract, this.testAddress, this.provider);

        const bal1 = await myTestContract.get_balance();
        console.log('Initial balance =', bal1); // Cairo 1 contract
    }

    async writeTestData() {
        const privateKey0 = process.env.OZ_ACCOUNT_PRIVATE_KEY;
        const account0Address = process.env.OZ_ACCOUNT_ADDRESS;

        const account0 = new Account(this.provider, account0Address, privateKey0, undefined, "0x3");

        const compiledContract = json.parse(
            fs.readFileSync('./abi.json').toString('ascii')
        );
        
        const myTestContract = new Contract(compiledContract, this.testAddress, this.provider);

        myTestContract.connect(account0);

        

        // Interactions with the contract with meta-class
        const bal1 = await myTestContract.get_balance();
        console.log('Initial balance =', bal1); // Cairo 1 contract
        const myCall = myTestContract.populate('increase_balance', [10]);
        const res = await myTestContract.increase_balance(myCall.calldata);
        await this.provider.waitForTransaction(res.transaction_hash);

        const bal2 = await myTestContract.get_balance();
        console.log('Final balance =', bal2);
    }

}

export default BlockchainService;

