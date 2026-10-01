import type { Counterparty } from "./types";

export type SankeyNodeType = "source" | "other-source" | "wallet" | "destination" | "other-destination";

export interface SankeyNodeDatum {
  name: string;
  address: string | null;
  total: number;
  count: number;
  nodeType: SankeyNodeType;
  tag: string;
  isExchange: boolean;
}

export interface SankeyLinkDatum {
  source: number;
  target: number;
  value: number;
}

export interface SankeyChartData {
  nodes: SankeyNodeDatum[];
  links: SankeyLinkDatum[];
}

export function buildSankeyData(
  sources: Counterparty[],
  destinations: Counterparty[],
  walletAddress: string,
  walletTag: string,
  topN = 15
): SankeyChartData {
  const sortedSources = [...sources].sort((a, b) => b.total - a.total);
  const sortedDestinations = [...destinations].sort((a, b) => b.total - a.total);

  const topSources = sortedSources.slice(0, topN);
  const otherSources = sortedSources.slice(topN);
  const topDestinations = sortedDestinations.slice(0, topN);
  const otherDestinations = sortedDestinations.slice(topN);

  const nodes: SankeyNodeDatum[] = [];

  topSources.forEach((s) => {
    nodes.push({
      name: s.address,
      address: s.address,
      total: s.total,
      count: s.count,
      nodeType: "source",
      tag: s.tag,
      isExchange: s.is_exchange,
    });
  });

  if (otherSources.length > 0) {
    nodes.push({
      name: `Other sources (${otherSources.length})`,
      address: null,
      total: otherSources.reduce((sum, s) => sum + s.total, 0),
      count: otherSources.reduce((sum, s) => sum + s.count, 0),
      nodeType: "other-source",
      tag: "",
      isExchange: false,
    });
  }

  const walletIndex = nodes.length;
  nodes.push({
    name: walletAddress,
    address: walletAddress,
    total: 0,
    count: 0,
    nodeType: "wallet",
    tag: walletTag,
    isExchange: false,
  });

  const destStart = nodes.length;
  topDestinations.forEach((d) => {
    nodes.push({
      name: d.address,
      address: d.address,
      total: d.total,
      count: d.count,
      nodeType: "destination",
      tag: d.tag,
      isExchange: d.is_exchange,
    });
  });

  if (otherDestinations.length > 0) {
    nodes.push({
      name: `Other recipients (${otherDestinations.length})`,
      address: null,
      total: otherDestinations.reduce((sum, d) => sum + d.total, 0),
      count: otherDestinations.reduce((sum, d) => sum + d.count, 0),
      nodeType: "other-destination",
      tag: "",
      isExchange: false,
    });
  }

  const links: SankeyLinkDatum[] = [];
  for (let i = 0; i < walletIndex; i++) {
    links.push({ source: i, target: walletIndex, value: nodes[i].total });
  }
  for (let i = destStart; i < nodes.length; i++) {
    links.push({ source: walletIndex, target: i, value: nodes[i].total });
  }

  return { nodes, links };
}
