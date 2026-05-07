import { NextResponse, type NextRequest } from 'next/server'
import { supa } from '@/lib/supabase'

export const runtime    = 'nodejs'
export const maxDuration = 30

// Tenants válidos — evita injeção de UUID arbitrário
const TENANTS: Record<string, string> = {
  ia:   'e717e24d-fb30-4ed0-83d3-bb8ea0b66783',
  java: '70b668e4-be85-459b-8dbb-3876929ac850',
}

export async function GET(req: NextRequest) {
  try {
    const tenant    = req.nextUrl.searchParams.get('tenant') ?? 'all'
    const tenantId  = TENANTS[tenant] ?? null   // null = consolidado

    const rpcParams = tenantId ? { p_tenant_id: tenantId } : {}

    const [
      { data: fatRaw,    error: e1 },
      { data: assRaw,    error: e2 },
      { data: cohortRaw, error: e3 },
    ] = await Promise.all([
      supa.rpc('get_faturamento_mensal', rpcParams),
      supa.rpc('get_curva_assinaturas',  rpcParams),
      supa.rpc('get_cohort_assinaturas', rpcParams),
    ])

    if (e1) throw new Error(`faturamento_mensal: ${e1.message}`)
    if (e2) throw new Error(`curva_assinaturas: ${e2.message}`)
    if (e3) throw new Error(`cohort_assinaturas: ${e3.message}`)

    // ── Faturamento mensal → pivot {mes, assinatura, unico, total} ────────
    type FatRow = { mes: string; tipo_cobranca: string; receita: string }
    const fatMap: Record<string, { assinatura: number; unico: number }> = {}
    for (const r of (fatRaw as FatRow[]) ?? []) {
      if (!fatMap[r.mes]) fatMap[r.mes] = { assinatura: 0, unico: 0 }
      const v = Number(r.receita)
      if (r.tipo_cobranca === 'Assinatura') fatMap[r.mes].assinatura += v
      else                                  fatMap[r.mes].unico      += v
    }

    const hoje        = new Date()
    const mesAtual    = ym(hoje)

    const faturamentoMensal = Object.entries(fatMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, v]) => ({
        mes,
        assinatura: r2(v.assinatura),
        unico:      r2(v.unico),
        total:      r2(v.assinatura + v.unico),
      }))
      .filter(row => !(row.mes === mesAtual && hoje.getDate() < 10))

    // ── Curva de assinaturas → {mes, novas, acumulado} ───────────────────
    type AssRow = { mes: string; novas: string; novas_ativas: string }
    let acumulado = 0
    const curvaAssinaturas = ((assRaw as AssRow[]) ?? []).map(r => {
      acumulado += Number(r.novas_ativas)
      return { mes: r.mes, novas: Number(r.novas), acumulado }
    })

    // ── Cohort raw passthrough ────────────────────────────────────────────
    type CohortRow = { mes_entrada: string; mes_recebido: string; receita: string; contratos: string }
    const cohort = ((cohortRaw as CohortRow[]) ?? []).map(r => ({
      mes_entrada:  r.mes_entrada,
      mes_recebido: r.mes_recebido,
      receita:      r2(Number(r.receita)),
      contratos:    Number(r.contratos),
    }))

    // ── KPIs ──────────────────────────────────────────────────────────────
    const ultimo      = faturamentoMensal.at(-1)
    const penultimo   = faturamentoMensal.at(-2)
    const kpiAss      = curvaAssinaturas.find(r => r.mes === ultimo?.mes)
    const crescimento = ultimo && penultimo && penultimo.total > 0
      ? r2(((ultimo.total - penultimo.total) / penultimo.total) * 100)
      : null

    return NextResponse.json({
      faturamento_mensal: faturamentoMensal,
      curva_assinaturas:  curvaAssinaturas,
      cohort,
      kpi: {
        mes_ref:           ultimo?.mes          ?? mesAtual,
        receita_total:     ultimo?.total        ?? 0,
        mrr:               ultimo?.assinatura   ?? 0,
        receita_unica:     ultimo?.unico        ?? 0,
        novas_assinaturas: kpiAss?.novas        ?? 0,
        total_ativos:      kpiAss?.acumulado    ?? 0,
        crescimento_pct:   crescimento,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[/api/faturamento]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

const r2 = (n: number) => Math.round(n * 100) / 100
const ym = (d: Date)   =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
