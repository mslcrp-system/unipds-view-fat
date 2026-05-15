import { NextResponse, type NextRequest } from 'next/server'
import { supa } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 30

const TENANTS: Record<string, string> = {
  ia:   'e717e24d-fb30-4ed0-83d3-bb8ea0b66783',
  java: '70b668e4-be85-459b-8dbb-3876929ac850',
}

export async function GET(req: NextRequest) {
  try {
    const tenant   = req.nextUrl.searchParams.get('tenant') ?? 'all'
    const tenantId = TENANTS[tenant] ?? null
    const rpcParams = tenantId ? { p_tenant_id: tenantId } : {}

    const [
      { data: recRaw,    error: e1 },
      { data: curvaRaw,  error: e2 },
      { data: cohortRaw, error: e3 },
    ] = await Promise.all([
      supa.rpc('get_recebiveis_mensal',       rpcParams),
      supa.rpc('get_curva_recebiveis_mensal', rpcParams),
      supa.rpc('get_cohort_recebiveis',       rpcParams),
    ])

    if (e1) throw new Error(`recebiveis_mensal: ${e1.message}`)
    if (e2) throw new Error(`curva_recebiveis: ${e2.message}`)
    if (e3) throw new Error(`cohort_recebiveis: ${e3.message}`)

    // Recebíveis mensais → pivot {mes, assinatura, unico, total}
    type RecRow = { mes: string; tipo_cobranca: string; receita: string }
    const recMap: Record<string, { assinatura: number; unico: number }> = {}
    for (const r of (recRaw as RecRow[]) ?? []) {
      if (!recMap[r.mes]) recMap[r.mes] = { assinatura: 0, unico: 0 }
      const v = Number(r.receita)
      if (r.tipo_cobranca === 'Assinatura') recMap[r.mes].assinatura += v
      else                                  recMap[r.mes].unico      += v
    }
    const recebiveisMensal = Object.entries(recMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, v]) => ({
        mes,
        assinatura: r2(v.assinatura),
        unico:      r2(v.unico),
        total:      r2(v.assinatura + v.unico),
      }))

    // Curva de recebíveis — passthrough, já tem status_mes do banco
    type CurvaRow = {
      mes: string; tenant_nome: string; status_mes: string
      esperado: string; realizado: string; inadimplente: string
      cancelado: string; saldo_aberto: string
    }
    const curvaRecebiveis = ((curvaRaw as CurvaRow[]) ?? []).map(r => ({
      mes:          r.mes,
      tenant_nome:  r.tenant_nome,
      status_mes:   r.status_mes as 'passado' | 'corrente' | 'futuro',
      esperado:     r2(Number(r.esperado)),
      realizado:    r2(Number(r.realizado)),
      inadimplente: r2(Number(r.inadimplente)),
      cancelado:    r2(Number(r.cancelado)),
      saldo_aberto: r2(Number(r.saldo_aberto)),
    }))

    // Cohort — passthrough
    type CohortRow = { mes_entrada: string; mes_recebido: string; receita: string; contratos: string }
    const cohort = ((cohortRaw as CohortRow[]) ?? []).map(r => ({
      mes_entrada:  r.mes_entrada,
      mes_recebido: r.mes_recebido,
      receita:      r2(Number(r.receita)),
      contratos:    Number(r.contratos),
    }))

    // KPIs — mês de referência é o último 'passado' (ou 'corrente' se não houver passado)
    // Consolida a curva por mês (somando tenants quando filtro = all)
    const curvaPorMes: Record<string, typeof curvaRecebiveis[0] & { meses_futuros_acumulado: number }> = {}
    for (const r of curvaRecebiveis) {
      if (!curvaPorMes[r.mes]) {
        curvaPorMes[r.mes] = { ...r, meses_futuros_acumulado: 0 }
      } else {
        curvaPorMes[r.mes].esperado     += r.esperado
        curvaPorMes[r.mes].realizado    += r.realizado
        curvaPorMes[r.mes].inadimplente += r.inadimplente
        curvaPorMes[r.mes].cancelado    += r.cancelado
        curvaPorMes[r.mes].saldo_aberto += r.saldo_aberto
      }
    }
    const curvaConsolidada = Object.values(curvaPorMes).sort((a, b) => a.mes.localeCompare(b.mes))

    const passados   = curvaConsolidada.filter(r => r.status_mes === 'passado')
    const corrente   = curvaConsolidada.find(r => r.status_mes === 'corrente')
    const mesRef     = passados.at(-1) ?? corrente ?? null
    const ultimoRec  = recebiveisMensal.find(r => r.mes === mesRef?.mes)
    const penultRec  = recebiveisMensal.at(recebiveisMensal.findIndex(r => r.mes === mesRef?.mes) - 1)
    const crescimento = ultimoRec && penultRec && penultRec.total > 0
      ? r2(((ultimoRec.total - penultRec.total) / penultRec.total) * 100)
      : null

    // Runway 6 meses: soma de 'esperado' dos próximos 6 meses (futuros + corrente)
    const futurosCorrente = curvaConsolidada.filter(r => r.status_mes !== 'passado')
    const runway6m = r2(
      futurosCorrente.slice(0, 6).reduce((s, r) => s + r.esperado, 0)
    )

    return NextResponse.json({
      recebiveis_mensal: recebiveisMensal,
      curva_recebiveis:  curvaRecebiveis,
      cohort,
      kpi: {
        mes_ref:               mesRef?.mes              ?? null,
        recebido_mes_ref:      ultimoRec?.total         ?? 0,
        mrr:                   ultimoRec?.assinatura    ?? 0,
        recebido_unica:        ultimoRec?.unico         ?? 0,
        crescimento_pct:       crescimento,
        runway_proximos_6m:    runway6m,
        inadimplencia_mes_ref: mesRef?.inadimplente     ?? 0,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[/api/faturamento]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

const r2 = (n: number) => Math.round(n * 100) / 100
