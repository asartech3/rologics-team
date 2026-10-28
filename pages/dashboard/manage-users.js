import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import {
  Users,
  ShieldCheck,
  Plus,
  Search,
  Info,
  Mail,
  Phone,
  Clock,
  Award,
  ChevronRight,
  Trash2,
  KeyRound,
  Copy,
  Loader2,
  CheckCircle,
} from 'lucide-react'

const ROLES = [
  { value: 'team_lead', label: 'Team Lead', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'assisting_lead', label: 'Assisting Lead', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'member', label: 'Member', color: 'bg-green-50 text-green-700 border-green-200' },
]

const TEAMS = [
  { value: 'rolo-core', label: 'Rolo Core', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'rolo-edge', label: 'Rolo Edge', color: 'bg-purple-50 text-purple-700 border-purple-200' },
]

export default function ManageUsers() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [entries, setEntries] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Password reset state
  const [resetTarget, setResetTarget] = useState(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const [newEmployeeId, setNewEmployeeId] = useState('')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('member')
  const [newTeam, setNewTeam] = useState('rolo-core')
  const [newPassword, setNewPassword] = useState('')

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

        // Page guard: only CEO, Manager, Team Lead can use Manage Users
        const allowedRoles = ['manager', 'ceo', 'team_lead']
        if (!allowedRoles.includes(meData.user.role)) {
          router.replace('/dashboard')
          return
        }

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
  const canRemove = user && (user.role === 'manager' || user.role === 'ceo')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: newEmployeeId,
          password: newPassword || undefined,
          name: newName,
          email: newEmail,
          role: newRole,
          team: newTeam,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create user')
        setSaving(false)
        return
      }
      setSuccess(`User ${newName} created! Temporary password: ${data.autoPassword}`)
      setShowModal(false)
      setNewEmployeeId('')
      setNewName('')
      setNewEmail('')
      setNewRole('member')
      setNewTeam('rolo-core')
      setNewPassword('')
      loadMembers()
    } catch (err) {
      setError('Server error')
      setSaving(false)
    } finally {
      setSaving(false)
    }
  }

  const loadMembers = async () => {
    const res = await fetch('/api/members')
    const data = await res.json()
    setMembers(data.members || [])
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this employee permanently? Their performance entries will also be deleted. This cannot be undone.')) return
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to remove user')
        return
      }
      setSuccess('Employee removed')
      loadMembers()
    } catch (err) {
      console.error(err)
      setError('Server error')
    }
  }

  // ---------- Password reset ----------
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    const symbols = '@#$%'
    let pw = 'Rolo@'
    for (let i = 0; i < 6; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length))
    pw += symbols.charAt(Math.floor(Math.random() * symbols.length))
    return pw + Math.floor(Math.random() * 10)
  }

  const openReset = (m) => {
    setResetTarget(m)
    setResetPassword(generatePassword())
    setSuccess('')
    setError('')
  }

  const handleResetPassword = async () => {
    if (!resetTarget || resetPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setResetting(true)
    setError('')
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetTarget.id, newPassword: resetPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to reset password')
        setResetting(false)
        return
      }
      setSuccess(`Password for ${resetTarget.name} set to: ${resetPassword}`)
      setResetTarget(null)
    } catch (err) {
      setError('Server error')
    } finally {
      setResetting(false)
    }
  }

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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
                  <p className="text-slate-600 text-sm">Add and manage team members</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Member
              </button>
            </div>
          </div>
        </div>

        {/* Error/Success */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3">
            <Info className="w-4 h-4 text-red-600 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-xl bg-emerald-50 p-4 border border-emerald-100 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
            <p className="text-sm text-emerald-700">{success}</p>
          </div>
        )}

        {/* Members Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-4 text-xs font-bold text-slate-500 uppercase">Member</th>
                  <th className="pb-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                  <th className="pb-4 text-xs font-bold text-slate-500 uppercase">Team</th>
                  <th className="pb-4 text-xs font-bold text-slate-500 uppercase">Employee ID</th>
                  <th className="pb-4 text-xs font-bold text-slate-500 uppercase text-right">Entries</th>
                  <th className="pb-4 text-xs font-bold text-slate-500 uppercase text-right">Total</th>
                  <th className="pb-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const memberEntries = entries.filter((e) => e.userId === m.id)
                  const total = memberEntries.reduce((sum, e) => sum + (e.value || 0), 0)
                  const roleConfig = {
                    ceo: { label: 'CEO', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                    manager: { label: 'Manager', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                    team_lead: { label: 'Team Lead', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                    assisting_lead: { label: 'Assisting Lead', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                    member: { label: 'Member', color: 'bg-green-50 text-green-700 border-green-200' },
                  }[m.role] || { label: m.role || 'Member', color: 'bg-slate-50 text-slate-600 border-slate-200' }
                  const teamConfig = {
                    'rolo-core': { label: 'Rolo Core', color: 'text-blue-600 bg-blue-50 border-blue-100' },
                    'rolo-edge': { label: 'Rolo Edge', color: 'text-purple-600 bg-purple-50 border-purple-100' },
                  }[m.team] || { label: 'Unassigned', color: 'text-slate-500 bg-slate-50 border-slate-100' }

                  return (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium">
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{m.name}</p>
                            <p className="text-xs text-slate-500">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${roleConfig.color}`}>
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${teamConfig.color}`}>
                          {teamConfig.label}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-slate-600 font-mono">{m.employeeId}</td>
                      <td className="py-4 text-sm text-slate-700 text-right">{memberEntries.length}</td>
                      <td className="py-4 text-sm font-medium text-slate-800 text-right">{total}</td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openReset(m)}
                            title="Reset password"
                            className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          {canRemove && (
                            <button
                              onClick={() => handleDelete(m.id)}
                              title="Remove employee (CEO & Manager only)"
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Member Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Add New Member</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Employee ID</label>
                  <input
                    type="text"
                    value={newEmployeeId}
                    onChange={(e) => setNewEmployeeId(e.target.value)}
                    placeholder="e.g. RDO0123456"
                    className="w-full pl-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. john@rologicsinfolabs.com"
                    className="w-full pl-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full pl-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value} className={r.color}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                {isLeader && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Team</label>
                    <select
                      value={newTeam}
                      onChange={(e) => setNewTeam(e.target.value)}
                      className="w-full pl-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    >
                      {TEAMS.map((t) => (
                        <option key={t.value} value={t.value} className={t.color}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Temporary Password (optional)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full pl-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-70"
                >
                  {saving ? 'Creating...' : 'Create Member'}
                </button>
              </form>
            </div>
          </div>
        )}
        {/* Password Reset Modal */}
        {resetTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setResetTarget(null)} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
                <button
                  onClick={() => setResetTarget(null)}
                  className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                <p className="text-sm font-semibold text-slate-800">{resetTarget.name}</p>
                <p className="text-xs text-slate-500">
                  {resetTarget.employeeId} {resetTarget.team ? '• ' + (resetTarget.team === 'rolo-core' ? 'Rolo Core' : 'Rolo Edge') : ''}
                </p>
              </div>
              <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
              <div className="flex gap-2 mb-1">
                <input
                  type="text"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="flex-1 min-w-0 pl-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setResetPassword(generatePassword())}
                  title="Generate a strong password"
                  className="px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Share this password with the employee privately. They can log in with it immediately.
              </p>
              <button
                onClick={handleResetPassword}
                disabled={resetting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                  </>
                ) : (
                  'Set New Password'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
