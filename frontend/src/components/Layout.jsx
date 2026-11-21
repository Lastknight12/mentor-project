import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AccessibilityWidget } from './AccessibilityWidget.jsx'
import { Footer } from './Footer.jsx'
import { GuideTour } from './GuideTour.jsx'
import { Header } from './Header.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

export function Layout() {
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Перейти до вмісту
      </a>
      <ScrollToTop />
      <Header />
      <main className="main-content" id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <GuideTour />
      <AccessibilityWidget />
    </div>
  )
}
