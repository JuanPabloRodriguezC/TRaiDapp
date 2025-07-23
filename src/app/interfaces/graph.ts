

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
  token_id: string,
  amount: number,
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

