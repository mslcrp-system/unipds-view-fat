'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { fmtMes, fmtBRL } from '@/lib/fmt'

type Row = { mes: string; assinatura: number; unico: number; total: number }

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const ass  = payload.find((p: any) => p.dataKey === 'assinatura')?.value ?? 0
  const uni  = payload.find((p: any) => p.dataKey === 'unico')?.value ?? 0
  return (
    <div style={{ background: '#18122B', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#fff', minWidth: 190 }}>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 8 }}>{fmtMes(label)}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 4 }}>
        <span style={{ color: '#67E8F9' }}>Assinatura</span>
        <span style={{ fontWeight: 700 }}>{fmtBRL(ass)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 8 }}>
        <span style={{ color: '#A78BFA' }}>Único</span>
        <span style={{ fontWeight: 700 }}>{fmtBRL(uni)}</span>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Total</span>
        <span style={{ fontWeight: 800 }}>{fmtBRL(ass + uni)}</span>
      </div>
    </div>
  )
}

export function FaturamentoChart({ data }: { data: Row[] }) {
  const max = Math.max(...data.map(d => d.total))
  return (
    <div className="card">
      <div className="card-label">Faturamento Mensal — Assinatura + Único</div>
      <ResponsiveContainer width="100%" height={270}>
        <BarChart data={data} barCategoryGap="30%" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#F3F4F6" />
          <XAxis dataKey="mes" tickFormatter={fmtMes} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => fmtBRL(v, true)} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={70} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(124,58,237,0.04)' }} />
          <Bar dataKey="unico" stackId="a" fill="#7C3AED">
            {data.map((d, i) => <Cell key={i} fill="#7C3AED" opacity={d.total === max ? 1 : 0.65} />)}
          </Bar>
          <Bar dataKey="assinatura" stackId="a" radius={[5, 5, 0, 0]} fill="#06B6D4">
            {data.map((d, i) => <Cell key={i} fill="#06B6D4" opacity={d.total === max ? 1 : 0.65} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 6 }}>
        {[['#7C3AED', 'Venda única'], ['#06B6D4', 'Assinatura']].map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />{l}
          </span>
        ))}
      </div>
    </div>
  )
}
