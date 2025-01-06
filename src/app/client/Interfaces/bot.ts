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