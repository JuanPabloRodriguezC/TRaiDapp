export const ERC20_ABI = [
  {
    "name": "balanceOf",
    "type": "function",
    "inputs": [
      {
        "name": "account",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [
      {
        "type": "core::integer::u256"
      }
    ],
    "state_mutability": "view"
  },
  {
    "name": "allowance",
    "type": "function",
    "inputs": [
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "spender",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [
      {
        "type": "core::integer::u256"
      }
    ],
    "state_mutability": "view"
  },
  {
    "name": "approve",
    "type": "function",
    "inputs": [
      {
        "name": "spender",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount",
        "type": "core::integer::u256"
      }
    ],
    "outputs": [
      {
        "type": "core::bool"
      }
    ],
    "state_mutability": "external"
  },
  {
    "name": "transfer",
    "type": "function",
    "inputs": [
      {
        "name": "recipient",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount",
        "type": "core::integer::u256"
      }
    ],
    "outputs": [
      {
        "type": "core::bool"
      }
    ],
    "state_mutability": "external"
  },
  {
    "name": "transferFrom",
    "type": "function",
    "inputs": [
      {
        "name": "sender",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "recipient",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount",
        "type": "core::integer::u256"
      }
    ],
    "outputs": [
      {
        "type": "core::bool"
      }
    ],
    "state_mutability": "external"
  }
];


export const TRAIDAPP_CONTRACT_ABI = [
  {
    "type": "impl",
    "name": "AgentManagerImpl",
    "interface_name": "contracts::interfaces::ITraidingAgents::IAgentManager"
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "struct",
    "name": "contracts::utils::types::UserConfig",
    "members": [
      {
        "name": "automation_level",
        "type": "core::integer::u8"
      },
      {
        "name": "max_trades_per_day",
        "type": "core::integer::u32"
      },
      {
        "name": "max_api_cost_per_day",
        "type": "core::integer::u256"
      },
      {
        "name": "risk_tolerance",
        "type": "core::integer::u32"
      },
      {
        "name": "max_position_size",
        "type": "core::integer::u256"
      },
      {
        "name": "stop_loss_threshold",
        "type": "core::integer::u32"
      }
    ]
  },
  {
    "type": "enum",
    "name": "core::bool",
    "variants": [
      {
        "name": "False",
        "type": "()"
      },
      {
        "name": "True",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "contracts::utils::types::AgentConfig",
    "members": [
      {
        "name": "name",
        "type": "core::felt252"
      },
      {
        "name": "strategy",
        "type": "core::felt252"
      },
      {
        "name": "max_automation_level",
        "type": "core::integer::u8"
      },
      {
        "name": "max_trades_per_day",
        "type": "core::integer::u32"
      },
      {
        "name": "max_api_cost_per_day",
        "type": "core::integer::u256"
      },
      {
        "name": "max_risk_tolerance",
        "type": "core::integer::u32"
      },
      {
        "name": "max_position_size",
        "type": "core::integer::u256"
      },
      {
        "name": "min_stop_loss_threshold",
        "type": "core::integer::u32"
      },
      {
        "name": "is_active",
        "type": "core::bool"
      }
    ]
  },
  {
    "type": "struct",
    "name": "contracts::utils::types::AgentPerformance",
    "members": [
      {
        "name": "agent_id",
        "type": "core::felt252"
      },
      {
        "name": "total_decisions",
        "type": "core::integer::u32"
      },
      {
        "name": "successful_trades",
        "type": "core::integer::u32"
      },
      {
        "name": "total_pnl",
        "type": "core::integer::i128"
      },
      {
        "name": "avg_confidence",
        "type": "core::integer::u32"
      },
      {
        "name": "last_updated",
        "type": "core::integer::u64"
      }
    ]
  },
  {
    "type": "struct",
    "name": "contracts::utils::types::UserSubscription",
    "members": [
      {
        "name": "agent_id",
        "type": "core::felt252"
      },
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "user_config",
        "type": "contracts::utils::types::UserConfig"
      },
      {
        "name": "daily_api_cost",
        "type": "core::integer::u256"
      },
      {
        "name": "daily_trades",
        "type": "core::integer::u32"
      },
      {
        "name": "last_reset_day",
        "type": "core::integer::u64"
      },
      {
        "name": "subscribed_at",
        "type": "core::integer::u64"
      },
      {
        "name": "is_authorized",
        "type": "core::bool"
      }
    ]
  },
  {
    "type": "struct",
    "name": "contracts::utils::types::UserBalance",
    "members": [
      {
        "name": "total_balance",
        "type": "core::integer::u256"
      },
      {
        "name": "available_balance",
        "type": "core::integer::u256"
      },
      {
        "name": "last_updated",
        "type": "core::integer::u64"
      }
    ]
  },
  {
    "type": "interface",
    "name": "contracts::interfaces::ITraidingAgents::IAgentManager",
    "items": [
      {
        "type": "function",
        "name": "create_agent_config",
        "inputs": [
          {
            "name": "agent_id",
            "type": "core::felt252"
          },
          {
            "name": "name",
            "type": "core::felt252"
          },
          {
            "name": "strategy",
            "type": "core::felt252"
          },
          {
            "name": "max_automation_level",
            "type": "core::integer::u8"
          },
          {
            "name": "max_trades_per_day",
            "type": "core::integer::u32"
          },
          {
            "name": "max_api_cost_per_day",
            "type": "core::integer::u256"
          },
          {
            "name": "max_risk_tolerance",
            "type": "core::integer::u32"
          },
          {
            "name": "max_position_size",
            "type": "core::integer::u256"
          },
          {
            "name": "min_stop_loss_threshold",
            "type": "core::integer::u32"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "add_token_address",
        "inputs": [
          {
            "name": "token_address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "withdraw_platform_fees",
        "inputs": [
          {
            "name": "token_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "subscribe_to_agent",
        "inputs": [
          {
            "name": "agent_id",
            "type": "core::felt252"
          },
          {
            "name": "user_config",
            "type": "contracts::utils::types::UserConfig"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "unsubscribe_from_agent",
        "inputs": [
          {
            "name": "agent_id",
            "type": "core::felt252"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "update_subscription",
        "inputs": [
          {
            "name": "agent_id",
            "type": "core::felt252"
          },
          {
            "name": "user_config",
            "type": "contracts::utils::types::UserConfig"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "authorize_agent_trading",
        "inputs": [
          {
            "name": "agent_id",
            "type": "core::felt252"
          },
          {
            "name": "authorized",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "deposit_for_trading",
        "inputs": [
          {
            "name": "token_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "withdraw_from_trading",
        "inputs": [
          {
            "name": "token_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "reserve_for_agent_trade",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "agent_id",
            "type": "core::felt252"
          },
          {
            "name": "token_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "release_agent_reservation",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "agent_id",
            "type": "core::felt252"
          },
          {
            "name": "token_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "execute_trade_settlement",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "agent_id",
            "type": "core::felt252"
          },
          {
            "name": "from_token",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "to_token",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "from_amount",
            "type": "core::integer::u256"
          },
          {
            "name": "to_amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "settle_trade_with_fees",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "agent_id",
            "type": "core::felt252"
          },
          {
            "name": "profit_amount",
            "type": "core::integer::u256"
          },
          {
            "name": "token_address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "record_agent_decision",
        "inputs": [
          {
            "name": "agent_id",
            "type": "core::felt252"
          },
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "token_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "action",
            "type": "core::felt252"
          },
          {
            "name": "amount",
            "type": "core::integer::u256"
          },
          {
            "name": "confidence",
            "type": "core::integer::u32"
          },
          {
            "name": "reasoning_hash",
            "type": "core::felt252"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "mark_decision_executed",
        "inputs": [
          {
            "name": "decision_id",
            "type": "core::integer::u32"
          },
          {
            "name": "success",
            "type": "core::bool"
          },
          {
            "name": "actual_amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "authorize_decision_recorder",
        "inputs": [
          {
            "name": "recorder",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "authorized",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "update_agent_performance",
        "inputs": [
          {
            "name": "agent_id",
            "type": "core::felt252"
          },
          {
            "name": "pnl_change",
            "type": "core::integer::i128"
          },
          {
            "name": "was_successful",
            "type": "core::bool"
          },
          {
            "name": "confidence",
            "type": "core::integer::u32"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "can_agent_trade",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "agent_id",
            "type": "core::felt252"
          },
          {
            "name": "token_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_agent_config",
        "inputs": [
          {
            "name": "agent_id",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "contracts::utils::types::AgentConfig"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_available_balance_for_agent",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "agent_id",
            "type": "core::felt252"
          },
          {
            "name": "token_address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_daily_limits_remaining",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "agent_id",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "(core::integer::u32, core::integer::u256)"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_agent_performance",
        "inputs": [
          {
            "name": "agent_id",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "contracts::utils::types::AgentPerformance"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_user_subscription",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "agent_id",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "contracts::utils::types::UserSubscription"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_user_balance",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "token_address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "contracts::utils::types::UserBalance"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_user_balances",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::array::Array::<(core::starknet::contract_address::ContractAddress, contracts::utils::types::UserBalance)>"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "admin",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::utils::events::AgentSubscribed",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "agent_id",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "automation_level",
        "type": "core::integer::u8",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::utils::events::AgentDecision",
    "kind": "struct",
    "members": [
      {
        "name": "decision_id",
        "type": "core::integer::u32",
        "kind": "data"
      },
      {
        "name": "agent_id",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "action",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "confidence",
        "type": "core::integer::u32",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::utils::events::TradeExecuted",
    "kind": "struct",
    "members": [
      {
        "name": "decision_id",
        "type": "core::integer::u32",
        "kind": "data"
      },
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "success",
        "type": "core::bool",
        "kind": "data"
      },
      {
        "name": "actual_amount",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::utils::events::BalanceUpdated",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "new_total_balance",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "new_available_balance",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::utils::events::AuthorizationChanged",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "agent_id",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "authorized",
        "type": "core::bool",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::utils::events::ReservationMade",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "agent_id",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::utils::events::ReservationReleased",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "agent_id",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::utils::events::TradeSettled",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "agent_id",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "from_token",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "to_token",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "from_amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "to_amount",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::utils::events::FeesAllocated",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "platform_fee",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "user_share",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::utils::events::PlatformFeesWithdrawn",
    "kind": "struct",
    "members": [
      {
        "name": "token_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::utils::events::AgentUnsubscribed",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "agent_id",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "contracts::TraidingAgents::TraidingAgents::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "AgentSubscribed",
        "type": "contracts::utils::events::AgentSubscribed",
        "kind": "nested"
      },
      {
        "name": "AgentDecision",
        "type": "contracts::utils::events::AgentDecision",
        "kind": "nested"
      },
      {
        "name": "TradeExecuted",
        "type": "contracts::utils::events::TradeExecuted",
        "kind": "nested"
      },
      {
        "name": "BalanceUpdated",
        "type": "contracts::utils::events::BalanceUpdated",
        "kind": "nested"
      },
      {
        "name": "AuthorizationChanged",
        "type": "contracts::utils::events::AuthorizationChanged",
        "kind": "nested"
      },
      {
        "name": "ReservationMade",
        "type": "contracts::utils::events::ReservationMade",
        "kind": "nested"
      },
      {
        "name": "ReservationReleased",
        "type": "contracts::utils::events::ReservationReleased",
        "kind": "nested"
      },
      {
        "name": "TradeSettled",
        "type": "contracts::utils::events::TradeSettled",
        "kind": "nested"
      },
      {
        "name": "FeesAllocated",
        "type": "contracts::utils::events::FeesAllocated",
        "kind": "nested"
      },
      {
        "name": "PlatformFeesWithdrawn",
        "type": "contracts::utils::events::PlatformFeesWithdrawn",
        "kind": "nested"
      },
      {
        "name": "AgentUnsubscribed",
        "type": "contracts::utils::events::AgentUnsubscribed",
        "kind": "nested"
      }
    ]
  }
]

export const CONTRACT_ADDRESS = '0x026dc066d75b97ae9a511e6422d79eb7c640060acad438b3e8b0419a77304678'