"use client";

import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export function GraficoAcessos({
  dados,
}: {
  dados: { dia: string; acessos: number; visitantes: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dados} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-acessos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#976c5f" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#976c5f" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e9ded3" vertical={false} />
          <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#7b6a62" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#7b6a62" }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e9ded3",
              fontSize: 13,
            }}
            labelStyle={{ color: "#3a2b25", fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="acessos"
            name="Acessos"
            stroke="#976c5f"
            strokeWidth={2}
            fill="url(#grad-acessos)"
          />
          <Area
            type="monotone"
            dataKey="visitantes"
            name="Visitantes"
            stroke="#d5b8a9"
            strokeWidth={2}
            fill="transparent"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
