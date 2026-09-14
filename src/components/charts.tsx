"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceArea,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const AXIS = {
  stroke: "#6b7489",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#12151c",
    border: "1px solid #333a49",
    borderRadius: 6,
    fontSize: 12,
  },
  labelStyle: { color: "#c2c8d4", marginBottom: 2 },
};

export type SeriesPoint = {
  date: string;
  value: number | null;
  secondary?: number | null;
};

export function MetricChart({
  data,
  unit,
  color = "#f59e0b",
  secondaryLabel,
}: {
  data: SeriesPoint[];
  unit?: string | null;
  color?: string;
  secondaryLabel?: string;
}) {
  const hasSecondary = data.some(
    (d) => d.secondary !== null && d.secondary !== undefined,
  );

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
        <CartesianGrid stroke="#232834" vertical={false} />
        <XAxis dataKey="date" {...AXIS} />
        <YAxis
          {...AXIS}
          width={44}
          domain={["auto", "auto"]}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value, name) => [
            `${value}${unit ? ` ${unit}` : ""}`,
            name === "value" ? "Right" : (secondaryLabel ?? "Left"),
          ]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color }}
          connectNulls
        />
        {hasSecondary && (
          <Line
            type="monotone"
            dataKey="secondary"
            stroke="#6b7489"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={{ r: 3, fill: "#6b7489" }}
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Systolic and diastolic over time, banded by the ACC/AHA stages so a reading
 * is read against clinical thresholds rather than only against itself.
 */
export function BloodPressureChart({
  data,
}: {
  data: { date: string; systolic: number | null; diastolic: number | null }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
        <CartesianGrid stroke="#232834" vertical={false} />
        <ReferenceArea y1={140} y2={200} fill="#ef4444" fillOpacity={0.07} />
        <ReferenceArea y1={130} y2={140} fill="#f97316" fillOpacity={0.07} />
        <ReferenceArea y1={120} y2={130} fill="#eab308" fillOpacity={0.07} />
        <XAxis dataKey="date" {...AXIS} />
        <YAxis {...AXIS} width={44} domain={[60, 190]} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value, name) => [
            value,
            name === "systolic" ? "Systolic" : "Diastolic",
          ]}
        />
        <Line
          type="monotone"
          dataKey="systolic"
          stroke="#f87171"
          strokeWidth={2}
          dot={{ r: 2.5, fill: "#f87171" }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="diastolic"
          stroke="#60a5fa"
          strokeWidth={2}
          dot={{ r: 2.5, fill: "#60a5fa" }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

const CATEGORY_FILL: Record<string, string> = {
  PREP: "#38bdf8",
  STRENGTH: "#f59e0b",
  POWER: "#fb7185",
  CORE: "#a78bfa",
  CONDITIONING: "#34d399",
  RECOVERY: "#94a3b8",
  OTHER: "#52525b",
};

export function BlockExposureChart({
  data,
}: {
  data: { name: string; category: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 22)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
      >
        <XAxis type="number" {...AXIS} />
        <YAxis
          type="category"
          dataKey="name"
          {...AXIS}
          width={132}
          interval={0}
        />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, "Slots"]} />
        <Bar dataKey="count" radius={[0, 3, 3, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={CATEGORY_FILL[entry.category] ?? CATEGORY_FILL.OTHER}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LoadTrendChart({
  data,
}: {
  data: { date: string; topLoad: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="#232834" vertical={false} />
        <XAxis dataKey="date" {...AXIS} />
        <YAxis {...AXIS} width={40} domain={["auto", "auto"]} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v) => [v, "Top set"]}
        />
        <Line
          type="monotone"
          dataKey="topLoad"
          stroke="#34d399"
          strokeWidth={2}
          dot={{ r: 2.5, fill: "#34d399" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
