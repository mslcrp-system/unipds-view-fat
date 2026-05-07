const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

export function fmtMes(iso: string): string {
  const [ano, mes] = iso.split('-')
  return `${MESES[+mes - 1]}/${ano.slice(2)}`
}

export function fmtBRL(v: number, compact = false): string {
  if (compact && Math.abs(v) >= 1_000_000)
    return `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`
  if (compact && Math.abs(v) >= 1_000)
    return `R$ ${(v / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}K`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

export function fmtNum(v: number): string {
  return v.toLocaleString('pt-BR')
}
