export interface Kpis {
  wallet_label: string;
  wallet_address: string;
  wallet_tag: string;
  total_in: number;
  total_out: number;
  residual: number;
  active_days: number;
  unique_sources: number;
  unique_destinations: number;
  incoming_tx_count: number;
  outgoing_tx_count: number;
  first_tx_time: string;
  last_tx_time: string;
  circular_counterparty_count: number;
  exchange_source_count: number;
  exchange_destination_count: number;
}

export interface Counterparty {
  address: string;
  total: number;
  count: number;
  tag: string;
  is_exchange: boolean;
}

export interface CircularCounterparty {
  address: string;
  in_total: number;
  in_count: number;
  out_total: number;
  out_count: number;
  net: number;
  tag: string;
  is_exchange: boolean;
}

export interface DailyVolume {
  date: string;
  in: number;
  out: number;
  in_count: number;
  out_count: number;
}

export interface WalletData {
  kpis: Kpis;
  sources: Counterparty[];
  destinations: Counterparty[];
  circular_counterparties: CircularCounterparty[];
  daily_volumes: DailyVolume[];
}
