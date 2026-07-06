import raw from "@data/counterparty_flow_summary.json";
import type { CounterpartyFlowSummary } from "./types";

export function getCounterpartyFlowSummary(): CounterpartyFlowSummary {
  return raw as CounterpartyFlowSummary;
}
