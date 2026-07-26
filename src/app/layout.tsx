import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hoop Glory — Simulá tu carrera de básquet',
  description:
    'Elegí tu país, tu número y tu posición. Simulá una carrera completa de básquet, desde las inferiores hasta el Salón de la Fama. / Pick your country, number and position and simulate a full basketball career.',
  openGraph: {
    title: 'Hoop Glory',
    description: 'De las inferiores al Salón de la Fama. / From the academy to the Hall of Fame.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `lang` is corrected client-side by LocaleProvider once the stored locale is known.
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
