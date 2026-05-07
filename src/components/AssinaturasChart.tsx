'use client'

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fmtMes, fmtNum } from '@/lib/fmt'

type Row = { mes: string; novas: number; acumulado: number }

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const novas = payload.find((p: any) => p.dataKey === 'novas')?.value ?? 0
  const acum  = payload.find((p: any) => p.dataKey === 'acumulado')?.value ?? 0
  return (
    <div style={{ background: '#18122B', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#fff', minWidth: 180 }}>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 8 }}>{fmtMes(label)}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 4 }}>
        <span style={{ color: '#67E8F9' }}>Novas no mês</span>
        <span style={{ fontWeight: 700 }}>{fmtNum(novas)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
        <span style={{ color: '#FCD34D' }}>Acumulado ativo</span>
        <span style={{ fontWeight: 700 }}>{fmtNum(acum)}</span>
      </div>
    </div>
  )
}

export function AssinaturasChart({ data }: { data: Row[] }) {
  const maxAcum = Math.max(...data.map(d => d.acumulado), 1)
  return (
    <div className="card">
      <div className="card-label">Crescimento de Assinaturas Ativas</div>
      <ResponsiveContainer width="100%" height={270}>
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#F3F4F6" />
          <XAxis dataKey="mes" tickFormatter={fmtMes} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={36} />
          <YAxis yAxisId="r" orientation="right" domain={[0, Math.ceil(maxAcum * 1.12)]} tickFormatter={fmtNum} tick={{ fontSize: 11, fill: '#F59E0B' }} axisLine={false} tickLine={false} width={50} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(6,182,212,0.05)' }} />
          <Bar yAxisId="l" dataKey="novas" fill="#06B6D4" opacity={0.75} radius={[4,4,0,0]} barSize={16} />
          <Line yAxisId="r" type="monotone" dataKey="acumulado" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3, fill: '#F59E0B', strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 6 }}>
        {[['#06B6D4', 'Novas/mês'], ['#F59E0B', 'Acumulado ativo']].map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ width: 10, height: 10, borderRadius: l === 'Acumulado ativo' ? 50 : 2, background: c, display: 'inline-block' }} />{l}
          </span>
        ))}
      </div>
    </div>
  )
}
