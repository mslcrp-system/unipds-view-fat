'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { fmtMes, fmtBRL } from '@/lib/fmt'

type Row = { mes: string; assinatura: number }

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#18122B', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#fff' }}>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6 }}>{fmtMes(label)}</div>
      <div style={{ fontWeight: 800, fontSize: 15, color: '#A78BFA' }}>{fmtBRL(payload[0].value)}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>MRR</div>
    </div>
  )
}

export function MRRChart({ data }: { data: Row[] }) {
  const mrrData = data.map(d => ({ mes: d.mes, mrr: d.assinatura }))
  const last3   = mrrData.slice(-3).map(d => d.mrr)
  const avg3    = last3.length ? last3.reduce((a, b) => a + b, 0) / last3.length : null

  return (
    <div className="card">
      <div className="card-label">MRR — Receita Recorrente Mensal</div>
      <ResponsiveContainer width="100%" height={270}>
        <AreaChart data={mrrData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#F3F4F6" />
          <XAxis dataKey="mes" tickFormatter={fmtMes} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => fmtBRL(v, true)} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={70} />
          <Tooltip content={<Tip />} cursor={{ stroke: '#7C3AED', strokeWidth: 1, strokeDasharray: '4 2' }} />
          {avg3 !== null && (
            <ReferenceLine y={avg3} stroke="rgba(124,58,237,0.3)" strokeDasharray="6 3"
              label={{ value: `Média 3m: ${fmtBRL(avg3, true)}`, position: 'insideTopRight', fontSize: 10, fill: 'rgba(124,58,237,0.55)' }} />
          )}
          <Area type="monotone" dataKey="mrr" stroke="#7C3AED" strokeWidth={2.5} fill="url(#mrrGrad)" dot={false} activeDot={{ r: 5, fill: '#7C3AED', strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
