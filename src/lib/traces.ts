import raw from "@data/destination_traces.json";
import type { DestinationTraces } from "./types";

export function getDestinationTraces(): DestinationTraces {
  return raw as DestinationTraces;
}
