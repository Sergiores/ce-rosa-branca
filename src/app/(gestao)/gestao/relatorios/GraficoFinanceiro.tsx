"use client";

import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatarMoeda } from "@/lib/utils";

export function GraficoFinanceiro({
  dados,
}: {
  dados: { mes: string; pagar: number; receber: number }[];
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e2edf9" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#5b7290" }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: "#5b7290" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (Number(v) >= 1000 ? `${Number(v) / 1000}k` : String(v))}
          />
          <Tooltip
            formatter={(v) => formatarMoeda(Number(v ?? 0))}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2edf9", fontSize: 13 }}
            labelStyle={{ color: "#12263f", fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Bar dataKey="receber" name="A receber" fill="#2186ec" radius={[6, 6, 0, 0]} />
          <Bar dataKey="pagar" name="A pagar" fill="#f9a8b4" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
