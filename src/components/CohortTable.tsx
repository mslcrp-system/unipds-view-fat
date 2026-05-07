'use client'

import { fmtMes, fmtBRL, fmtNum } from '@/lib/fmt'

type CohortRow = {
  mes_entrada:  string
  mes_recebido: string
  receita:      number
  contratos:    number
}

export function CohortTable({ data }: { data: CohortRow[] }) {
  // Monta estrutura pivot
  const entradas  = [...new Set(data.map(r => r.mes_entrada))].sort()
  const recebidos = [...new Set(data.map(r => r.mes_recebido))].sort()

  // Índice rápido: [mes_entrada][mes_recebido]
  const idx: Record<string, Record<string, CohortRow>> = {}
  for (const r of data) {
    if (!idx[r.mes_entrada]) idx[r.mes_entrada] = {}
    idx[r.mes_entrada][r.mes_recebido] = r
  }

  // Receita de entrada (mês 0) de cada coorte — base para % retenção
  const base: Record<string, number> = {}
  for (const e of entradas) {
    base[e] = idx[e]?.[e]?.receita ?? 0
  }

  // Cor por % de retenção de receita
  function cellColor(receita: number, baseReceita: number): string {
    if (!baseReceita || !receita) return 'transparent'
    const pct = receita / baseReceita
    if (pct >= 0.90) return 'rgba(16,185,129,0.18)'
    if (pct >= 0.70) return 'rgba(16,185,129,0.10)'
    if (pct >= 0.50) return 'rgba(245,158,11,0.12)'
    if (pct >= 0.30) return 'rgba(245,158,11,0.07)'
    return 'rgba(239,68,68,0.07)'
  }

  // Total recebido por mês (coluna)
  const totalPorMesRecebido: Record<string, number> = {}
  for (const r of data) {
    totalPorMesRecebido[r.mes_recebido] = (totalPorMesRecebido[r.mes_recebido] ?? 0) + r.receita
  }

  return (
    <div className="card" style={{ padding: '24px 0 0' }}>
      <div className="card-label" style={{ padding: '0 24px 14px' }}>
        Cohort de Assinaturas — Receita Recebida por Mês de Entrada
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {/* Cabeçalho fixo: mês de entrada */}
              <th style={{
                textAlign: 'left', padding: '8px 16px 8px 24px',
                fontSize: 11, fontWeight: 700, color: 'var(--text-2)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                background: '#FAFAFA', borderBottom: '1px solid var(--border)',
                position: 'sticky', left: 0, zIndex: 1, minWidth: 90,
              }}>
                Entrada
              </th>
              <th style={{
                textAlign: 'right', padding: '8px 12px',
                fontSize: 11, fontWeight: 700, color: 'var(--text-2)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                background: '#FAFAFA', borderBottom: '1px solid var(--border)',
                minWidth: 64,
              }}>
                Contratos
              </th>
              {/* Cabeçalhos dos meses recebidos */}
              {recebidos.map(mr => (
                <th key={mr} style={{
                  textAlign: 'right', padding: '8px 12px',
                  fontSize: 11, fontWeight: 600, color: 'var(--text-2)',
                  background: '#FAFAFA', borderBottom: '1px solid var(--border)',
                  minWidth: 88, whiteSpace: 'nowrap',
                }}>
                  {fmtMes(mr)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entradas.map((entrada, rowIdx) => {
              const primeiraCell = idx[entrada]?.[entrada]
              const qtdContratos = primeiraCell?.contratos ?? 0
              return (
                <tr key={entrada} style={{ borderBottom: '1px solid var(--border-sm)' }}>
                  {/* Mês de entrada */}
                  <td style={{
                    padding: '9px 16px 9px 24px', fontWeight: 700,
                    color: 'var(--text-1)', background: '#FAFAFA',
                    position: 'sticky', left: 0,
                    borderRight: '1px solid var(--border-sm)',
                  }}>
                    {fmtMes(entrada)}
                  </td>
                  {/* Qtd contratos do cohort */}
                  <td style={{ textAlign: 'right', padding: '9px 12px', color: 'var(--text-2)', fontWeight: 500 }}>
                    {fmtNum(qtdContratos)}
                  </td>
                  {/* Células de receita por mês recebido */}
                  {recebidos.map(mr => {
                    // Só exibe células onde mes_recebido >= mes_entrada
                    if (mr < entrada) {
                      return <td key={mr} style={{ padding: '9px 12px', background: rowIdx % 2 === 0 ? '#FAFAFA' : '#fff' }} />
                    }
                    const cell = idx[entrada]?.[mr]
                    const isMes0 = mr === entrada
                    const bg = cell ? cellColor(cell.receita, base[entrada]) : 'transparent'
                    const retPct = cell && base[entrada] > 0
                      ? ((cell.receita / base[entrada]) * 100).toFixed(0)
                      : null

                    return (
                      <td key={mr} style={{
                        textAlign: 'right', padding: '9px 12px',
                        background: bg,
                        borderLeft: isMes0 ? '2px solid rgba(124,58,237,0.2)' : undefined,
                      }}>
                        {cell ? (
                          <div>
                            <div style={{ fontWeight: isMes0 ? 700 : 500, color: 'var(--text-1)' }}>
                              {fmtBRL(cell.receita, true)}
                            </div>
                            {!isMes0 && retPct !== null && (
                              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                                {retPct}%
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--border)', fontSize: 11 }}>—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {/* Linha de totais */}
            <tr style={{ background: '#F9FAFB', borderTop: '2px solid var(--border)' }}>
              <td style={{
                padding: '10px 16px 10px 24px', fontWeight: 700, fontSize: 12,
                color: 'var(--text-1)', background: '#F3F4F6',
                position: 'sticky', left: 0,
              }}>
                Total
              </td>
              <td />
              {recebidos.map(mr => (
                <td key={mr} style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: 'var(--text-1)' }}>
                  {fmtBRL(totalPorMesRecebido[mr] ?? 0, true)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {/* Legenda */}
      <div style={{ display: 'flex', gap: 20, padding: '12px 24px', borderTop: '1px solid var(--border-sm)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Retenção de receita vs mês 0 do cohort:</span>
        {[
          ['rgba(16,185,129,0.3)', '≥ 90%'],
          ['rgba(16,185,129,0.15)', '70–90%'],
          ['rgba(245,158,11,0.18)', '50–70%'],
          ['rgba(239,68,68,0.12)', '< 50%'],
        ].map(([bg, label]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-2)' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: bg as string, display: 'inline-block', border: '1px solid rgba(0,0,0,0.06)' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
