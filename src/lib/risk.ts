import raw from "@data/wallet_risk.json";
import type { WalletRisk } from "./types";

export function getWalletRisk(): WalletRisk {
  return raw as WalletRisk;
}
