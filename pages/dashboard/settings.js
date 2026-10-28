import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import {
  Settings,
  ShieldCheck,
  Lock,
  Bell,
  Mail,
  Info,
  Download,
  CheckCircle,
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(false)
  const [canInstall, setCanInstall] = useState(true)
  const [notifPerm, setNotifPerm] = useState('default')

  useEffect(() => {
    setDark(localStorage.getItem('rolo-theme') === 'dark')
    if ('Notification' in window) setNotifPerm(Notification.permission)
    // hide install card if already installed (running in standalone mode)
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) setCanInstall(false)
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('rolo-theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
  }

  const enableNotifications = async () => {
    if (!('Notification' in window)) return
    const p = await Notification.requestPermission()
    setNotifPerm(p)
  }

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (!data.user) {
          router.replace('/')
          return
        }
        setUser(data.user)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const isLeader = user.role === 'manager' || user.role === 'ceo' || user.role === 'team_lead'

  return (
    <Layout user={user}>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-slate-600 text-sm">Manage your account and preferences</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Account Information</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-800">Full Name</p>
                <p className="text-xs text-slate-500">{user.name}</p>
              </div>
              <span className="text-xs font-medium text-slate-400">{user.employeeId}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-800">Email Address</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Change</button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-800">Role</p>
                <p className="text-xs text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                user.role === 'ceo' ? 'bg-amber-100 text-amber-700' :
                user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                user.role === 'team_lead' ? 'bg-indigo-100 text-indigo-700' :
                user.role === 'assisting_lead' ? 'bg-purple-100 text-purple-700' :
                'bg-green-100 text-green-700'
              }`}>
                {user.role.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-800">Team</p>
                <p className="text-xs text-slate-500">
                  {user.team === 'rolo-core' ? 'Rolo Core' : user.team === 'rolo-edge' ? 'Rolo Edge' : 'Unassigned'}
                </p>
              </div>
              <span className={`text-xs font-medium ${
                user.team === 'rolo-core' ? 'text-blue-600' : user.team === 'rolo-edge' ? 'text-purple-600' : 'text-slate-500'
              }`}>
                {user.team === 'rolo-core' ? 'Rolo Core' : user.team === 'rolo-edge' ? 'Rolo Edge' : 'Not assigned'}
              </span>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 dark:text-slate-200">Appearance</h3>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-700 dark:border-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white dark:bg-indigo-100 dark:text-indigo-700">
                {dark ? '🌙' : '☀️'}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Dark Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Easier on the eyes at night</p>
              </div>
            </div>
            <button
              onClick={toggleDark}
              className={`relative w-14 h-8 rounded-full transition-colors ${dark ? 'bg-indigo-600' : 'bg-slate-300'}`}
              aria-label="Toggle dark mode"
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${dark ? 'left-7' : 'left-1'}`}
              />
            </button>
          </div>
        </div>

        {/* Notifications & Install */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 dark:text-slate-200">App & Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-700 dark:border-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 dark:bg-purple-900/40">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Phone Notifications</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {notifPerm === 'granted' ? 'Enabled — you will get alerts' : notifPerm === 'denied' ? 'Blocked in browser settings' : 'Get entry & report alerts'}
                  </p>
                </div>
              </div>
              {notifPerm === 'granted' ? (
                <span className="text-xs font-medium text-emerald-600">On</span>
              ) : (
                <button onClick={enableNotifications} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                  Enable
                </button>
              )}
            </div>
            {canInstall && (
              <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">📱 Install as App</p>
                <ul className="text-xs text-slate-500 mt-1 space-y-1 list-disc list-inside dark:text-slate-300">
                  <li><b>Android (Chrome):</b> tap ⋮ menu → "Add to Home screen"</li>
                  <li><b>iPhone (Safari):</b> tap Share ⬆️ → "Add to Home Screen"</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 dark:text-slate-200">Security</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Change Password</p>
                  <p className="text-xs text-slate-500">Update your login password</p>
                </div>
              </div>
              <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Change</button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Notifications</p>
                  <p className="text-xs text-slate-500">Email and push notifications</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">System Information</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-800">Application</p>
                <p className="text-xs text-slate-500">Rolo Team Performance Dashboard</p>
              </div>
              <span className="text-xs font-medium text-slate-400">v2.0.0</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-800">Domain</p>
                <p className="text-xs text-slate-500">team.rologicsinfolabs.com</p>
              </div>
              <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Configure</button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-800">Data Storage</p>
                <p className="text-xs text-slate-500">Secure JSON database</p>
              </div>
              <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Backup</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
