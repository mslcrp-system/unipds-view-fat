'use client'

import { fmtBRL } from '@/lib/fmt'

interface KPI {
  mes_ref: string | null
  recebido_mes_ref: number
  mrr: number
  recebido_unica: number
  crescimento_pct: number | null
  runway_proximos_6m: number
  inadimplencia_mes_ref: number
}

const MESES_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
const fmtMesRef = (mes: string | null): string => {
  if (!mes) return '—'
  const [y, m] = mes.split('-')
  return `${MESES_PT[Number(m) - 1]}/${y}`
}

const cards = [
  {
    key: 'recebido_mes_ref' as const,
    label: 'Recebido (mês ref)',
    fmt: (v: number) => fmtBRL(v, true),
    subFn: (kpi: KPI) => fmtMesRef(kpi.mes_ref),
    extraKey: 'crescimento_pct' as const,
  },
  {
    key: 'mrr' as const,
    label: 'Assinaturas',
    fmt: (v: number) => fmtBRL(v, true),
    subFn: () => 'recorrência do mês',
  },
  {
    key: 'recebido_unica' as const,
    label: 'Vendas Únicas',
    fmt: (v: number) => fmtBRL(v, true),
    subFn: () => 'venda única do mês',
  },
  {
    key: 'runway_proximos_6m' as const,
    label: 'Runway 6m',
    fmt: (v: number) => fmtBRL(v, true),
    subFn: () => 'esperado próximos 6 meses',
  },
  {
    key: 'inadimplencia_mes_ref' as const,
    label: 'Inadimplência (mês ref)',
    fmt: (v: number) => fmtBRL(v, true),
    subFn: (kpi: KPI) => `parcelas vencidas em ${fmtMesRef(kpi.mes_ref)}`,
  },
]

export function KPICards({ kpi }: { kpi: KPI }) {
  return (
    <div className='grid-kpi'>
      {cards.map(c => {
        const val   = kpi[c.key]
        const cresc = c.extraKey ? kpi[c.extraKey] : null
        return (
          <div key={c.key} className='card' style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-2)', marginBottom: 12 }}>
              {c.label}
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {c.fmt(val as number)}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
              {cresc !== null && cresc !== undefined
                ? <span style={{ color: cresc >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>{cresc >= 0 ? '↑' : '↓'} {Math.abs(cresc).toFixed(1)}% vs mês anterior</span>
                : c.subFn(kpi)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
