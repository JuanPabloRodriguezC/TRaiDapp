
#[starknet::contract]
pub mod TraidingModels {
    use starknet::{
        storage::{ StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess, Map},
        ContractAddress
    };
    use core::starknet::{get_caller_address, contract_address_const};
    use pragma_lib::abi::{IPragmaABIDispatcher, IPragmaABIDispatcherTrait};
    use pragma_lib::types::{DataType, PragmaPricesResponse};
    use crate::interfaces::ITraidingModels::{ITraidingModelsMetrics, ITraidingModelsOrders};
    use crate::interfaces::IERC20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use crate::utils::events;
    use crate::utils::types::{Metrics};

    #[storage]
    struct Storage {
        pragma_contract: ContractAddress,
        traid_wallet: ContractAddress,
        traid_models_stats: Map<u64, Map<felt252, Metrics>>,
        model_authorization: Map<ContractAddress, Map<u64, bool>>,
        model_fees: Map<u64, u128>,
        user_balances: Map<ContractAddress, u128>,
    }    

    #[constructor]
    fn constructor(ref self: ContractState, pragma_oracle_address: ContractAddress) {
        self.pragma_contract.write(pragma_oracle_address);
    }

    #[abi(embed_v0)]
    impl TraidingModelsMetrics of ITraidingModelsMetrics<ContractState> {
        // Get current price for a token pair
        fn get_asset_price(self: @ContractState, asset_id: felt252) -> u128 {
            // Retrieve the oracle dispatcher
            let oracle_dispatcher = IPragmaABIDispatcher {
                contract_address: self.pragma_contract.read(),
            };

            // Call the Oracle contract, for a spot entry
            let output: PragmaPricesResponse = oracle_dispatcher
                .get_data_median(DataType::SpotEntry(asset_id));

            return output.price;
        }

        fn update_model_predictions(ref self: ContractState, model_id: u64, asset_id: felt252, prediction: felt252) -> bool{
            let caller: ContractAddress = get_caller_address();
            if caller != contract_address_const::<0x1234567890abcdef1234567890abcdef12345678>() {
                return false;
            }

            // Update the model predictions
            self.traid_models_stats.entry(model_id).entry(asset_id).prediction.write(prediction);

            return true;

        }

        fn get_model_error(ref self: ContractState, model_id: u64, asset_id: felt252) -> felt252 {
            let error = self.traid_models_stats.entry(model_id).entry(asset_id).error.read();
            return error;
        }

        fn get_model_roi(ref self: ContractState, model_id: u64, asset_id: felt252) -> felt252 {
            let roi = self.traid_models_stats.entry(model_id).entry(asset_id).roi.read();
            return roi;
        }

        fn get_model_sharpe_ratio(ref self: ContractState, model_id: u64, asset_id: felt252) -> felt252 {
            let sharpe_ratio = self.traid_models_stats.entry(model_id).entry(asset_id).sharpe_ratio.read();
            return sharpe_ratio;
        }

        fn get_model_max_drawdown(ref self: ContractState, model_id: u64, asset_id: felt252) -> felt252 {
            let max_drawdown = self.traid_models_stats.entry(model_id).entry(asset_id).max_drawdown.read();
            return max_drawdown;
        }

        fn get_model_winning_ratio(ref self: ContractState, model_id: u64, asset_id: felt252) -> u8 {
            let winning_ratio = self.traid_models_stats.entry(model_id).entry(asset_id).winning_ratio.read();
            return winning_ratio;
        }  

        
    }

    #[abi(embed_v0)]
    impl TraidingModelsOrders of ITraidingModelsOrders<ContractState> {
        
        fn deposit(ref self: ContractState, asset_id: felt252, amount: u128) -> bool {
            // Placeholder for deposit logic
            return true;
        }
        
        fn withdraw(ref self: ContractState, asset_id: felt252, amount: u128) -> bool {
            // Placeholder for withdraw logic
            return true;
        }
        
        fn authorize_model(ref self: ContractState, model_id: u64, user_address: ContractAddress) -> bool {
            // Placeholder for authorization logic
            return true;
        }
        
        fn deauthorize_model(ref self: ContractState, model_id: u64, user_address: ContractAddress) -> bool {
            // Placeholder for deauthorization logic
            return true;
        }
        
        fn is_authorized_model(ref self: ContractState, model_id: u64, user_address: ContractAddress) -> bool {
            // Placeholder for authorization check logic
            return true;
        }
       
        fn get_user_balance(ref self: ContractState, user_address: ContractAddress) -> u128 {
            // Placeholder for getting user balance logic
            return 0;
        }
        
        fn calculate_model_fees(ref self: ContractState, model_id: u64, asset_id: felt252) -> u128 {
            // Placeholder for calculating model fees logic
            return 0;
        }
    }

    #[generate_trait]
    impl TraidInternalCalculations of ITraidInternalCalculations {
        
        fn calculate_model_error(ref self: ContractState, model_id: u64, asset_id: felt252) -> felt252 {
            
            let difference: self.pr
        }
        fn calculate_model_roi(ref self: ContractState, model_id: u64, asset_id: felt252) -> felt252 {
            // Placeholder for ROI calculation logic
            return 0;
        }
        fn calculate_model_sharpe_ratio(ref self: ContractState, model_id: u64, asset_id: felt252) -> felt252 {
            // Placeholder for Sharpe ratio calculation logic
            return 0;
        }
        fn calculate_model_max_drawdown(ref self: ContractState, model_id: u64, asset_id: felt252) -> felt252 {
            // Placeholder for max drawdown calculation logic
            return 0;
        }
        fn calculate_model_winning_ratio(ref self: ContractState, model_id: u64, asset_id: felt252) -> u8 {
            // Placeholder for winning ratio calculation logic
            return 0;
        }
    }
}

