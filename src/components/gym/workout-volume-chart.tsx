"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WorkoutProgressPoint } from "@/lib/analytics/gym-progress";

export function WorkoutVolumeChart({ data, title, xAxisKey = "label" }: { data: WorkoutProgressPoint[]; title: string; xAxisKey?: "label" | "axisLabel" }) {
  const hasVolume = data.some((point) => point.volumeKg > 0);
  return <section className="panel rounded-xl p-5"><h2 className="font-semibold text-white">{title}</h2><p className="mt-1 text-sm text-zinc-400">Completed resistance volume: sets × reps × kg. Zeroes mean no recorded resistance volume.</p>{data.length ? <><div className="mt-4 h-60"><ResponsiveContainer height="100%" width="100%"><LineChart data={data}><CartesianGrid stroke="#3f3f46" strokeDasharray="3 3" /><XAxis dataKey={xAxisKey} interval={xAxisKey === "axisLabel" ? 0 : data.length > 35 ? 3 : "preserveStartEnd"} tick={{ fill: "#cbd5e1", fontSize: 12 }} /><YAxis tick={{ fill: "#cbd5e1", fontSize: 12 }} /><Tooltip contentStyle={{ background: "#111", border: "1px solid #52525b" }} labelFormatter={(_, payload) => { const point = payload[0]?.payload as WorkoutProgressPoint | undefined; return point?.month ? `${point.month} · ${point.label}` : point?.label ?? ""; }} /><Line connectNulls dataKey="volumeKg" dot={false} name="Volume (kg)" stroke="#22c55e" strokeWidth={2} /></LineChart></ResponsiveContainer></div>{!hasVolume ? <p className="mt-3 text-sm text-zinc-500">No resistance volume is recorded in this period yet.</p> : null}</> : <p className="flex h-60 items-center justify-center text-sm text-zinc-500">No scheduled dates in this period.</p>}</section>;
}
