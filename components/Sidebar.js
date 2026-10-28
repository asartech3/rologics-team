import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  Brain,
  Contact,
  Clock,
  Trophy,
  ChevronRight,
  X,
  PanelLeftClose,
} from 'lucide-react'

const NAV_ITEMS = [
  { key: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'entry', href: '/dashboard/entry', label: 'Hourly Entry', icon: Clock },
  { key: 'pulse', href: '/dashboard/pulse', label: 'Team Pulse', icon: Trophy },
  { key: 'reports', href: '/dashboard/reports', label: 'AI Reports', icon: Brain },
  { key: 'team', href: '/dashboard/team', label: 'Team Members', icon: Users },
  { key: 'profile', href: '/dashboard/profile', label: 'My Profile', icon: Contact },
  { key: 'settings', href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const MANAGER_NAV = [
  ...NAV_ITEMS.filter((i) => i.key !== 'profile'),
  { key: 'manage-users', href: '/dashboard/manage-users', label: 'Manage Users', icon: ShieldCheck },
]

// Static Tailwind classes so the JIT compiler includes them
const TEAM_ACTIVE_STYLES = {
  'rolo-core': 'bg-blue-50 border-blue-200 text-blue-700',
  'rolo-edge': 'bg-purple-50 border-purple-200 text-purple-700',
  default: 'bg-emerald-50 border-emerald-200 text-emerald-700',
}

export default function Sidebar({ user, open, onClose, collapsed, onToggleCollapse }) {
  const router = useRouter()
  const isManagerOrCEO = user.role === 'manager' || user.role === 'ceo'
  const navItems = isManagerOrCEO ? MANAGER_NAV : NAV_ITEMS
  const iconOnly = !!collapsed

  const activeKey = router.asPath.includes('/dashboard/entry')
    ? 'entry'
    : router.asPath.includes('/dashboard/pulse')
    ? 'pulse'
    : router.asPath.includes('/dashboard/reports')
    ? 'reports'
    : router.asPath.includes('/dashboard/team')
    ? 'team'
    : router.asPath.includes('/dashboard/profile')
    ? 'profile'
    : router.asPath.includes('/dashboard/settings')
    ? 'settings'
    : router.asPath.includes('/dashboard/manage-users')
    ? 'manage-users'
    : 'dashboard'

  const activeStyle = TEAM_ACTIVE_STYLES[user.team] || TEAM_ACTIVE_STYLES.default
  const teamLabel = user.team === 'rolo-core' ? 'Rolo Core' : user.team === 'rolo-edge' ? 'Rolo Edge' : 'Operations'

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 lg:translate-x-0 ${
          collapsed ? 'lg:w-20' : 'lg:w-72'
        } w-72 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200">
            <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
              <img src="/rolo-logo.png" alt="Rologics" className="w-10 h-10 rounded-xl object-contain" />
              <div className={`flex-col ${iconOnly ? 'lg:hidden' : 'flex'}`}>
                <span className="flex text-sm font-bold text-slate-800 tracking-tight">
                  Rolo<span className="text-indigo-600">Team</span>
                </span>
                <span className="text-xs text-slate-500">team.rologicsinfolabs.com</span>
                <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold border border-amber-200">
                  Beta v0.58.2
                </span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex self-end mx-3 mt-3 items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 transition-colors"
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
          >
            <PanelLeftClose className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>

          {/* Navigation */}
          <nav className={`flex-1 py-4 ${iconOnly ? 'px-2 lg:px-2' : 'px-4'} space-y-1 overflow-y-auto`}>
            {navItems.map((item) => {
              const Icon = item.icon
              const active = activeKey === item.key || router.asPath === item.href
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={onClose}
                  title={iconOnly ? item.label : undefined}
                  className={`flex items-center rounded-xl text-sm font-medium transition-all duration-200 border ${
                    iconOnly ? 'lg:justify-center lg:px-0 px-4 py-3' : 'gap-3 px-4 py-3'
                  } ${
                    active
                      ? `${activeStyle} shadow-sm`
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? '' : 'text-slate-400'}`} />
                  <span className={iconOnly ? 'lg:hidden' : ''}>{item.label}</span>
                  {active && !iconOnly && <ChevronRight className="ml-auto w-4 h-4 text-slate-400" />}
                </Link>
              )
            })}
          </nav>

          {/* Sign out */}
          <div className={`mt-6 ${iconOnly ? 'px-2 lg:px-2' : 'px-4'}`}>
            <button
              onClick={() => fetch('/api/auth/logout', { method: 'POST' }).then(() => (window.location.href = '/'))}
              title={iconOnly ? 'Sign out' : undefined}
              className={`w-full flex ${iconOnly ? 'lg:justify-center' : 'items-center gap-3 px-4'} py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-100`}
            >
              <LogOut className="w-4 h-4" />
              <span className={iconOnly ? 'lg:hidden' : ''}>Sign out</span>
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-t border-slate-100">
            <div className={`flex items-center ${iconOnly ? 'lg:justify-center' : 'gap-3'} px-2`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-medium flex-shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className={`flex-1 min-w-0 ${iconOnly ? 'lg:hidden' : ''}`}>
                <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {user.role.replace('_', ' ')} • {teamLabel}
                </p>
              </div>
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  user.role === 'ceo' || user.role === 'manager' ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
