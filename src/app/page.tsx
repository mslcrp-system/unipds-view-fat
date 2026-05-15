'use client'

import { useEffect, useState } from 'react'
import { KPICards }              from '@/components/KPICards'
import { CurvaRecebiveisChart }  from '@/components/CurvaRecebiveisChart'
import { CohortTable }           from '@/components/CohortTable'
import { fmtMes }                from '@/lib/fmt'

type Tenant = 'all' | 'ia' | 'java'

const TENANT_LABELS: Record<Tenant, string> = {
  all:  'Consolidado',
  ia:   'IA Aplicada',
  java: 'Java Elite',
}

type Data = {
  recebiveis_mensal: { mes: string; assinatura: number; unico: number; total: number }[]
  curva_recebiveis: {
    mes: string
    tenant_nome: string
    status_mes: 'passado' | 'corrente' | 'futuro'
    esperado: number
    realizado: number
    inadimplente: number
    cancelado: number
    saldo_aberto: number
  }[]
  cohort: { mes_entrada: string; mes_recebido: string; receita: number; contratos: number }[]
  kpi: {
    mes_ref: string | null
    recebido_mes_ref: number
    mrr: number
    recebido_unica: number
    crescimento_pct: number | null
    runway_proximos_6m: number
    inadimplencia_mes_ref: number
  }
}

export default function Page() {
  const [tenant, setTenant]   = useState<Tenant>('all')
  const [data, setData]       = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    setData(null)
    fetch(`/api/faturamento?tenant=${tenant}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setData(d)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [tenant])

  return (
    <div className="shell">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
            Faturamento Mensal
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            Curva de runway de recebíveis, evolução mensal e cohort de retenção
            {data && data.kpi.mes_ref && (
              <span style={{ marginLeft: 8, color: 'var(--text-3)' }}>
                · ref. {fmtMes(data.kpi.mes_ref)}
              </span>
            )}
          </p>
        </div>

        {/* Filtro de empresa */}
        <div style={{ display: 'flex', gap: 6, background: '#F3F4F6', borderRadius: 10, padding: 4 }}>
          {(Object.keys(TENANT_LABELS) as Tenant[]).map(t => (
            <button
              key={t}
              onClick={() => setTenant(t)}
              style={{
                padding: '7px 16px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: tenant === t ? 700 : 500,
                background: tenant === t ? '#fff' : 'transparent',
                color: tenant === t ? 'var(--text-1)' : 'var(--text-2)',
                boxShadow: tenant === t ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {TENANT_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 24, color: '#B91C1C', fontSize: 13 }}>
          Erro ao carregar dados: {error}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100 }} />
            ))}
          </div>
          <div className="skeleton" style={{ height: 352 }} />
          <div className="skeleton" style={{ height: 320 }} />
        </div>
      )}

      {!loading && data && (
        <>
          <KPICards kpi={data.kpi} />

          <div style={{ marginBottom: 18 }}>
            <CurvaRecebiveisChart data={data.curva_recebiveis} />
          </div>

          <CohortTable data={data.cohort} />
        </>
      )}
    </div>
  )
}
