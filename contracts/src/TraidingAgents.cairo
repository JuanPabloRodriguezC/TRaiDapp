#[starknet::contract]
pub mod TraidingAgents {
use starknet::{ ContractAddress, get_block_timestamp, get_caller_address };
    use crate::interfaces::ITraidingAgents::{ IAgentManager };
    use crate::interfaces::IERC20::{ IERC20Dispatcher, IERC20DispatcherTrait };
    use crate::utils::types::{
        AgentConfig, UserConfig, UserSubscription, TradeDecision, AgentPerformance, 
        UserBalance
    };
    use crate::utils::events::{
        AgentSubscribed, AgentUnsubscribed,AgentDecision, TradeExecuted, BalanceUpdated, AuthorizationChanged,
        ReservationMade, ReservationReleased, TradeSettled, FeesAllocated, PlatformFeesWithdrawn
    };
    use starknet::storage::{ StoragePointerReadAccess, StoragePointerWriteAccess, Map, Vec, VecTrait, MutableVecTrait, StoragePathEntry };

    #[storage]
    struct Storage {
        agent_configs: Map<felt252, AgentConfig>,
        agent_ids: Vec<felt252>,
        token_addresses: Vec<ContractAddress>,
        user_subscriptions: Map<(ContractAddress, felt252), UserSubscription>,
        user_balances: Map<(ContractAddress, ContractAddress), UserBalance>,
        agent_reservations: Map<(ContractAddress, felt252, ContractAddress), u256>,// Agent-specific reservations: (user, agent_id, token) -> reserved_amount
        authorized_recorders: Map<ContractAddress, bool>, // Backend services that can record decisions
        decisions: Map<u32, TradeDecision>,
        decision_counter: u32,
        agent_performance: Map<felt252, AgentPerformance>,
        admin: ContractAddress,
        withdrawable_balances: Map<(ContractAddress, ContractAddress), u256>,
        platform_fee_rate: u256, // e.g., 250 = 2.5%
        platform_treasury: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        AgentSubscribed: AgentSubscribed,
        AgentDecision: AgentDecision,
        TradeExecuted: TradeExecuted,
        BalanceUpdated: BalanceUpdated,
        AuthorizationChanged: AuthorizationChanged,
        ReservationMade: ReservationMade,
        ReservationReleased: ReservationReleased,
        TradeSettled: TradeSettled,
        FeesAllocated: FeesAllocated,
        PlatformFeesWithdrawn: PlatformFeesWithdrawn,
        AgentUnsubscribed: AgentUnsubscribed,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.admin.write(admin);
    }

    #[abi(embed_v0)]
    impl AgentManagerImpl of IAgentManager<ContractState> {
        fn create_agent_config(
            ref self: ContractState,
            agent_id: felt252,
            name: felt252,
            strategy: felt252,
            max_automation_level: u8,
            max_trades_per_day: u32,
            max_api_cost_per_day: u256,
            max_risk_tolerance: u32,
            max_position_size: u256,
            min_stop_loss_threshold: u32
        ) {
            assert(get_caller_address() == self.admin.read(), 'Only admin can create agents');
            assert(max_automation_level <= 3, 'Invalid automation level');
            assert(max_risk_tolerance <= 100, 'Invalid risk tolerance');
            assert(min_stop_loss_threshold <= 10000, 'Invalid stop loss');

            let config = AgentConfig {
                name,
                strategy,
                max_automation_level,
                max_trades_per_day,
                max_api_cost_per_day,
                max_risk_tolerance,
                max_position_size,
                min_stop_loss_threshold,
                is_active: true,
            };

            self.agent_configs.entry(agent_id).write(config);
        }

        fn add_token_address(
            ref self: ContractState,
            token_address: ContractAddress
        ) {
            assert(get_caller_address() == self.admin.read(), 'Only admin can add tokens');

            self.token_addresses.push(token_address);
        }

