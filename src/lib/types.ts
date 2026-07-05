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

export interface TraceTarget {
  address: string;
  total: number;
  count: number;
  tag: string;
  is_exchange: boolean;
}

export interface DestinationTrace {
  address: string;
  received_from_wallet: number;
  total_out_all_time: number;
  out_tx_count: number;
  unique_targets: number;
  exchange_out_total: number;
  top_targets: TraceTarget[];
}

export interface DestinationTraceSummary {
  addresses_traced: number;
  addresses_with_known_exchange_hits: number;
  total_exchange_hit_volume: number;
}

export interface DestinationTraces {
  generated_at: string;
  note: string;
  traced: DestinationTrace[];
  summary: DestinationTraceSummary;
}

export interface Transaction {
  hash: string;
  time: string;
  direction: "in" | "out";
  counterparty: string;
  amount: number;
  tag: string;
  is_exchange: boolean;
}

export interface TransactionLedger {
  transactions: Transaction[];
  count: number;
}

export interface RiskDetailEntry {
  entity: string;
  risk_type: "sanctioned_entity" | "illicit_activity" | string;
  volume: number;
  hop_num: number;
  exposure_type: "direct" | "indirect" | string;
  hop_dic: Record<string, string[]>;
  percent: number;
}

export interface WalletRisk {
  score: number;
  hacking_event: string;
  detail_list: string[];
  risk_level: string;
  risk_detail: RiskDetailEntry[];
  address_label: string;
  risk_report_url: string;
  generated_at: string;
}
