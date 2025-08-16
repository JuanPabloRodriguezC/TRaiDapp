

export interface Subscription {
  id: number;
  name: string;
}

export interface TimeData {
  timestamp: string,
  predicted_price: number,
  close: number
}

export interface AssetAllocationData {
  tokenAddress: string,
  symbol: string,
  balance: number,
  name: string,
  usdValue: number,
}


export interface TransactionData {
  token_id: string,
  amount: number,
  timestamp: string,
}

export interface MetricData {
  timestamp: string;
  metric_name: string;
  metric_value: number;
}