        fn subscribe_to_agent(
            ref self: ContractState,
            agent_id: felt252,
            user_config: UserConfig
        ) {
            let user = get_caller_address();
            let current_time = get_block_timestamp();
            let automation_level = user_config.automation_level;
            
            // Verify agent exists and is active
            let agent_config = self.agent_configs.entry(agent_id).read();
            assert(agent_config.is_active, 'Agent not active');

            // Validate user config doesn't exceed agent limits
            assert(user_config.max_trades_per_day <= agent_config.max_trades_per_day, 'Exceeds agent trade limit');
            assert(user_config.max_position_size <= agent_config.max_position_size, 'Exceeds agent position limit');
            assert(user_config.automation_level <= agent_config.max_automation_level, 'Exceeds agent automation level');
            assert(user_config.risk_tolerance <= agent_config.max_risk_tolerance, 'Exceeds agent risk tolerance');
            assert(user_config.stop_loss_threshold >= agent_config.min_stop_loss_threshold, 'Below agent min stop loss');

            let subscription = UserSubscription {
                agent_id,
                user,
                user_config,
                daily_api_cost: 30000,
                daily_trades: 0,
                last_reset_day: current_time / 86400,
                subscribed_at: current_time,
                is_authorized: true,
            };

            self.user_subscriptions.entry((user, agent_id)).write(subscription);

            self.emit(AgentSubscribed {
                user,
                agent_id,
                automation_level: automation_level,
            });
        }

        fn unsubscribe_from_agent(
            ref self: ContractState,
            agent_id: felt252
        ) {
            let user = get_caller_address();
            let mut subscription = self.user_subscriptions.entry((user, agent_id)).read();
            
            assert(subscription.is_authorized, 'User not subscribed to agent');
            
            subscription.is_authorized = false;
            subscription.user_config.max_trades_per_day = 0;
            subscription.user_config.max_position_size = 0;
            self.user_subscriptions.entry((user, agent_id)).write(subscription);
            
            self.emit(AgentUnsubscribed {
                user,
                agent_id,
            });
        }
        

        fn authorize_agent_trading(
            ref self: ContractState,
            agent_id: felt252,
            authorized: bool
        ) {
            let user = get_caller_address();
            let mut subscription = self.user_subscriptions.entry((user, agent_id)).read();
            
            subscription.is_authorized = authorized;
            self.user_subscriptions.entry((user, agent_id)).write(subscription);

            self.emit(AuthorizationChanged {
                user,
                agent_id,
                authorized,
            });
        }

        fn deposit_for_trading(
            ref self: ContractState,
            token_address: ContractAddress,
            amount: u256
        ) {
            let user = get_caller_address();
            let contract_address = starknet::get_contract_address();
            let current_time = get_block_timestamp();
            
            // Execute the actual token transfer
            let token = IERC20Dispatcher { contract_address: token_address };

            // Check user's token balance
            let user_balance = token.balance_of(user);
            assert(user_balance >= amount, 'Insufficient token balance');

            // Check allowance
            let allowance = token.allowance(user, contract_address);
            assert(allowance >= amount, 'Insufficient allowance');

            // Execute the actual token transfer
            let success = token.transfer_from(user, contract_address, amount);
            assert(success, 'Token transfer failed');
            
            // Update user balance only after successful transfer
            let mut balance = self.user_balances.entry((user, token_address)).read();
            balance.total_balance += amount;
            balance.available_balance += amount;
            balance.last_updated = current_time;
            let new_total_balance = balance.total_balance;
            let new_available_balance = balance.available_balance;

            self.user_balances.entry((user, token_address)).write(balance);

            self.emit(BalanceUpdated {
                user,
                token_address,
                new_total_balance: new_total_balance,
                new_available_balance: new_available_balance,
            });
        }

        fn withdraw_from_trading(
            ref self: ContractState,
            token_address: ContractAddress,
            amount: u256
        ) {
            let user = get_caller_address();
            let mut balance = self.user_balances.entry((user, token_address)).read();
            
            assert(balance.available_balance >= amount, 'Insufficient available balance');
            
            // Execute token transfer
            let token = IERC20Dispatcher { contract_address: token_address };
            let success = token.transfer(user, amount);
            assert(success, 'Token transfer failed');

            balance.total_balance -= amount;
            balance.available_balance -= amount;
            balance.last_updated = get_block_timestamp();
            let new_total_balance = balance.total_balance;
            let new_available_balance = balance.available_balance;

            self.user_balances.entry((user, token_address)).write(balance);

            self.emit(BalanceUpdated {
                user,
                token_address,
                new_total_balance: new_total_balance,
                new_available_balance: new_available_balance,
            });
        }

