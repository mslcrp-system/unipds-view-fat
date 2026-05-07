import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Faturamento Mensal — Unipds',
  description: 'Evolução de faturamento, assinaturas e cohort de retenção',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
