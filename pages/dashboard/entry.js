import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import {
  Clock,
  Loader2,
  Info,
  Plus,
  X,
  Tag,
} from 'lucide-react'

const PROJECT_COLORS = [
  'bg-blue-600 border-blue-600 text-white',
  'bg-purple-600 border-purple-600 text-white',
  'bg-emerald-600 border-emerald-600 text-white',
  'bg-rose-600 border-rose-600 text-white',
  'bg-orange-600 border-orange-600 text-white',
  'bg-cyan-600 border-cyan-600 text-white',
  'bg-indigo-600 border-indigo-600 text-white',
  'bg-amber-600 border-amber-600 text-white',
]

// A readable label for any project slug ("monthly-events-qa" → "Monthly Events QA")
export function projectLabel(slug) {
  return (slug || '')
    .split(/[-_]/)
    .map((w) => w && w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function HourlyEntry() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [metric, setMetric] = useState('')
  const [value, setValue] = useState('')
  const [hour, setHour] = useState(new Date().getHours())
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [category, setCategory] = useState('daily')
  const [onBehalfId, setOnBehalfId] = useState('')
  const [teamMembers, setTeamMembers] = useState([])

  // dynamic project list
  const [projects, setProjects] = useState([])
  // add-project form (Team Lead / Manager / CEO only)
  const [showAddProject, setShowAddProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectTeam, setNewProjectTeam] = useState('')
  const [addProjectError, setAddProjectError] = useState('')
  const [addingProject, setAddingProject] = useState(false)

  const categoryOptions = [
    { value: 'daily', label: 'Daily Work' },
    { value: 'project', label: 'Project Work' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'training', label: 'Training' },
    { value: 'admin', label: 'Admin' },
  ]

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          router.replace('/')
          return
        }
        const data = await res.json().catch(() => ({}))
        if (!data.user) {
          router.replace('/')
          return
        }
        setUser(data.user)
        // Load the project list this user can log entries against
        try {
          const pRes = await fetch('/api/projects')
          if (pRes.ok) {
            const pData = await pRes.json().catch(() => ({}))
            const list = Array.isArray(pData.projects) ? pData.projects : []
            setProjects(list)
            // preselect the first project on fresh pages
            setMetric((m) => (m ? m : list[0] ? list[0].slug : ''))
          }
        } catch {}
        // Leaders can log entries on behalf of an absent member
        if (['manager', 'ceo', 'team_lead'].includes(data.user.role)) {
          try {
            const mRes = await fetch('/api/members')
            if (mRes.ok) {
              const mData = await mRes.json().catch(() => ({}))
              const list = Array.isArray(mData) ? mData : (mData.members || [])
              setTeamMembers(list.filter((m) => ['member', 'assisting_lead'].includes(m.role)))
            }
          } catch {}
        }
      } catch (err) {
        console.error('entry load failed', err)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!metric || value === '') {
      setError('Please select a project and enter a value')
      return
    }

    setSaving(true)
    try {
      const entryDate = new Date(date)
      entryDate.setHours(parseInt(hour), 0, 0, 0)
      const entryDateString = entryDate.toISOString().slice(0, 10)

      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric,
          value: Number(value),
          date: entryDateString,
          notes,
          category,
          userId: onBehalfId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save entry')
        setSaving(false)
        return
      }
      if (onBehalfId) {
        const member = teamMembers.find((m) => m.id === onBehalfId)
        setSuccess('Entry saved for ' + (member ? member.name : 'member') + ' — awaiting leader approval before it counts')
      } else {
        setSuccess('Entry submitted — it counts in stats once your team lead approves it')
      }
      setValue('')
      setNotes('')
      setOnBehalfId('')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError('Server error')
      setSaving(false)
    } finally {
      setSaving(false)
    }
  }

  // Team Lead / Manager / CEO can add a new project on the fly
  const handleAddProject = async () => {
    setAddProjectError('')
    const name = newProjectName.trim()
    if (!name) { setAddProjectError('Enter a project name'); return }
    setAddingProject(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          // Manager/CEO can pick which team gets it (blank = all teams)
          team: user.role === 'team_lead' ? undefined : newProjectTeam,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAddProjectError(data.error || 'Could not add project')
        setAddingProject(false)
        return
      }
      setProjects((prev) => [...prev, data.project])
      setMetric(data.project.slug)
      setNewProjectName('')
      setNewProjectTeam('')
      setShowAddProject(false)
      setSuccess('Project "' + data.project.name + '" added — now available for logging')
      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setAddProjectError('Server error')
    }
    setAddingProject(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const selProject = projects.find((p) => p.slug === metric)
  const projectInfo = selProject || (metric ? { slug: metric, name: projectLabel(metric) } : null)
  const teamColor = user.team === 'rolo-core' ? 'from-blue-600 to-blue-700' : user.team === 'rolo-edge' ? 'from-purple-600 to-purple-700' : 'from-amber-600 to-amber-700'

  return (
    <Layout user={user}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${teamColor}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Hourly Entry</h1>
              <p className="text-slate-600 text-sm">Log your detailed performance data</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{user.name}</span>
            <span>•</span>
            <span>{user.team ? (user.team === 'rolo-core' ? 'Rolo Core' : 'Rolo Edge') : 'Executive'}</span>
            <span>•</span>
            <span>Employee ID: {user.employeeId}</span>
          </div>
        </div>

        {/* Error/Success */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3">
            <Info className="w-4 h-4 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-xl bg-emerald-50 p-4 border border-emerald-100 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm text-emerald-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Entry Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* Hierarchy note */}
          <div className="mb-6 rounded-xl bg-amber-50 p-4 border border-amber-100 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Every entry is reviewed by your team lead before it counts. It appears in Team Pulse for approval
              immediately — stats, leaderboard and reports only include <b>approved</b> entries.
            </p>
          </div>
          {/* On-behalf selector (leaders only) */}
          {teamMembers.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Log for a team member (when they're on leave)
              </label>
              <select
                value={onBehalfId}
                onChange={(e) => setOnBehalfId(e.target.value)}
                className="w-full px-3 py-3 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Myself</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.team ? '• ' + (m.team === 'rolo-core' ? 'Rolo Core' : m.team === 'rolo-edge' ? 'Rolo Edge' : '') : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1.5">
                {user.role === 'team_lead'
                  ? 'You can log entries for your own team members.'
                  : 'Managers and CEO can log entries for anyone. The member gets a notification.'}
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Project</label>
                <div className="flex flex-wrap gap-2">
                  {projects.map((p, idx) => {
                    const active = metric === p.slug
                    const color = PROJECT_COLORS[idx % PROJECT_COLORS.length]
                    return (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => setMetric(p.slug)}
                        title={p.team ? 'Enabled for ' + (p.team === 'rolo-core' ? 'Rolo Core' : 'Rolo Edge') : 'Available to all teams'}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                          active
                            ? color
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        {p.name}
                      </button>
                    )
                  })}
                </div>
                {projects.length === 0 && (
                  <p className="text-xs text-slate-500">No projects available yet — ask your team lead to add one.</p>
                )}

                {/* Add project (Team Lead / Manager / CEO) */}
                {['team_lead', 'manager', 'ceo'].includes(user.role) && (
                  <div className="mt-3">
                    {!showAddProject ? (
                      <button
                        type="button"
                        onClick={() => { setShowAddProject(true); setAddProjectError('') }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Add new project
                      </button>
                    ) : (
                      <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-indigo-900">New project</p>
                          <button type="button" onClick={() => setShowAddProject(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="Project name (e.g. HPE)"
                          className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {user.role !== 'team_lead' && (
                          <select
                            value={newProjectTeam}
                            onChange={(e) => setNewProjectTeam(e.target.value)}
                            className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">All teams (global)</option>
                            <option value="rolo-core">Rolo Core only</option>
                            <option value="rolo-edge">Rolo Edge only</option>
                          </select>
                        )}
                        {user.role === 'team_lead' && (
                          <p className="text-xs text-indigo-700/80">Added to {user.team === 'rolo-core' ? 'Rolo Core' : 'Rolo Edge'} — your team leads the project list.</p>
                        )}
                        {addProjectError && <p className="text-xs text-red-600">{addProjectError}</p>}
                        <button
                          type="button"
                          onClick={handleAddProject}
                          disabled={addingProject}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
                        >
                          {addingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          Add project
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Value */}
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-slate-700 mb-3">Value</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                    placeholder="0.0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    {value}
                  </div>
                </div>
              </div>

              {/* Hour */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Hour of Day</label>
                <select
                  value={hour}
                  onChange={(e) => setHour(parseInt(e.target.value))}
                  className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white appearance-none"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}:00 {h >= 12 ? 'PM' : 'AM'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Work Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white appearance-none"
                >
                  {categoryOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Notes / Details</label>
              <textarea
                rows={3}
                className="w-full pl-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                placeholder="Add detailed notes about this entry..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Save Hourly Entry
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">How Hourly Entry Works</h4>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li>Log your performance data every hour or at the end of your shift</li>
                <li>Select the appropriate metric (Tasks, Sales, Quality, etc.)</li>
                <li>Managers and Team Leads can see all team entries</li>
                <li>AI Reports analyze all logged data for insights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
