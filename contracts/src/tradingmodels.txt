
#[starknet::contract]
pub mod TraidingModels {
    use starknet::event::EventEmitter;
use starknet::{
            storage::{ StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess, Map},
            ContractAddress,
    };
    use core::starknet::{get_caller_address, contract_address_const, get_contract_address, get_block_timestamp};
    use pragma_lib::abi::{IPragmaABIDispatcher, IPragmaABIDispatcherTrait};
    use pragma_lib::types::{DataType, PragmaPricesResponse};
    use crate::interfaces::ITraidingModels::{ITraidingModelsMetrics, ITraidingModelsOrders};
    use crate::interfaces::IERC20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use crate::interfaces::IJediSwap::{ ExactInputSingleParams, IJediSwapV2SwapRouterDispatcher, IJediSwapV2SwapRouterDispatcherTrait};
    use crate::utils::functions::abs_diff;
    use crate::utils::types::{Metrics, TradingParameters};
    use crate::utils::events::{BotAuthorized, FundsDeposited, FundsWithdrawn, ExpiredFundsWithdrawn, ModelUpdated, TradeExecuted,
                                ModelMetricsUpdated, TradingParametersSet};

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        TradeExecuted: TradeExecuted,
        BotAuthorized: BotAuthorized,
        FundsDeposited: FundsDeposited,
        FundsWithdrawn: FundsWithdrawn,
        ExpiredFundsWithdrawn: ExpiredFundsWithdrawn,
        ModelUpdated: ModelUpdated,
        ModelMetricsUpdated: ModelMetricsUpdated,
        TradingParametersSet: TradingParametersSet,
    }

    #[storage]
    struct Storage {
        admin_address: ContractAddress,
        pragma_contract: ContractAddress,
        jedi_swap_contract: ContractAddress,
        token_to_usd_ticker: Map<ContractAddress, felt252>,
        model_count: u64,
        model_owner: Map<u64, ContractAddress>,
        model_metrics: Map<u64, Metrics>,
        model_tokens: Map<u64, (ContractAddress, ContractAddress)>,
        model_user_count: Map<u64, u32>,
        model_users: Map<u64, Map<u32, ContractAddress>>,
        user_balances: Map<ContractAddress, Map<u64, Map<ContractAddress, u256>>>,
        trading_parameters: Map<ContractAddress, Map<u64, TradingParameters>>,
        model_user_authorization: Map<ContractAddress, Map<u64, bool>>,
        model_fees: Map<u64, u128>,
        
        
    }    

    #[constructor]
    fn constructor(ref self: ContractState, pragma_oracle_address: ContractAddress, jedi_swap_address: ContractAddress) {
        self.pragma_contract.write(pragma_oracle_address);
        self.jedi_swap_contract.write(jedi_swap_address);

        //assets from pragma oracle
        self.token_to_usd_ticker.entry(contract_address_const::<0xD76b5c2A23ef78368d8E34288B5b65D616B746aE>()).write(19514442401534788);//ETH
        self.token_to_usd_ticker.entry(contract_address_const::<0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599>()).write(6287680677296296772);//WBTC
        self.token_to_usd_ticker.entry(contract_address_const::<0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0>()).write(412383036120118613857092);//WSTEH
        self.token_to_usd_ticker.entry(contract_address_const::<0x686f2404e77Ab0d9070a46cdfb0B7feCDD2318b0>()).write(1407668255603079598916);//LORDS
        self.token_to_usd_ticker.entry(contract_address_const::<0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984>()).write(24011449254105924);//UNI
        self.token_to_usd_ticker.entry(contract_address_const::<0xCa14007Eff0dB1f8135f4C25B34De49AB0d42766>()).write(6004514686061859652);//STRK
        self.token_to_usd_ticker.entry(contract_address_const::<0xb2606492712D311be8f41d940AFE8CE742A52D44>()).write(6504691291565413188);//ZEND
        self.token_to_usd_ticker.entry(contract_address_const::<0x610dBd98A28EbbA525e9926b6aaF88f9159edbfd>()).write(5643947469983535940);//NESTR
    }

    #[abi(embed_v0)]
    impl TraidingModelsMetrics of ITraidingModelsMetrics<ContractState> {

        fn add_model(
            ref self: ContractState,
            model_name: felt252,
            token_1: ContractAddress,
            token_2: ContractAddress,
            owner: ContractAddress,
        ) -> u64 {
            let count = self.model_count.read();
            assert(token_1 != token_2, 'Tokens must be different');
            self.model_tokens.entry(count).write((token_1, token_2));
            self.model_count.write(count + 1);
            self.model_owner.entry(count).write(owner);
            count
        }

        fn remove_model(ref self: ContractState, model_id: u64) -> () {
            self.only_admin();
            let user_count = self.model_user_count.entry(model_id).read();

            for user in 0..user_count{
                self.withdraw_expired(model_id, self.model_users.entry(model_id).entry(user).read(), get_block_timestamp());
                self.model_user_authorization.entry(self.model_users.entry(model_id).entry(user).read()).entry(model_id).write(false);
            };

            return ();
        }

        /// Update the current model predictions
        /// @param model_id: The model id to update
        /// @param asset_id: The asset id to update
        /// @param prediction: The new prediction value
        /// @return: True if the update was successful, false otherwise
        fn update_model_predictions(ref self: ContractState, model_id: u64, prediction: u128) -> (){
            let caller: ContractAddress = get_caller_address();
            // Check if the caller is the contract address
            assert(caller != self.admin_address.read(), 'Only admin can update');
            // Update the model predictions
            let precision = self.model_metrics.entry(model_id).error.precision.read();
            let scaled_prediction = prediction * precision;
            self.model_metrics.entry(model_id).prediction.write(scaled_prediction);

            self.emit(
                ModelUpdated{
                    model_id: model_id,
                    prediction: scaled_prediction,
                }
            );

            return ();
        }

        fn get_bot_portfolio_value(self: @ContractState, model_id: u64) -> u128 {
            let amount: u128 = self.model_metrics.entry(model_id).portfolio_value.read();
            let (_, token_address): (ContractAddress, ContractAddress) = self.model_tokens.entry(model_id).read();
            let price = self.get_asset_price(self.token_to_usd_ticker.entry(token_address).read());
            price * amount
        }

        /// Get the current model error
        /// @param model_id: The model id to get the metrics for
        /// @return: The current model absolute error, mean squared error
        fn get_model_error(self: @ContractState, model_id: u64) -> (u128, u128) {
            let mae = self.model_metrics.entry(model_id).error.mae.read();
            let mse = self.model_metrics.entry(model_id).error.mse.read();
            return (mae, mse);
        }

        /// Get the current model ROI
        /// @param model_id: The model id to get the metrics for
        /// @return: The current model ROI
        fn get_model_roi(self: @ContractState, model_id: u64) -> (u128, bool) {
            let roi = self.model_metrics.entry(model_id).roi.value.read();
            let flag = self.model_metrics.entry(model_id).roi.is_negative.read();
            return (roi, flag);
        }

        /// Get the current model max drawdown
        /// @param model_id: The model id to get the metrics for    
        /// @return: The current model max drawdown
        fn get_model_max_drawdown(self: @ContractState, model_id: u64) -> u128 {
            let max_drawdown = self.model_metrics.entry(model_id).max_drawdown.max_drawdown.read();
            return max_drawdown;
        }

        /// Get the current model winning ratio
        /// @param model_id: The model id to get the metrics for
        /// @return: The current model winning ratio
        fn get_model_winning_ratio(self: @ContractState, model_id: u64) -> u128 {
            let winning_ratio = self.model_metrics.entry(model_id).winning_ratio.ratio.read();
            return winning_ratio;
        }

        fn calculate_model_fees(ref self: ContractState, model_id: u64, asset_id: ContractAddress) -> u128 {
            // Placeholder for calculating model fees logic
            return 0;
        }

        
    }

    #[abi(embed_v0)]
    impl TraidingModelsOrders of ITraidingModelsOrders<ContractState> {

        /// Get current median price for a token pair
        /// calls pragma oracle contract
        /// @param asset_id: The asset id to get the price for
        /// @return: The current price of the asset
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

        // verifies that admin is the caller
        fn only_admin(self: @ContractState) -> () {
            let caller = get_caller_address();
            assert(caller == self.admin_address.read(), 'Only admin allowed');
        }

        fn find_user_index(self: @ContractState, model_id: u64, user_address: ContractAddress) -> u32 {
            let user_count = self.model_user_count.entry(model_id).read();
            let mut index = 0;
            for i in 0..user_count {
                let user: ContractAddress = self.model_users.entry(model_id).entry(i).read();
                if user == user_address {
                    index = i;
                    break;
                }
            };
            return index;
        }

        /// Deposit funds into the contract
        /// @param token_address: The address of the token to deposit
        /// @param model_id: The model id to deposit for
        /// @param amount: The amount to deposit
        /// @param threshold_percentage: The threshold percentage to activate the trade
        /// @param expiration_days: The expiration days to trade for this user 
        fn deposit(
            ref self: ContractState,
            token_address: ContractAddress,
            model_id: u64,
            amount: u256,
            threshold_percentage: u128,
            expiration: u64
        ) -> bool {
            // verify token
            let (token1, token2): (ContractAddress, ContractAddress) = self.model_tokens.entry(model_id).read();
            assert(token_address == token1 || token_address == token2, 'Token not authorized');

            let caller = get_caller_address();
            let erc20_dispatcher = IERC20Dispatcher { contract_address: token_address};
            let deposit: bool = erc20_dispatcher.transfer_from(caller, get_contract_address(), amount);
            if deposit {
                // Update the user balance
                let current_balance = self.user_balances.entry(caller).entry(model_id).entry(token_address).read();
                self.user_balances.entry(caller).entry(model_id).entry(token_address).write(current_balance + amount);

                self.emit(
                FundsDeposited{
                    model_id: model_id,
                    user_address: caller,
                    amount: amount,
                }
            );
            }

            if !self.model_user_authorization.entry(caller).entry(model_id).read() {
                self.model_user_authorization.entry(caller).entry(model_id).write(true);
                let count = self.model_user_count.entry(model_id).read();
                self.model_user_count.entry(model_id).write(count + 1);
                self.emit(
                    BotAuthorized{
                        model_id: model_id,
                        user_address: caller,
                    }
                );
            }

            // set user trading parameters
            let current_time = get_block_timestamp();
            let expiration_timestamp = current_time + expiration * 3600;  // 86400 seconds per day
            self.trading_parameters.entry(caller).entry(model_id).write(TradingParameters{
                threshold_percentage: threshold_percentage,
                expiration_timestamp: expiration_timestamp,
            });

            self.emit(
                TradingParametersSet{
                    model_id: model_id,
                    user: caller,
                    threshold_percentage: threshold_percentage,
                    expiration_timestamp: expiration_timestamp,
                }
            );

            
            return deposit;
        }   
        
        /// Withdraw funds from the contract
        /// @param token_address: The address of the token to withdraw
        /// @param model_id: The model id to withdraw for
        /// @param amount: The amount to withdraw
        /// @param threshold_percentage: The threshold percentage to activate the trade
        /// @param expiration_days: The expiration days to trade for this user
        /// @return: True if the withdrawal was successful, false otherwise
        fn withdraw(
            ref self: ContractState,
            token_address: ContractAddress,
            model_id: u64,
            amount: u256,
        ) -> bool {
            let caller = get_caller_address();

            let current_balance = self.user_balances.entry(caller).entry(model_id).entry(token_address).read();
            assert(current_balance >= amount, 'Insufficient balance');

            let erc20_dispatcher = IERC20Dispatcher { contract_address: token_address };
            let withdrawal: bool = erc20_dispatcher.transfer_from(get_contract_address(), caller, amount);

            if withdrawal {
                self.user_balances.entry(caller).entry(model_id).entry(token_address).write(current_balance - amount);
                self.emit(
                    FundsWithdrawn{
                        model_id: model_id,
                        user_address: caller,
                        amount: amount,
                    }
                );
            }

            if ((current_balance - amount) == 0) {
                // Remove user authorization if balance is zero
                self.model_user_authorization.entry(caller).entry(model_id).write(false);
                let count = self.model_user_count.entry(model_id).read();
                self.model_user_count.entry(model_id).write(count - 1);
            }
            return withdrawal;
        }

        /// Update the trading parameters for a user
        /// @param model_id: The model id to update
        /// @param threshold_percentage: The threshold percentage to activate the trade
        /// @param expiration_days: The expiration days to trade for this user
        /// @return: none
        fn update_trading_parameters(
            ref self: ContractState,
            model_id: u64,
            threshold_percentage: u128,
            expiration: u64
        ) -> () {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            let expiration_timestamp = current_time + expiration * 3600;  // 86400 seconds per day
            self.trading_parameters.entry(caller).entry(model_id).write(TradingParameters{
                threshold_percentage: threshold_percentage,
                expiration_timestamp: expiration_timestamp,
            });

            self.emit(
                TradingParametersSet{
                    model_id: model_id,
                    user: caller,
                    threshold_percentage: threshold_percentage,
                    expiration_timestamp: expiration_timestamp,
                }
            );
            return ();
        }

        /// Get the user balance for a model
        /// @param model_id: The model id to get the balance for
        /// @param user_address: The user address to get the balance for
        /// @return: The user balance for the model
        fn get_user_balance(self: @ContractState, model_id: u64, user_address: ContractAddress) -> u256 {
            let (token_address, _): (ContractAddress, ContractAddress) = self.model_tokens.entry(model_id).read();
            self.user_balances.entry(user_address).entry(model_id).entry(token_address).read()
        }

        /// Authorize a model to trade for a user
        /// @param model_id: The model id to authorize
        /// @param user_address: The user address to authorize
        /// @return: none
        fn authorize_user(ref self: ContractState, model_id: u64, user_address: ContractAddress) -> () {

            self.model_user_authorization.entry(user_address).entry(model_id).write(true);
            let count = self.model_user_count.entry(model_id).read();
            self.model_users.entry(model_id).entry(count).write(user_address);
            self.model_user_count.entry(model_id).write(count + 1);
            self.emit(
                BotAuthorized{
                    model_id: model_id,
                    user_address: user_address,
                }
            );
        }

        /// Deauthorizes user from model and removes them from the list of users, however balance is untouched
        /// @param model_id: The model id from which to deauthorize user
        /// @param user_address: The user address to deauthorize
        /// @return: none
        fn deauthorize_user(ref self: ContractState, model_id: u64, user_address: ContractAddress) -> () {
            self.model_user_authorization.entry(user_address).entry(model_id).write(false);
            let count = self.model_user_count.entry(model_id).read();
            

            let user_index = self.find_user_index(model_id, user_address);
            if (user_index != count - 1) {
                let last_user = self.model_users.entry(model_id).entry(count - 1).read();
                self.model_users.entry(model_id).entry(user_index).write(last_user);
                
            }

            self.model_user_count.entry(model_id).write(count - 1);

            return ();
        }

        /// Execute trades for all users authorized for this model
        /// @param model_id: The model id to execute trades for
        /// @param predicted_price: The predicted price to compare against
        /// @return: none
        fn execute_batch_trades(
            ref self: ContractState,
            model_id: u64,
            predicted_price: u128
        ) -> () {
            let mut current_price: u128 = 0;

            let (token_1, token_2): (ContractAddress, ContractAddress) = self.model_tokens.entry(model_id).read();

            //this gets price for token_1 in terms of token_2 if token_2 is not USDC
            if token_2 != contract_address_const::<0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48>() {
                current_price = self.get_asset_price(self.token_to_usd_ticker.entry(token_1).read());
                let token_2_price = self.get_asset_price(self.token_to_usd_ticker.entry(token_2).read());
                current_price = (current_price * 100000000) / token_2_price;
            }else{
                current_price = self.get_asset_price(self.token_to_usd_ticker.entry(token_1).read());
            }

            let mut target_token: ContractAddress = contract_address_const::<0x0>();

            if current_price > predicted_price{
                target_token = token_1;
            } else {
                target_token = token_2;
            }

            self.process_users_recursively(
                model_id,
                0,
                self.model_user_count.entry(model_id).read(),
                current_price,
                predicted_price,
                target_token
            );

        }

        /// Iterates over model_users and executes trades for each user
        /// @param model_id: The model id to execute trades for
        /// @param current_index: The current user to process
        /// @param user_count: The total number of users to process
        /// @param current_price: The current price of the asset
        /// @param predicted_price: The predicted price of the asset
        /// @param token_address: The token address to execute trades for
        /// @return: none
        fn process_users_recursively(
            ref self: ContractState,
            model_id: u64,
            current_index: u32,
            user_count: u32,
            current_price: u128,
            predicted_price: u128,
            token_address: ContractAddress
        ) -> () {
            if current_index >= user_count {
                return ();
            }

            let user: ContractAddress = self.model_users.entry(model_id).entry(current_index).read();
            let user_balance: u256 = self.user_balances.entry(user).entry(model_id).entry(token_address).read();

            if user_balance == 0 {
                return self.process_users_recursively(
                    model_id,
                    current_index + 1,
                    user_count,
                    current_price,
                    predicted_price,
                    token_address
                );
            }
            
            let params: TradingParameters = self.trading_parameters.entry(user).entry(model_id).read();

            let current_time: u64 = get_block_timestamp();
            if (current_time <= params.expiration_timestamp) {
                let percentage_diff: u128 = abs_diff(current_price, predicted_price) * 100 / current_price;

                if (percentage_diff > params.threshold_percentage) {
                    self.execute_user_trade(model_id, user, token_address, user_balance);
                }
                
            } else {
                self.withdraw_expired(model_id, user, current_time);
            }

            return self.process_users_recursively(
                model_id,
                current_index + 1,
                user_count,
                current_price,
                predicted_price,
                token_address
            );
        }

        /// Execute a trade for a user
        /// @param model_id: The model id to execute trades for
        /// @param user_address: The user address to execute trades for
        /// @param token_address: The token address to execute trades for
        /// @param amount: The amount to execute trades for
        /// @return: none
        fn execute_user_trade(
            ref self: ContractState,
            model_id: u64,
            user_address: ContractAddress,
            token_address: ContractAddress,
            amount: u256
        ) -> () {

            let (token_1, token_2): (ContractAddress, ContractAddress) = self.model_tokens.entry(model_id).read();

            let mut target_token: ContractAddress = contract_address_const::<0x0>();

            if token_address == token_1 {
                target_token = token_2;
            } else {
                target_token = token_1;
            }

            let jedi_swap_dispatcher = IJediSwapV2SwapRouterDispatcher { contract_address: self.jedi_swap_contract.read() };
            jedi_swap_dispatcher.exact_input_single(
                ExactInputSingleParams {
                    token_in: token_address,
                    token_out: target_token,
                    fee: 20,
                    recipient: get_contract_address(),
                    deadline: get_block_timestamp() + 3600,// 1 hour
                    amount_in: amount,
                    amount_out_minimum: 0,
                    sqrt_price_limit_X96: 0,
                }
            );

            self.emit(TradeExecuted{
                model_id: model_id,
                asset_id: token_address,
                prediction: self.model_metrics.entry(model_id).prediction.read(),
                amount: amount,
            });   
        }

        /// Withdraw expired funds for a user
        /// @param model_id: The model id to withdraw for
        /// @param token_address: The token address in which transaction is made
        /// @param user_address: The user address withdrawing funds
        /// @param timestamp: The set timestamp
        fn withdraw_expired(ref self: ContractState, model_id: u64, user_address: ContractAddress, timestamp: u64) -> () {
            
            let (token1, token2): (ContractAddress, ContractAddress) = self.model_tokens.entry(model_id).read();

    
            let balance1 = self.user_balances.entry(user_address).entry(model_id).entry(token1).read();
            let balance2 = self.user_balances.entry(user_address).entry(model_id).entry(token2).read();
            let erc20_dispatcher = IERC20Dispatcher { contract_address: token2 };

            if balance1 > 0 {
                let withdrawal = erc20_dispatcher.transfer(user_address, balance1);

                if withdrawal {
                    self.user_balances.entry(user_address).entry(model_id).entry(token1).write(0);
                    self.model_user_authorization.entry(user_address).entry(model_id).write(false);
                    self.emit(
                        ExpiredFundsWithdrawn{
                            model_id: model_id,
                            user_address: user_address,
                            amount: balance1,
                            expiration_timestamp: timestamp,
                        }
                
                    );
                }
            }

            if balance2 > 0 {
                
                let withdrawal = erc20_dispatcher.transfer(user_address, balance2);

                if withdrawal {
                    self.user_balances.entry(user_address).entry(model_id).entry(token2).write(0);
                    self.model_user_authorization.entry(user_address).entry(model_id).write(false);
                    self.emit(
                        ExpiredFundsWithdrawn{
                            model_id: model_id,
                            user_address: user_address,
                            amount: balance2,
                            expiration_timestamp: timestamp,
                        }
                    );
                }
            }
        }
    }

    #[generate_trait]
    impl TraidInternalCalculations of ITraidInternalCalculations {
        
        fn calculate_model_error(ref self: ContractState, model_id: u64, asset_id: felt252) -> () {
            
            let model_metrics = self.model_metrics.entry(model_id);
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
            let initial = self.model_metrics.entry(model_id).roi.initial.read();
            let current = self.get_asset_price(asset_id) * initial;
            let mut roi = self.model_metrics.entry(model_id).roi.value.read();
            

            if current > initial {
                roi = (current - initial) / initial
            } else {
                roi = (initial - current) / initial;
                self.model_metrics.entry(model_id).roi.is_negative.write(true);
            }
            
            self.model_metrics.entry(model_id).roi.value.write(roi);
        }

        fn calculate_model_max_drawdown(ref self: ContractState, model_id: u64, asset_id: felt252) -> () {
            let metrics = self.model_metrics.entry(model_id);
            let current_peak = metrics.max_drawdown.historical_peak.read();
            let current_value = self.get_bot_portfolio_value(model_id);
            
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

        fn calculate_model_winning_ratio(ref self: ContractState, model_id: u64, asset_id: felt252) -> u128 {
            let metrics = self.model_metrics.entry(model_id);
            let wins = metrics.winning_ratio.wins.read();
            let losses = metrics.winning_ratio.losses.read();
            let ratio = if wins + losses > 0 {
                (wins * 100) / (wins + losses)
            } else {
                0
            };
            ratio
        }
    }
}

