import '../styles/globals.css'
import Head from 'next/head'
import { useEffect } from 'react'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Dark mode: apply saved preference before paint to avoid flash
    const applyTheme = () => {
      const mode = localStorage.getItem('rolo-theme') || 'light'
      if (mode === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
    applyTheme()

    // PWA: register service worker (permissions come with HTTPS deployment for full push)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return (
    <>
      <Head>
        <title>Rolo Team | Performance Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Rolo Team" />
        <link rel="icon" href="/rolo-logo.png" type="image/png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/rolo-logo.png" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
