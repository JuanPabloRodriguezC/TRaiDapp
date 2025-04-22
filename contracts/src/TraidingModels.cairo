
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
    use crate::utils::types::{Metrics};

    #[storage]
    struct Storage {
        pragma_contract: ContractAddress,
        traid_wallet: ContractAddress,
        traid_models_metrics: Map<u64, Map<felt252, Metrics>>,
        model_authorization: Map<ContractAddress, Map<u64, bool>>,
        model_fees: Map<u64, u128>,
        user_balances: Map<ContractAddress, Map<u64, u256>>,
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

        fn update_model_predictions(ref self: ContractState, model_id: u64, asset_id: felt252, prediction: u128) -> bool{
            let caller: ContractAddress = get_caller_address();
            if caller != contract_address_const::<0x1234567890abcdef1234567890abcdef12345678>() {
                return false;
            }

            // Update the model predictions
            let precision = self.traid_models_metrics.entry(model_id).entry(asset_id).error.precision.read();
            let scaled_prediction = prediction * precision;
            self.traid_models_metrics.entry(model_id).entry(asset_id).prediction.write(scaled_prediction);

            return true;

        }

        fn get_portfolio_value(self: @ContractState, asset_id: felt252, amount: u128) -> u128 {
            let price = self.get_asset_price(asset_id);
            price * amount
        }

        fn get_bot_portfolio_value(self: @ContractState, asset_id: felt252, model_id: u64) -> u128 {
            let amount = self.traid_models_metrics.entry(model_id).entry(asset_id).portfolio_value.read();
            let price = self.get_asset_price(asset_id);
            price * amount
        }

        fn get_model_error(self: @ContractState, model_id: u64, asset_id: felt252) -> (u128, u128) {
            let mae = self.traid_models_metrics.entry(model_id).entry(asset_id).error.mae.read();
            let mse = self.traid_models_metrics.entry(model_id).entry(asset_id).error.mse.read();
            return (mae, mse);
        }

        fn get_model_roi(self: @ContractState, model_id: u64, asset_id: felt252) -> (u128, bool) {
            let roi = self.traid_models_metrics.entry(model_id).entry(asset_id).roi.value.read();
            let flag = self.traid_models_metrics.entry(model_id).entry(asset_id).roi.is_negative.read();
            return (roi, flag);
        }

        fn get_model_sharpe_ratio(self: @ContractState, model_id: u64, asset_id: felt252) -> felt252 {
            let sharpe_ratio = self.traid_models_metrics.entry(model_id).entry(asset_id).sharpe_ratio.read();
            return sharpe_ratio;
        }

        fn get_model_max_drawdown(self: @ContractState, model_id: u64, asset_id: felt252) -> u128 {
            let max_drawdown = self.traid_models_metrics.entry(model_id).entry(asset_id).max_drawdown.max_drawdown.read();
            return max_drawdown;
        }

        fn get_model_winning_ratio(self: @ContractState, model_id: u64, asset_id: felt252) -> u8 {
            let winning_ratio = self.traid_models_metrics.entry(model_id).entry(asset_id).winning_ratio.read();
            return winning_ratio;
        }  

        
    }

    #[abi(embed_v0)]
    impl TraidingModelsOrders of ITraidingModelsOrders<ContractState> {
        
        fn deposit(ref self: ContractState, asset_id: ContractAddress, model_id: u64, amount: u256) -> bool {
            let caller = get_caller_address();
            let erc20_dispatcher = IERC20Dispatcher { contract_address: caller };
            let deposit: bool = erc20_dispatcher.transfer(asset_id, amount);
            if deposit {
                // Update the user balance
                let current_balance = self.user_balances.entry(caller).entry(model_id).read();
                self.user_balances.entry(caller).entry(model_id).write(current_balance + amount);
            }
            return deposit;
        }   
        
        fn withdraw(ref self: ContractState, asset_id: ContractAddress, amount: u256) -> bool {
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
        
        fn calculate_model_fees(ref self: ContractState, model_id: u64, asset_id: ContractAddress) -> u128 {
            // Placeholder for calculating model fees logic
            return 0;
        }
    }

    #[generate_trait]
    impl TraidInternalCalculations of ITraidInternalCalculations {
        
        fn calculate_model_error(ref self: ContractState, model_id: u64, asset_id: felt252) -> () {
            
            let model_metrics = self.traid_models_metrics.entry(model_id).entry(asset_id);
            let actual: u128 = self.get_asset_price(asset_id);
            let mae : u128 = model_metrics.error.mae.read();
            let mse: u128 = model_metrics.error.mse.read();
            let prediction_count: u64 = model_metrics.error.prediction_count.read();
            let prediction: u128 = model_metrics.prediction.read();

            // Calculate error
            let error = if actual > prediction {
                actual - prediction
            } else {
                prediction - actual
            };

            let squared_error = error * error;
            
            if prediction_count == 0 {
                model_metrics.error.mae.write(error);
                model_metrics.error.mse.write(squared_error);
            } else{
                // Update running averages
                let new_mae = ((mae * prediction_count.into()) + error) / (prediction_count.into() + 1);
                let new_mse = ((mse * prediction_count.into()) + squared_error) / (prediction_count.into() + 1);
                model_metrics.error.mae.write(new_mae);
                model_metrics.error.mse.write(new_mse);
            }
            model_metrics.error.prediction_count.write(prediction_count + 1);
        }

        fn calculate_model_roi(ref self: ContractState, model_id: u64, asset_id: felt252) -> () {
            let initial = self.traid_models_metrics.entry(model_id).entry(asset_id).roi.initial.read();
            let current = self.get_asset_price(asset_id) * initial;
            let mut roi = self.traid_models_metrics.entry(model_id).entry(asset_id).roi.value.read();
            

            if current > initial {
                roi = (current - initial) / initial
            } else {
                roi = (initial - current) / initial;
                self.traid_models_metrics.entry(model_id).entry(asset_id).roi.is_negative.write(true);
            }
            
            self.traid_models_metrics.entry(model_id).entry(asset_id).roi.value.write(roi);
        }

        fn calculate_model_sharpe_ratio(ref self: ContractState, model_id: u64, asset_id: felt252) -> felt252 {
            
            return 0;
        }

        fn calculate_model_max_drawdown(ref self: ContractState, model_id: u64, asset_id: felt252) -> () {
            let metrics = self.traid_models_metrics.entry(model_id).entry(asset_id);
            let current_peak = metrics.max_drawdown.historical_peak.read();
            let current_value = self.get_bot_portfolio_value(asset_id, model_id);
            
            
            
            if current_value > current_peak {
                // New all-time high - update peak
                metrics.max_drawdown.historical_peak.write(current_value);
            } else if current_peak > 0 {
                // Calculate current drawdown
                let drawdown = ((current_peak - current_value) * 100) / current_peak;
                
                // Update max drawdown if this drawdown is larger
                let current_max_dd = metrics.max_drawdown.max_drawdown.read();
                if drawdown > current_max_dd {
                    metrics.max_drawdown.max_drawdown.write(drawdown);
                }
            }
        }

        fn calculate_model_winning_ratio(ref self: ContractState, model_id: u64, asset_id: felt252) -> u8 {
            // Placeholder for winning ratio calculation logic
            return 0;
        }
    }
}

