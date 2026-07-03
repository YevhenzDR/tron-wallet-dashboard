"use client";

import { ResponsiveContainer, Sankey, type SankeyLinkProps, type SankeyNodeProps } from "recharts";
import type { Counterparty } from "@/lib/types";
import { buildSankeyData, type SankeyNodeDatum } from "@/lib/sankey";
import { formatUsdt, tronscanUrl } from "@/lib/format";

const NODE_COLORS: Record<SankeyNodeDatum["nodeType"], string> = {
  source: "#3dd6c1",
  "other-source": "#4a5568",
  wallet: "#e8b84a",
  destination: "#e8785a",
  "other-destination": "#4a5568",
};

function nodeColor(node: SankeyNodeDatum): string {
  if (node.isExchange) return "#8b7cf6";
  return NODE_COLORS[node.nodeType];
}

function CustomNode(props: SankeyNodeProps) {
  const { x, y, width, height, payload, index } = props;
  const node = payload as unknown as SankeyNodeDatum;
  const color = nodeColor(node);
  const isRight = node.nodeType === "destination" || node.nodeType === "other-destination";
  const isWallet = node.nodeType === "wallet";

  const labelX = isWallet ? x + width / 2 : isRight ? x + width + 8 : x - 8;
  const textAnchor: "start" | "middle" | "end" = isWallet ? "middle" : isRight ? "start" : "end";
  const labelY = isWallet ? y - 12 : y + height / 2 - 5;
  const subY = isWallet ? y + height + 16 : y + height / 2 + 9;

  const subParts: string[] = [];
  if (node.tag) subParts.push(node.isExchange ? `БІРЖА · ${node.tag}` : node.tag);
  if (!isWallet) subParts.push(`${formatUsdt(node.total, 0)} USDT`);
  const subText = subParts.join(" · ");

  const content = (
    <g key={`node-${index}`} style={{ cursor: node.address ? "pointer" : "default" }}>
      <rect x={x} y={y} width={width} height={Math.max(height, 2)} fill={color} fillOpacity={0.9} rx={1.5}>
        <title>
          {node.name}
          {node.tag ? ` (${node.tag})` : ""} — {formatUsdt(node.total)} USDT (транзакцій:{" "}
          {node.count.toLocaleString("uk-UA")})
        </title>
      </rect>
      <text
        x={labelX}
        y={labelY}
        textAnchor={textAnchor}
        fontSize={isWallet ? 10.5 : 9.5}
        fontWeight={isWallet ? 600 : 400}
        fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        fill={isWallet ? "var(--warn)" : "var(--foreground)"}
      >
        {node.name}
      </text>
      {subText && (
        <text
          x={labelX}
          y={subY}
          textAnchor={textAnchor}
          fontSize={9}
          fontFamily="var(--font-geist-mono), ui-monospace, monospace"
          fill={node.isExchange ? "var(--exchange)" : "var(--muted)"}
        >
          {subText}
        </text>
      )}
    </g>
  );

  if (!node.address) return content;
  return (
    <a href={tronscanUrl(node.address)} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  );
}

function CustomLink(props: SankeyLinkProps) {
  const {
    sourceX,
    targetX,
    sourceY,
    targetY,
    sourceControlX,
    targetControlX,
    linkWidth,
    index,
    payload,
  } = props;
  const sourceType = (payload.source as unknown as SankeyNodeDatum).nodeType;
  const isOutflow = sourceType === "wallet";
  const color = isOutflow ? "var(--outflow)" : "var(--inflow)";

  return (
    <path
      key={`link-${index}`}
      d={`M${sourceX},${sourceY}C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={color}
      strokeOpacity={0.22}
      strokeWidth={Math.max(linkWidth, 1)}
      className="transition-[stroke-opacity] duration-150 hover:[stroke-opacity:0.55]"
    />
  );
}

export default function SankeyFlow({
  sources,
  destinations,
  walletAddress,
  walletTag,
}: {
  sources: Counterparty[];
  destinations: Counterparty[];
  walletAddress: string;
  walletTag: string;
}) {
  const data = buildSankeyData(sources, destinations, walletAddress, walletTag, 15);

  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <div style={{ height: 760, minWidth: 1100 }}>
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={data}
            node={CustomNode as never}
            link={CustomLink as never}
            nodePadding={20}
            nodeWidth={10}
            linkCurvature={0.55}
            margin={{ top: 28, right: 230, bottom: 28, left: 230 }}
            iterations={64}
          />
        </ResponsiveContainer>
      </div>
    </div>
  );
}
