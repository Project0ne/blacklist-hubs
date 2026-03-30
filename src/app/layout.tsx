import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '外贸买家风险预警平台 · BlackList Hub',
  description: '收录恶意仅退款、虚假纠纷、空包诈骗等高风险买家信息，保护外贸卖家合法权益',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
