import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import {
  TeamPerformanceChart,
  PerformanceTrendChart,
  MetricDonutChart,
  UserPerformanceBarChart,
  StatCard,
} from '@/components/Charts'
import {
  BarChart3,
  Clock,
  Brain,
  Users,
  Activity,
  Award,
  CheckCircle,
  TrendingUp,
  Clock as ClockIcon,
} from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState([])
  const [members, setMembers] = useState([])
  const [stats, setStats] = useState(null)

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

        const [entriesRes, membersRes, statsRes] = await Promise.all([
          fetch('/api/performance'),
          fetch('/api/members'),
          fetch('/api/stats'),
        ])
        const entriesData = await entriesRes.json()
        const membersData = await membersRes.json()
        const statsData = await statsRes.json()

        if (mounted) {
          setEntries(entriesData.entries || [])
          setMembers(membersData.members || [])
          setStats(statsData)
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
  const teamLabel = user?.team === 'rolo-core' ? 'Rolo Core' : user?.team === 'rolo-edge' ? 'Rolo Edge' : 'All Teams'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const visibleEntries = entries
  const totalValue = stats?.totalValue ?? 0
  const totalEntries = stats?.totalEntries ?? 0
  const recentCount = stats?.recentCount ?? 0
  const activeMembers = stats?.userList?.filter((u) => u.count > 0).length ?? 0

  return (
    <Layout user={user}>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Performance Dashboard</h1>
            <p className="text-slate-600 text-sm">
              {teamLabel} Team • Welcome back, {user.name}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Clock className="w-4 h-4" /> Today: {new Date().toLocaleDateString()}
            </button>
            <button className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> View Analytics
            </button>
          </div>
        </div>

        {/* Approvals guidance banner — makes it obvious where entries get approved */}
        {stats?.pendingCount > 0 && (
          isLeader ? (
            <Link href="/dashboard/pulse" className="block mb-8 rounded-2xl bg-amber-50 border border-amber-300 p-5 hover:bg-amber-100 transition-colors animate-slide-up">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <p className="font-semibold text-amber-900">
                    {stats.pendingCount} {stats.pendingCount === 1 ? 'entry is' : 'entries are'} waiting for approval
                  </p>
                  <p className="text-sm text-amber-800/80">
                    They don't count in stats, targets, leaderboard or AI reports until approved. Tap to open Team Pulse →
                  </p>
                </div>
                <span className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-xl">Open Team Pulse</span>
              </div>
            </Link>
          ) : (
            <div className="mb-8 rounded-2xl bg-amber-50 border border-amber-200 p-5 animate-slide-up">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900">
                    {stats.pendingCount} of your {stats.pendingCount === 1 ? 'entry is' : 'entries are'} awaiting approval
                  </p>
                  <p className="text-sm text-amber-800/80">
                    Your team lead approves these in <b>Team Pulse</b> — once approved they count in your stats and leaderboard.
                  </p>
                </div>
              </div>
            </div>
          )
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="Total Entries"
            value={totalEntries}
            icon={Activity}
            color="text-blue-600"
            subtitle="Performance records logged"
          />
          <StatCard
            title="Total Value"
            value={totalValue}
            icon={TrendingUp}
            color="text-green-600"
            subtitle="Combined performance score"
          />
          <StatCard
            title="Active (30 days)"
            value={recentCount}
            icon={ClockIcon}
            color="text-purple-600"
            subtitle="Entries in last 30 days"
          />
          <StatCard
            title="Team Members"
            value={activeMembers}
            icon={Users}
            color="text-amber-600"
            subtitle="Members with activity"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Charts */}
          <div className="lg:col-span-2 space-y-6">
            <PerformanceTrendChart entries={visibleEntries} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TeamPerformanceChart entries={visibleEntries} />
              <MetricDonutChart entries={visibleEntries} title="Entries by Metric" />
            </div>
          </div>

          {/* Right - Top Performers & Quick Actions */}
          <div className="space-y-6">
            <UserPerformanceBarChart entries={visibleEntries} users={members} />

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard/entry')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-left text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group"
                >
                  <Clock className="w-4 h-4 text-indigo-600 group-hover:text-indigo-700" />
                  <span>Log Hourly Entry</span>
                </button>
                {isLeader && (
                  <button
                    onClick={() => router.push('/dashboard/reports')}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-left text-sm font-medium text-slate-700 hover:bg-purple-50 hover:border-purple-200 transition-colors group"
                  >
                    <Brain className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                    <span>Generate AI Report</span>
                  </button>
                )}
                <button
                  onClick={() => router.push('/dashboard/team')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-left text-sm font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                >
                  <Users className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                  <span>View Team Members</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Recent Activity</h3>
              <div className="space-y-3">
                {visibleEntries
                  .slice()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 5)
                  .map((e) => {
                    const member = members.find((m) => m.id === e.userId)
                    return (
                      <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                          {member?.name.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {member?.name || 'Unknown'} • {String(e.metric || '').split(/[-_]/).map((w) => w && w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </p>
                          <p className="text-xs text-slate-500">{e.date} • {e.value}</p>
                        </div>
                        <span className="font-bold text-slate-800">{e.value}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
