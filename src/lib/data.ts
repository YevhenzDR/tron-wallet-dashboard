import raw from "@data/wallet_data.json";
import type { WalletData } from "./types";

export function getWalletData(): WalletData {
  return raw as WalletData;
}
