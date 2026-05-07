'use client'

import { fmtBRL, fmtNum } from '@/lib/fmt'

interface KPI {
  mes_ref: string
  receita_total: number
  mrr: number
  receita_unica: number
  novas_assinaturas: number
  total_ativos: number
  crescimento_pct: number | null
}

const cards = [
  {
    key: 'receita_total' as const,
    label: 'Receita do Mês',
    fmt: (v: number) => fmtBRL(v, true),
    color: '#10B981',
    bg: '#D1FAE5',
    extraKey: 'crescimento_pct' as const,
  },
  {
    key: 'mrr' as const,
    label: 'MRR',
    sub: 'receita recorrente',
    fmt: (v: number) => fmtBRL(v, true),
    color: '#06B6D4',
    bg: '#ECFEFF',
  },
  {
    key: 'receita_unica' as const,
    label: 'Venda Única',
    sub: 'à vista',
    fmt: (v: number) => fmtBRL(v, true),
    color: '#7C3AED',
    bg: '#EDE9FE',
  },
  {
    key: 'novas_assinaturas' as const,
    label: 'Novas Assinaturas',
    sub: 'no mês',
    fmt: (v: number) => fmtNum(v),
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
  {
    key: 'total_ativos' as const,
    label: 'Assinantes Ativos',
    sub: 'acumulado',
    fmt: (v: number) => fmtNum(v),
    color: '#7C3AED',
    bg: '#EDE9FE',
  },
]

export function KPICards({ kpi }: { kpi: KPI }) {
  return (
    <div className="grid-kpi">
      {cards.map(c => {
        const val = kpi[c.key]
        const cresc = c.extraKey ? kpi[c.extraKey] : null

        return (
          <div key={c.key} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-2)', marginBottom: 12 }}>
              {c.label}
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {c.fmt(val as number)}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-2)' }}>
              {cresc !== null && cresc !== undefined
                ? (
                  <span style={{ color: cresc >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                    {cresc >= 0 ? '↑' : '↓'} {Math.abs(cresc).toFixed(1)}% vs mês anterior
                  </span>
                )
                : c.sub}
            </div>
          </div>
        )
      })}
    </div>
  )
}
