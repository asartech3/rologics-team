import { useState, useRef, useEffect } from 'react'
import { Bell, HelpCircle, Search as SearchIcon, Menu as MenuIcon } from 'lucide-react'

export default function Navbar({ user, onMenuClick }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const notifRef = useRef(null)
  const helpRef = useRef(null)

  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [seenBefore, setSeenBefore] = useState(null)

  // Load real notifications
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/notifications')
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        setNotifications(data.notifications || [])
        setUnread(data.unread || 0)
      } catch (e) {}
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  // Keep page title badge on unread count, like native apps
  useEffect(() => {
    document.title = (unread > 0 ? `(${unread}) ` : '') + 'Rolo Team | Performance Dashboard'
  }, [unread])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotificationsOpen(false)
      if (helpRef.current && !helpRef.current.contains(e.target)) setHelpOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Browser notification when a new notification arrives while the app is open
  useEffect(() => {
    if (!('Notification' in window)) return
    const previous = seenBefore
    if (previous !== null && unread > (previous.unread || 0) && 'serviceWorker' in navigator && Notification.permission === 'granted') {
      const newest = notifications[0]
      if (newest) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification('Rolo Team — ' + newest.title, {
            body: newest.message,
            icon: '/rolo-icon.svg',
          })
        }).catch(() => {})
      }
    }
    setSeenBefore({ unread })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread])

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: notifications.filter((n) => n.unread).map((n) => n.id) }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
      setUnread(0)
    } catch (e) {}
  }

  const timeAgo = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return Math.floor(diff / 60) + ' min ago'
    if (diff < 86400) return Math.floor(diff / 3600) + ' hr ago'
    return Math.floor(diff / 86400) + ' day' + (Math.floor(diff / 86400) > 1 ? 's' : '') + ' ago'
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/80">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 lg:px-8">
        {/* Left - Menu (mobile) + Search */}
        <div className="flex items-center flex-1 gap-2">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          )}
          <div className="relative hidden md:block w-80">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              placeholder="Search members, entries, reports..."
            />
          </div>
        </div>

        {/* Right - Bell, Help, User Profile */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen)
                setHelpOpen(false)
                requestNotificationPermission()
              }}
              className="relative w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900">
                  {unread}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notifications</h3>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-indigo-600 font-medium">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet</p>
                  )}
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${n.unread ? 'bg-blue-50/60' : ''} dark:border-slate-700`}
                    >
                      <div className="flex items-start gap-3">
                        {n.unread && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{n.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Help */}
          <div ref={helpRef} className="relative">
            <button
              onClick={() => {
                setHelpOpen(!helpOpen)
                setNotificationsOpen(false)
              }}
              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            {helpOpen && (
              <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4 dark:bg-slate-800 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Help & Support</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-700 dark:border-slate-600">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Quick Guide</p>
                    <ul className="text-xs text-slate-500 mt-1 space-y-1 list-disc list-inside dark:text-slate-300">
                      <li>Log your work every hour in Hourly Entry</li>
                      <li>Leaders: generate AI Reports & approve entries</li>
                      <li>Track weekly targets & leaderboard</li>
                      <li>Install the app on your phone from Settings</li>
                    </ul>
                  </div>
                  <div className="text-xs text-slate-400 text-center">
                    Updates and admin are handled by your Manager
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divider + User Profile */}
          <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block dark:bg-slate-700" />
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize dark:text-slate-400">{user.role.replace('_', ' ')} • {user.employeeId}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