        fn reserve_for_agent_trade(
            ref self: ContractState,
            user: ContractAddress,
            agent_id: felt252,
            token_address: ContractAddress,
            amount: u256
        ) -> bool {
            let balance = self.user_balances.entry((user, token_address)).read();

            if (balance.available_balance >= amount) {
                let mut balance = self.user_balances.entry((user, token_address)).read();

                // Update available balance
                balance.available_balance -= amount;
                balance.last_updated = get_block_timestamp();

                self.user_balances.entry((user, token_address)).write(balance);
                
                // Add to agent-specific reservation
                let current_reservation = self.agent_reservations.entry((user, agent_id, token_address)).read();
                self.agent_reservations.entry((user, agent_id, token_address)).write(current_reservation + amount);
                
                self.emit(ReservationMade {
                    user,
                    agent_id,
                    token_address,
                    amount,
                });
                
                true
            } else {
                false
            }
        }

        fn release_agent_reservation(
            ref self: ContractState,
            user: ContractAddress,
            agent_id: felt252,
            token_address: ContractAddress,
            amount: u256
        ) {
            let current_reservation = self.agent_reservations.entry((user, agent_id, token_address)).read();
            let release_amount = if current_reservation >= amount { amount } else { current_reservation };
            
            // Update reservation
            self.agent_reservations.entry((user, agent_id, token_address)).write(current_reservation - release_amount);
            
            // Update available balance
            let mut balance = self.user_balances.entry((user, token_address)).read();
            balance.available_balance += release_amount;
            balance.last_updated = get_block_timestamp();
            self.user_balances.entry((user, token_address)).write(balance);
            
            self.emit(ReservationReleased {
                user,
                agent_id,
                token_address,
                amount: release_amount,
            });
        }

        fn execute_trade_settlement(
            ref self: ContractState,
            user: ContractAddress,
            agent_id: felt252,
            from_token: ContractAddress,
            to_token: ContractAddress,
            from_amount: u256,
            to_amount: u256
        ) {
            // This is called after a successful DEX trade to update balances
            assert(self.authorized_recorders.entry(get_caller_address()).read(), 'Not authorized to execute');
            // Release reservation from the "from" token
            let current_from_reservation = self.agent_reservations.entry((user, agent_id, from_token)).read();
            let release_amount = if current_from_reservation >= from_amount { from_amount } else { current_from_reservation };
            self.agent_reservations.entry((user, agent_id, from_token)).write(current_from_reservation - release_amount);
            
            // Update from_token balance (reduce total)
            let mut from_balance = self.user_balances.entry((user, from_token)).read();
            from_balance.total_balance -= from_amount;
            from_balance.last_updated = get_block_timestamp();
            self.user_balances.entry((user, from_token)).write(from_balance);
            
            // Update to_token balance (increase total and available)
            let mut to_balance = self.user_balances.entry((user, to_token)).read();
            to_balance.total_balance += to_amount;
            to_balance.available_balance += to_amount;
            to_balance.last_updated = get_block_timestamp();
            self.user_balances.entry((user, to_token)).write(to_balance);
            
            self.emit(TradeSettled {
                user,
                agent_id,
                from_token,
                to_token,
                from_amount,
                to_amount,
            });
        }

        fn record_agent_decision(
            ref self: ContractState,
            agent_id: felt252,
            user: ContractAddress,
            token_address: ContractAddress,
            action: felt252,
            amount: u256,
            confidence: u32,
            reasoning_hash: felt252
        ) {
            assert(self.authorized_recorders.entry(get_caller_address()).read(), 'Not authorized to execute');
            let current_time = get_block_timestamp();
            let decision_id = self.decision_counter.read() + 1;
            self.decision_counter.write(decision_id);

            let decision = TradeDecision {
                agent_id,
                user,
                token_address,
                action,
                amount,
                confidence,
                reasoning_hash,
                timestamp: current_time,
                executed: false,
            };

            self.decisions.entry(decision_id).write(decision);

            self.emit(AgentDecision {
                decision_id,
                agent_id,
                user,
                action,
                amount,
                confidence,
            });
        }

