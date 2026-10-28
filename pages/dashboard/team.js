import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import {
  Users,
  Search,
  Filter,
  Clock,
  Award,
  CheckCircle,
  BarChart3,
  Info,
  ChevronRight,
} from 'lucide-react'

export default function TeamMembers() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [entries, setEntries] = useState([])
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const meRes = await fetch('/api/auth/me')
        const meData = await meRes.json()
        if (!meData.user) {
          router.replace('/')
          return
        }
        setUser(meData.user)

        const [membersRes, entriesRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/performance'),
        ])
        const membersData = await membersRes.json()
        const entriesData = await entriesRes.json()

        if (mounted) {
          setMembers(membersData.members || [])
          setEntries(entriesData.entries || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [router])

  const isLeader = user && (user.role === 'manager' || user.role === 'ceo' || user.role === 'team_lead')
  const teamColor = user?.team === 'rolo-core' ? 'text-blue-600' : user?.team === 'rolo-edge' ? 'text-purple-600' : 'text-amber-600'

  const filteredMembers = members.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.employeeId.toLowerCase().includes(search.toLowerCase())
    const matchesTeam = teamFilter === 'all' || m.team === teamFilter
    return matchesSearch && matchesTeam
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <Layout user={user}>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${teamColor}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Team Members</h1>
                  <p className="text-slate-600 text-sm">
                    {isLeader ? 'View all team performance' : 'Your team members'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="font-medium">{members.length}</span>
                <span className="text-slate-400">•</span>
                <span>Total Members</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white w-full min-w-0 sm:w-56"
              />
              {isLeader && (
                <button
                  onClick={() => router.push('/dashboard/manage-users')}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <Info className="w-4 h-4" /> Manage Users
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Team Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'rolo-core', 'rolo-edge'].map((t) => {
            const active = teamFilter === t
            const colors = { all: 'bg-slate-100 text-slate-600', 'rolo-core': 'bg-blue-50 text-blue-700 border-blue-200', 'rolo-edge': 'bg-purple-50 text-purple-700 border-purple-200' }
            return (
              <button
                key={t}
                onClick={() => setTeamFilter(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${active ? colors[t] : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                {t === 'all' ? 'All Teams' : t === 'rolo-core' ? 'Rolo Core' : 'Rolo Edge'}
              </button>
            )
          })}
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((m) => {
            const memberEntries = entries.filter((e) => e.userId === m.id)
            const total = memberEntries.reduce((sum, e) => sum + (e.value || 0), 0)
            const avg = memberEntries.length ? Math.round((total / memberEntries.length) * 100) / 100 : 0
            const lastEntry = memberEntries.sort((a, b) => new Date(b.date) - new Date(a.date))[0]

            const roleConfig = {
              ceo: { label: 'CEO', color: 'bg-amber-50 text-amber-700 border-amber-200', bg: 'bg-amber-100' },
              manager: { label: 'Manager', color: 'bg-blue-50 text-blue-700 border-blue-200', bg: 'bg-blue-100' },
              team_lead: { label: 'Team Lead', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', bg: 'bg-indigo-100' },
              assisting_lead: { label: 'Assisting Lead', color: 'bg-purple-50 text-purple-700 border-purple-200', bg: 'bg-purple-100' },
              member: { label: 'Member', color: 'bg-green-50 text-green-700 border-green-200', bg: 'bg-green-100' },
            }[m.role] || { label: m.role || 'Member', color: 'bg-slate-50 text-slate-600 border-slate-200', bg: 'bg-slate-100' }

            const teamConfig = {
              'rolo-core': { label: 'Rolo Core', color: 'text-blue-600', bg: 'bg-blue-50' },
              'rolo-edge': { label: 'Rolo Edge', color: 'text-purple-600', bg: 'bg-purple-50' },
            }[m.team] || { label: 'Unassigned', color: 'text-slate-500', bg: 'bg-slate-50' }

            return (
              <div
                key={m.id}
                className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.employeeId}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${roleConfig.color}`}>
                    {roleConfig.label}
                  </span>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className={`text-xs font-medium ${teamConfig.color}`}>{teamConfig.label}</span>
                    <span className="text-xs text-slate-500">{m.designation || 'Executive'}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-white border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Entries</p>
                      <p className="text-sm font-bold text-slate-800">{memberEntries.length}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                      <p className="text-sm font-bold text-slate-800">{total}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Avg</p>
                      <p className="text-sm font-bold text-slate-800">{avg}</p>
                    </div>
                  </div>

                  {lastEntry && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-100">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">Last: {String(lastEntry.metric || '').split(/[-_]/).map((w) => w && w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{lastEntry.value}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    className="w-full py-2.5 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3" /> View Details
                  </button>
                </div>
              </div>
            )
          })}
          {filteredMembers.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">No members found</h3>
              <p className="text-slate-500">Try adjusting your search or team filter.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
