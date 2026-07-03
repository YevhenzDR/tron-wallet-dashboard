"use client";

import { ResponsiveContainer, Sankey, type SankeyLinkProps, type SankeyNodeProps } from "recharts";
import type { Counterparty } from "@/lib/types";
import { buildSankeyData, type SankeyNodeDatum } from "@/lib/sankey";
import { formatUsdt } from "@/lib/format";

const NODE_COLORS: Record<SankeyNodeDatum["nodeType"], string> = {
  source: "#3dd6c1",
  "other-source": "#4a5568",
  wallet: "#e8b84a",
  destination: "#e8785a",
  "other-destination": "#4a5568",
};

function CustomNode(props: SankeyNodeProps) {
  const { x, y, width, height, payload, index } = props;
  const node = payload as unknown as SankeyNodeDatum;
  const color = NODE_COLORS[node.nodeType];
  const isRight = node.nodeType === "destination" || node.nodeType === "other-destination";
  const isWallet = node.nodeType === "wallet";

  const labelX = isWallet ? x + width / 2 : isRight ? x + width + 8 : x - 8;
  const textAnchor: "start" | "middle" | "end" = isWallet ? "middle" : isRight ? "start" : "end";
  const labelY = isWallet ? y - 10 : y + height / 2 - 5;
  const amountY = isWallet ? y + height + 16 : y + height / 2 + 9;

  return (
    <g key={`node-${index}`}>
      <rect x={x} y={y} width={width} height={Math.max(height, 2)} fill={color} fillOpacity={0.9} rx={1.5}>
        <title>
          {node.name} — {formatUsdt(node.total)} USDT ({node.count.toLocaleString()} tx)
        </title>
      </rect>
      {!isWallet && (
        <>
          <text
            x={labelX}
            y={labelY}
            textAnchor={textAnchor}
            fontSize={10.5}
            fontFamily="var(--font-geist-mono), ui-monospace, monospace"
            fill="var(--foreground)"
          >
            {node.name}
          </text>
          <text
            x={labelX}
            y={amountY}
            textAnchor={textAnchor}
            fontSize={10}
            fontFamily="var(--font-geist-mono), ui-monospace, monospace"
            fill="var(--muted)"
          >
            {formatUsdt(node.total, 0)} USDT
          </text>
        </>
      )}
      {isWallet && (
        <text x={labelX} y={labelY} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--warn)">
          {node.name}
        </text>
      )}
    </g>
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
  walletLabel,
}: {
  sources: Counterparty[];
  destinations: Counterparty[];
  walletLabel: string;
}) {
  const data = buildSankeyData(sources, destinations, walletLabel, 15);

  return (
    <div className="w-full" style={{ height: 720 }}>
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          node={CustomNode as never}
          link={CustomLink as never}
          nodePadding={18}
          nodeWidth={10}
          linkCurvature={0.55}
          margin={{ top: 24, right: 170, bottom: 24, left: 170 }}
          iterations={64}
        />
      </ResponsiveContainer>
    </div>
  );
}