        fn mark_decision_executed(
            ref self: ContractState,
            decision_id: u32,
            success: bool,
            actual_amount: u256
        ) {
            assert(self.authorized_recorders.entry(get_caller_address()).read(), 'Not authorized to execute');
            let mut decision = self.decisions.entry(decision_id).read();
            let user = decision.user;
            decision.executed = true;
            self.decisions.entry(decision_id).write(decision);

            self.emit(TradeExecuted {
                decision_id,
                user: user,
                success,
                actual_amount,
            });
        }

        fn authorize_decision_recorder(
            ref self: ContractState,
            recorder: ContractAddress,
            authorized: bool
        ) {
            assert(get_caller_address() == self.admin.read(), 'Only admin can authorize');
            self.authorized_recorders.entry(recorder).write(authorized);
        }

        fn update_agent_performance(
            ref self: ContractState,
            agent_id: felt252,
            pnl_change: i128,
            was_successful: bool,
            confidence: u32
        ) {
            assert(self.authorized_recorders.entry(get_caller_address()).read(), 'Not authorized to execute');
            let mut performance = self.agent_performance.entry(agent_id).read();
            
            performance.total_decisions += 1;
            if was_successful {
                performance.successful_trades += 1;
            }
            performance.total_pnl += pnl_change;
            performance.last_updated = get_block_timestamp();
            let total_confidence = performance.avg_confidence * performance.total_decisions;
            let new_total_confidence = total_confidence + confidence;
            performance.avg_confidence = new_total_confidence / performance.total_decisions;
            
            self.agent_performance.entry(agent_id).write(performance);
        }

        fn can_agent_trade(
            self: @ContractState,
            user: ContractAddress,
            agent_id: felt252,
            token_address: ContractAddress,
            amount: u256
        ) -> bool {
            let subscription = self.user_subscriptions.entry((user, agent_id)).read();
            let current_day = get_block_timestamp() / 86400;
            
            // Check authorization
            if !subscription.is_authorized {
                return false;
            }
            
            // Check daily trade limit
            let trades_today = if subscription.last_reset_day == current_day {
                subscription.daily_trades
            } else {
                0
            };
            
            if trades_today >= subscription.user_config.max_trades_per_day {
                return false;
            }
            
            // Check position size limit
            if amount > subscription.user_config.max_position_size {
                return false;
            }
            
            // Check available balance for this specific agent
            let available = self.get_available_balance_for_agent(user, agent_id, token_address);
            if amount > available {
                return false;
            }
            true
        }

        fn get_available_balance_for_agent(
            self: @ContractState,
            user: ContractAddress,
            agent_id: felt252,
            token_address: ContractAddress
        ) -> u256 {
            let balance = self.user_balances.entry((user, token_address)).read();
            
            // Available balance is what's not reserved by any agent
            balance.available_balance
        }

        fn get_daily_limits_remaining(
            self: @ContractState,
            user: ContractAddress,
            agent_id: felt252
        ) -> (u32, u256) {
            let subscription = self.user_subscriptions.entry((user, agent_id)).read();
            let current_day = get_block_timestamp() / 86400;
            
            let (trades_used, api_cost_used) = if subscription.last_reset_day == current_day {
                (subscription.daily_trades, subscription.daily_api_cost)
            } else {
                (0, 0)
            };
            
            let trades_remaining = subscription.user_config.max_trades_per_day - trades_used;
            let api_cost_remaining = subscription.user_config.max_api_cost_per_day - api_cost_used;
            
            (trades_remaining, api_cost_remaining)
        }

        fn get_user_subscription(
            self: @ContractState,
            user: ContractAddress,
            agent_id: felt252
        ) -> UserSubscription {
            let caller = get_caller_address();
            assert(caller == user || caller == self.admin.read() || self.authorized_recorders.entry(caller).read(), 'caller not authorized');
            self.user_subscriptions.entry((user, agent_id)).read()
        }

