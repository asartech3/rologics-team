import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import {
  Trophy, Target, CheckCircle, XCircle, Loader2, Clock, Users, Crown, Flame, Plus, Info,
} from 'lucide-react'
import { CheckCircle as Approve, XCircle as Reject } from 'lucide-react'

const metricLabel = (m) => (m || '')
  .split(/[-_]/)
  .map((w) => w && w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ')
const weekStart = () => {
  const d = new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}
const weekEnd = () => {
  const d = new Date(weekStart())
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

export default function TeamPulse() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState([])
  const [members, setMembers] = useState([])
  const [targets, setTargets] = useState([])
  const [showTargetModal, setShowTargetModal] = useState(false)
  const [reviewing, setReviewing] = useState(null) // id currently being approved/rejected
  const [toast, setToast] = useState('')
  const [saved, setSaved] = useState('')
  // dynamic project list (targets are set per project)
  const [projects, setProjects] = useState([])

  // target form
  const [tMember, setTMember] = useState('')
  const [tMetric, setTMetric] = useState('')
  const [tValue, setTValue] = useState('')
  const [tSaving, setTSaving] = useState(false)
  const [tError, setTError] = useState('')

  // leaderboard scope
  const [period, setPeriod] = useState('week') // week | month

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const meRes = await fetch('/api/auth/me')
      const meData = await meRes.json().catch(() => ({}))
      if (!meData.user) { router.replace('/'); return }
      if (mounted) setUser(meData.user)
      const [perf, mem, targ, prj] = await Promise.all([
        fetch('/api/performance'), fetch('/api/members'), fetch('/api/targets'), fetch('/api/projects'),
      ])
      const pd = await perf.json().catch(() => ({}))
      const md = await mem.json().catch(() => ({}))
      const td = await targ.json().catch(() => ({}))
      const pjd = await prj.json().catch(() => ({}))
      if (mounted) {
        setEntries(pd.entries || [])
        setMembers(md.members || [])
        setTargets(td.targets || [])
        setProjects(Array.isArray(pjd.projects) ? pjd.projects : [])
        setTMetric((m) => m || (pjd.projects && pjd.projects[0] ? pjd.projects[0].slug : ''))
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [router])

  const refresh = async () => {
    const [perf, targ] = await Promise.all([fetch('/api/performance'), fetch('/api/targets')])
    const pd = await perf.json().catch(() => ({}))
    const td = await targ.json().catch(() => ({}))
    setEntries(pd.entries || [])
    setTargets(td.targets || [])
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    )
  }
  if (!user) return null

  const isCEOorMgr = user.role === 'ceo' || user.role === 'manager'
  const isTeamLead = user.role === 'team_lead'
  const isLeader = isCEOorMgr || isTeamLead
  const nameOf = (id) => (members.find((m) => m.id === id) || {}).name || 'Unknown'
  // Prefer the real project name stored by the lead ("HPE"), fall back to the slug title-cased
  const labelOf = (slug) => (projects.find((p) => p.slug === slug) || {}).name || metricLabel(slug)

  // ---------- APPROVALS ----------
  const pending = entries.filter((e) => e.status === 'pending').sort((a, b) => new Date(b.date) - new Date(a.date))
  const reviewEntry = async (id, status) => {
    setReviewing(id)
    try {
      const res = await fetch('/api/performance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (!res.ok) { setToast(data.error || 'Failed'); setReviewing(null); return }
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
      setToast('Entry ' + status)
      await refresh()
    } catch (e) {
      setToast('Server error')
    }
    setReviewing(null)
    setTimeout(() => setToast(''), 2500)
  }

  // ---------- LEADERBOARD ----------
  const inPeriod = (e) => {
    const today = new Date().toISOString().slice(0, 10)
    const from = period === 'week' ? weekStart() : today.slice(0, 8) + '01'
    return e.date >= from
  }
  const board = members
    .filter((m) => m.team || isCEOorMgr)
    .map((m) => {
      // Hierarchy rule: only APPROVED entries count toward the leaderboard
      const mine = entries.filter((e) => e.userId === m.id && inPeriod(e) && e.status === 'approved')
      const pendingMine = entries.filter((e) => e.userId === m.id && inPeriod(e) && e.status === 'pending')
      const teamName = m.team === 'rolo-core' ? 'Rolo Core' : m.team === 'rolo-edge' ? 'Rolo Edge' : '—'
      const hasRole = ['team_lead', 'assisting_lead', 'member'].includes(m.role)
      return {
        id: m.id,
        name: m.name,
        team: teamName,
        role: m.role,
        isStaff: hasRole,
        count: mine.length,
        total: mine.reduce((s, e) => s + (e.value || 0), 0),
        pendingCount: pendingMine.length,
        days: new Set(mine.map((e) => e.date)).size,
        approved: mine.filter((e) => e.status === 'approved').length,
      }
    })
    .filter((r) => r.isStaff)
    .sort((a, b) => b.total - a.total)

  const medal = (i) => (i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-600' : null)

  // ---------- MY TARGET (members) ----------
  const myTarget = isLeader ? null : targets[0] || null

  // ---------- TARGETS FORM ----------
  const openTargetModal = () => {
    setTMember(members[0]?.id || '')
    setTMetric(projects[0]?.slug || '')
    setTValue('')
    setTError('')
    setShowTargetModal(true)
  }

  const saveTarget = async () => {
    if (!tMember || !tMetric || !tValue) { setTError('Member, project and target value required'); return }
    setTSaving(true)
    try {
      const res = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: tMember, metric: tMetric, targetValue: Number(tValue) }),
      })
      const data = await res.json()
      if (!res.ok) { setTError(data.error || 'Failed'); setTSaving(false); return }
      setShowTargetModal(false)
      setSaved('Target assigned! The member has been notified.')
      await refresh()
    } catch (e) {
      setTError('Server error')
    }
    setTSaving(false)
    setTimeout(() => setSaved(''), 3000)
  }

  return (
    <Layout user={user}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Toasts */}
        {toast && (
          <div className="fixed top-24 right-4 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-slide-up">
            {toast}
          </div>
        )}
        {saved && (
          <div className="mb-6 rounded-xl bg-emerald-50 p-4 border border-emerald-100 flex items-start gap-3 dark:bg-emerald-900/20">
            <Info className="w-4 h-4 text-emerald-600 mt-0.5" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{saved}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Pulse</h1>
              <p className="text-slate-600 text-sm dark:text-slate-400">Leaderboard, weekly targets & approvals</p>
            </div>
          </div>
        </div>

        {/* MEMBER VIEW: my target ring + my submission status + attendance */}
        {!isLeader && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 dark:bg-slate-800 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2 dark:text-slate-200">
                <Target className="w-4 h-4" /> My Weekly Target
              </h3>
              {myTarget ? (
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                      <circle
                        cx="18" cy="18" r="15.5" fill="none" stroke={myTarget.pct >= 100 ? '#059669' : '#6366f1'} strokeWidth="4"
                        strokeDasharray={`${Math.min(100, myTarget.pct || 0)} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-800 dark:text-slate-100">
                      {myTarget.pct || 0}%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{labelOf(myTarget.metric)}</p>
                    <p className="text-2xl font-bold text-indigo-600">{myTarget.done || 0} <span className="text-slate-400 text-sm">/ {myTarget.targetValue}</span></p>
                    <p className="text-xs text-slate-500 mt-1">Week of {myTarget.weekStart}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No target assigned yet this week. Your lead will assign one soon.</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 dark:bg-slate-800 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2 dark:text-slate-200">
                <Clock className="w-4 h-4" /> My Submissions Status
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-2xl font-bold text-amber-600">{entries.filter((e) => e.status === 'pending').length}</p>
                  <p className="text-xs text-amber-700 font-medium dark:text-amber-400">Pending</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-2xl font-bold text-emerald-600">{entries.filter((e) => e.status === 'approved').length}</p>
                  <p className="text-xs text-emerald-700 font-medium dark:text-emerald-400">Approved</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700">
                  <p className="text-2xl font-bold text-slate-600">{new Set(entries.map((e) => e.date)).size}</p>
                  <p className="text-xs text-slate-500 font-medium dark:text-slate-300">Active days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEADER: approvals queue */}
        {isLeader && (
          <div id="approvals" className={`rounded-2xl shadow-sm border p-4 sm:p-6 mb-8 ${pending.length > 0 ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-2 dark:text-slate-200">
              <CheckCircle className={`w-4 h-4 ${pending.length > 0 ? 'text-amber-600' : ''}`} /> Pending Approvals
              <span className={`${pending.length > 0 ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-500'} text-xs px-2 py-0.5 rounded-full`}>{pending.length}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 dark:text-slate-400">
              Entries your team logged sit here until you approve them. <b>Approved entries count</b> in stats, targets, leaderboard and AI reports — nothing counts until it's approved here.
            </p>
            {pending.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">All caught up! Nothing waiting for approval.
                <br /><span className="text-xs text-slate-400">New entries logged by your team will appear here with Approve / Reject buttons.</span>
              </p>
            ) : (
              <div className="space-y-3">
                {pending.slice(0, 8).map((e) => (
                  <div key={e.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-700 dark:border-slate-600">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate dark:text-slate-100">
                        {nameOf(e.userId)} <span className="text-slate-400 font-normal">• {e.date}</span>
                      </p>
                      <p className="text-xs text-slate-500 capitalize dark:text-slate-400">
                        {labelOf(e.metric)} — <span className="font-bold text-indigo-600">{e.value}</span>{e.notes ? ' • ' + e.notes : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => reviewEntry(e.id, 'approved')}
                        disabled={reviewing === e.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
                      >
                        <Approve className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => reviewEntry(e.id, 'rejected')}
                        disabled={reviewing === e.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors disabled:opacity-60 dark:bg-slate-800"
                      >
                        <Reject className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LEADER: targets board */}
        {isLeader && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8 dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 dark:text-slate-200">
                <Target className="w-4 h-4" /> Weekly Targets
              </h3>
              <button
                onClick={openTargetModal}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" /> Assign Target
              </button>
            </div>
            {targets.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No targets assigned yet. Assign a weekly target to keep everyone focused.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {targets.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-700 dark:border-slate-600">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{nameOf(t.memberId)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{labelOf(t.metric)} • week of {t.weekStart}</p>
                      </div>
                      <span className={`text-sm font-bold ${t.pct >= 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        {t.done || 0}/{t.targetValue}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-800">
                      <div
                        className={`h-2.5 rounded-full transition-all ${t.pct >= 100 ? 'bg-emerald-600' : 'bg-indigo-600'}`}
                        style={{ width: (t.pct || 0) + '%' }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">{t.pct || 0}% complete{t.openCount ? ` • ${t.openCount} awaiting approval` : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 dark:text-slate-200">
              <Trophy className="w-4 h-4" /> Leaderboard — Top Performers
            </h3>
            <div className="flex gap-2">
              {['week', 'month'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize ${
                    period === p ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:text-slate-300'
                  }`}
                >
                  This {p}
                </button>
              ))}
            </div>
          </div>

          {board.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No performance data for this period yet.</p>
          ) : (
            <div className="space-y-2">
              {board.map((r, i) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all ${
                    i < 3 ? 'bg-gradient-to-r from-amber-50 to-transparent border-amber-100 dark:from-amber-900/20' : 'border-slate-100 dark:border-slate-700'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${medal(i) ? medal(i) : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>
                    {i < 3 ? <Crown className="w-4 h-4" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate dark:text-slate-100">{r.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {r.team} • {r.count} entries • {r.days} active days
                      {r.pendingCount > 0 && (
                        <span className="ml-1.5 text-amber-600 font-semibold">• {r.pendingCount} pending</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{r.total}</p>
                    <p className="text-xs text-slate-400">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assign Target Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowTargetModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative dark:bg-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assign Weekly Target</h3>
              <button onClick={() => setShowTargetModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 dark:bg-slate-700 dark:text-slate-300">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">Member</label>
                <select
                  value={tMember}
                  onChange={(e) => setTMember(e.target.value)}
                  className="w-full pl-3 py-2.5 border border-slate-200 rounded-lg outline-none bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                >
                  {members.filter((m) => m.team).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">Project</label>
                <select
                  value={tMetric}
                  onChange={(e) => setTMetric(e.target.value)}
                  className="w-full pl-3 py-2.5 border border-slate-200 rounded-lg outline-none bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                >
                  {projects.length === 0 && <option value="">No projects available</option>}
                  {projects.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}{p.team ? ' • ' + (p.team === 'rolo-core' ? 'Rolo Core' : 'Rolo Edge') : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">Target value for the week</label>
                <input
                  type="number"
                  min="1"
                  value={tValue}
                  onChange={(e) => setTValue(e.target.value)}
                  placeholder="e.g. 40 tasks"
                  className="w-full pl-3 py-2.5 border border-slate-200 rounded-lg outline-none bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                  required
                />
              </div>
              {tError && <p className="text-sm text-red-600">{tError}</p>}
              <button
                onClick={saveTarget}
                disabled={tSaving}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {tSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Assign Target'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
