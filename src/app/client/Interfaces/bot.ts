export interface TradingBot {
  id: number;
  name: string;
  date_uploaded: string;
  description: string;
  sub_id: number;
  error: number;
}

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