        fn get_user_balance(
            self: @ContractState,
            user: ContractAddress,
            token_address: ContractAddress
        ) -> UserBalance {
            let caller = get_caller_address();
            assert(caller == user || caller == self.admin.read() || self.authorized_recorders.entry(caller).read(), 'caller not authorized');
            self.user_balances.entry((user, token_address)).read()
        }

        fn get_user_balances(
            self: @ContractState,
            user: ContractAddress
        ) -> Array<(ContractAddress, UserBalance)> {
            let caller = get_caller_address();
            assert(caller == user || caller == self.admin.read() || self.authorized_recorders.entry(caller).read(), 'caller not authorized');
            
            let mut balances = array![];
            for i in 0..self.token_addresses.len() {
                let token_address = self.token_addresses.at(i).read();
                let balance = self.user_balances.entry((user, token_address)).read();
                balances.append((token_address, balance));
            }
            balances
        }

        fn get_agent_performance(
            self: @ContractState,
            agent_id: felt252
        ) -> AgentPerformance {
            self.agent_performance.entry(agent_id).read()
        }

        fn update_subscription(
            ref self: ContractState,
            agent_id: felt252,
            user_config: UserConfig
        ) {
            let user = get_caller_address();
            let mut subscription = self.user_subscriptions.entry((user, agent_id)).read();
            
            assert(subscription.is_authorized, 'User not subscribed to agent');
            
            // Verify agent still exists and validate new config
            let agent_config = self.agent_configs.entry(agent_id).read();
            assert(agent_config.is_active, 'Agent not active');
            assert(user_config.max_trades_per_day <= agent_config.max_trades_per_day, 'Exceeds agent trade limit');
            assert(user_config.max_position_size <= agent_config.max_position_size, 'Exceeds agent position limit');
            assert(user_config.automation_level <= agent_config.max_automation_level, 'Exceeds agent automation level');
            assert(user_config.risk_tolerance <= agent_config.max_risk_tolerance, 'Exceeds agent risk tolerance');
            assert(user_config.stop_loss_threshold >= agent_config.min_stop_loss_threshold, 'Below agent min stop loss');
            
            subscription.user_config = user_config;
            self.user_subscriptions.entry((user, agent_id)).write(subscription);
        }

        // Calculate and allocate fees after successful trade
        fn settle_trade_with_fees(
            ref self: ContractState,
            user: ContractAddress,
            agent_id: felt252,
            profit_amount: u256,
            token_address: ContractAddress
        ) {
            // Calculate platform fee (e.g., 2.5% of profit)
            let platform_fee: u256 = (profit_amount * self.platform_fee_rate.read()) / 10000;
            let user_share: u256 = profit_amount - platform_fee;
            
            // Allocate to withdrawable balances (don't send immediately)
            let treasury = self.platform_treasury.read();
            let mut treasury_balance = self.withdrawable_balances.entry((treasury, token_address)).read();
            treasury_balance += platform_fee;
            self.withdrawable_balances.entry((treasury, token_address)).write(treasury_balance);
            
            // Update user balance
            let mut user_balance = self.user_balances.entry((user, token_address)).read();
            user_balance.total_balance += user_share;
            user_balance.available_balance += user_share;
            self.user_balances.entry((user, token_address)).write(user_balance);
            
            self.emit(FeesAllocated { 
                user, 
                platform_fee, 
                user_share, 
                token_address 
            });
        }

        // Platform withdraws accumulated fees
        fn withdraw_platform_fees(
            ref self: ContractState,
            token_address: ContractAddress,
            amount: u256
        ) {
            let caller: ContractAddress = get_caller_address();
            let treasury = self.platform_treasury.read();
            assert(caller == treasury, 'Only treasury can withdraw');
            
            let mut withdrawable = self.withdrawable_balances.entry((treasury, token_address)).read();
            assert(withdrawable >= amount, 'Amount exceed amount available');
            
            withdrawable -= amount;
            self.withdrawable_balances.entry((treasury, token_address)).write(withdrawable);
            
            // Execute transfer
            let token = IERC20Dispatcher { contract_address: token_address };
            token.transfer(treasury, amount);
            
            self.emit(PlatformFeesWithdrawn { token_address, amount });
        }
    }
}