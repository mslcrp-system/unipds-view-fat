'use client'

import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip, Legend,
  ReferenceArea, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { fmtMes } from '@/lib/fmt'

type CurvaRow = {
  mes: string
  tenant_nome: string
  status_mes: 'passado' | 'corrente' | 'futuro'
  esperado: number
  realizado: number
  inadimplente: number
  cancelado: number
  saldo_aberto: number
}

type ChartRow = {
  mes: string
  status_mes: 'passado' | 'corrente' | 'futuro'
  esperado: number
  realizado: number
  inadimplente: number
  cancelado: number
  saldo_aberto: number
}

function consolidar(data: CurvaRow[]): ChartRow[] {
  const mapa: Record<string, ChartRow> = {}
  for (const r of data) {
    if (!mapa[r.mes]) {
      mapa[r.mes] = {
        mes:          r.mes,
        status_mes:   r.status_mes,
        esperado:     r.esperado,
        realizado:    r.realizado,
        inadimplente: r.inadimplente,
        cancelado:    r.cancelado,
        saldo_aberto: r.saldo_aberto,
      }
    } else {
      mapa[r.mes].esperado     += r.esperado
      mapa[r.mes].realizado    += r.realizado
      mapa[r.mes].inadimplente += r.inadimplente
      mapa[r.mes].cancelado    += r.cancelado
      mapa[r.mes].saldo_aberto += r.saldo_aberto
    }
  }
  return Object.values(mapa).sort((a, b) => a.mes.localeCompare(b.mes))
}

const fmtBRL = (v: number) => {
  if (Math.abs(v) >= 1_000_000)
    return `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`
  if (Math.abs(v) >= 1_000)
    return `R$ ${(v / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}K`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

const STATUS_LABEL: Record<string, string> = {
  passado:  'passado',
  corrente: 'corrente',
  futuro:   'futuro',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const row: ChartRow = payload[0]?.payload
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 10,
      padding: '12px 16px',
      fontSize: 13,
      minWidth: 200,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: '#111827' }}>
        {fmtMes(label)}
        <span style={{ marginLeft: 8, fontWeight: 400, color: '#9CA3AF', fontSize: 11 }}>
          ({STATUS_LABEL[row?.status_mes ?? ''] ?? row?.status_mes})
        </span>
      </div>
      {[
        { key: 'realizado',    label: 'Realizado',    color: '#10B981' },
        { key: 'esperado',     label: 'Esperado',     color: '#9CA3AF' },
        { key: 'inadimplente', label: 'Inadimplente', color: '#F59E0B' },
        { key: 'cancelado',    label: 'Cancelado',    color: '#EF4444' },
        { key: 'saldo_aberto', label: 'Saldo aberto', color: '#6B7280' },
      ].map(({ key, label: lbl, color }) => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 3 }}>
          <span style={{ color, fontWeight: 500 }}>{lbl}</span>
          <span style={{ color: '#374151', fontWeight: 600 }}>
            {fmtBRL((row as unknown as Record<string, number>)[key] ?? 0)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function CurvaRecebiveisChart({ data }: { data: CurvaRow[] }) {
  const rowsBase = consolidar(data)
  // Realizado só desenha em meses passados — evita 'desabar' no corrente/futuro
  const rows = rowsBase.map(r => ({
    ...r,
    realizado: r.status_mes === 'passado' ? r.realizado : null as unknown as number,
  }))
  const mesCorrente = rowsBase.find(r => r.status_mes === 'corrente')?.mes
  const idxCorrente = rowsBase.findIndex(r => r.status_mes === 'corrente')
  const mesAposCorrente = idxCorrente >= 0 && idxCorrente < rowsBase.length - 1
    ? rowsBase[idxCorrente + 1].mes
    : mesCorrente

  return (
    <div className="card">
      <div className="card-label">Curva de Recebíveis</div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />

          <XAxis
            dataKey="mes"
            tickFormatter={fmtMes}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtBRL}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            width={72}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingBottom: 12 }}
            formatter={(value: string) => (
              <span style={{ color: '#6B7280' }}>{value}</span>
            )}
          />

          {mesCorrente && mesAposCorrente && (
            <ReferenceArea
              x1={mesCorrente}
              x2={mesAposCorrente}
              fill="#FEF3C7"
              fillOpacity={0.4}
              strokeOpacity={0}
              label={{ value: 'mês atual', position: 'insideTop', fill: '#92400E', fontSize: 11 }}
            />
          )}

          <Area
            type="monotone"
            dataKey="inadimplente"
            name="Inadimplente"
            stackId="negativo"
            fill="#F59E0B"
            stroke="#F59E0B"
            fillOpacity={0.25}
            strokeWidth={0}
          />
          <Area
            type="monotone"
            dataKey="cancelado"
            name="Cancelado"
            stackId="negativo"
            fill="#EF4444"
            stroke="#EF4444"
            fillOpacity={0.20}
            strokeWidth={0}
          />

          <Line
            type="monotone"
            dataKey="esperado"
            name="Esperado"
            stroke="#9CA3AF"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="realizado"
            name="Realizado"
            stroke="#10B981"
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
            activeDot={{ r: 5, fill: '#10B981' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
