import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Initialize synchronously from localStorage so the sidebar doesn't
  // flash expanded → collapsed (or "open and close") on every navigation
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem('rolo-sidebar-collapsed') === '1'
    } catch {
      return false
    }
  })

  const toggleCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try { window.localStorage.setItem('rolo-sidebar-collapsed', next ? '1' : '0') } catch {}
      return next
    })
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen relative">
      {/* Branded 3D background scene (fixed, behind everything) */}
      <div className="rolo-app-scene" aria-hidden="true">
        <div className="absolute inset-0 rolo-bg" />
        <div className="rolo-orb rolo-orb-1" />
        <div className="rolo-orb rolo-orb-2" />
        <div className="rolo-orb rolo-orb-3" />
        <div className="rolo-floor" />
        <div className="rolo-cube-scene rolo-cube-scene-1">
          <div className="rolo-cube">
            <div className="rolo-face rolo-face-f" /><div className="rolo-face rolo-face-b" />
            <div className="rolo-face rolo-face-l" /><div className="rolo-face rolo-face-r" />
            <div className="rolo-face rolo-face-t" /><div className="rolo-face rolo-face-d" />
          </div>
        </div>
        <div className="rolo-cube-scene rolo-cube-scene-3">
          <div className="rolo-cube">
            <div className="rolo-face rolo-face-f" /><div className="rolo-face rolo-face-b" />
            <div className="rolo-face rolo-face-l" /><div className="rolo-face rolo-face-r" />
            <div className="rolo-face rolo-face-t" /><div className="rolo-face rolo-face-d" />
          </div>
        </div>
      </div>
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} onToggleCollapse={toggleCollapsed} />
      {/* Both navbar and content shift right on desktop so the sidebar never covers them */}
      <div className={'relative z-[1] transition-all duration-300 ' + (sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72')}>
        <Navbar user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="pb-8">{children}</main>
      </div>
    </div>
  )
}
