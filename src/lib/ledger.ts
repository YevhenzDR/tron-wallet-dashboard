import raw from "@data/transactions.json";
import type { TransactionLedger } from "./types";

export function getTransactionLedger(): TransactionLedger {
  return raw as TransactionLedger;
}
