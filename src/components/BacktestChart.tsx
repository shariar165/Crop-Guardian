'use client'

import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export type BacktestPoint = { season: string; openMeteo: number; nasa: number }

// Alerts the app would have sent each winter (its rule, both weather sources) against the weekly
// calendar spraying many farmers follow.
export default function BacktestChart({ data, calendarSprays }: { data: BacktestPoint[]; calendarSprays: number }) {
  return (
    <figure className="m-0 flex flex-col gap-1.5">
      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6d8bc" vertical={false} />
            <XAxis dataKey="season" tick={{ fontSize: 12, fill: '#5a4a3c' }} tickLine={false} axisLine={{ stroke: '#c4a979' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#5a4a3c' }} tickLine={false} axisLine={false} domain={[0, Math.max(calendarSprays + 1, 14)]} />
            <Tooltip cursor={{ fill: '#efe6d4' }} contentStyle={{ borderRadius: 12, border: '1px solid #e6d8bc', fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={calendarSprays} stroke="#c2412d" strokeDasharray="5 4" label={{ value: `Weekly calendar: ${calendarSprays}`, position: 'insideTopRight', fontSize: 11, fill: '#a8361f' }} />
            <Bar dataKey="openMeteo" name="Alerts (Open-Meteo)" fill="#1f5f6b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="nasa" name="Alerts (NASA POWER)" fill="#e8b931" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="text-[12px] leading-[1.4] text-muted">
        Shibganj, Bogura, Dec–Feb. Weather-only counts from docs/risk-backtest.md; not yet checked against real outbreak records.
      </figcaption>
    </figure>
  )
}
