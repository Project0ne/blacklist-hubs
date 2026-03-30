import type { Metadata } from 'next'
import { Noto_Sans_SC } from 'next/font/google'
import './globals.css'

const notoSansSC = Noto_Sans_SC({ 
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: '外贸黑名单预警平台 - BlackList Hub',
  description: '收录恶意仅退款、虚假纠纷、空包诈骗等高风险买家信息，保护外贸卖家合法权益',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${notoSansSC.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
