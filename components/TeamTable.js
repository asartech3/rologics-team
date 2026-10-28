import { useState } from 'react'

export function TeamTable({ members, entries }) {
  const [selectedMember, setSelectedMember] = useState(null)

  const memberStats = members.map((m) => {
    const memEntries = entries.filter((e) => e.userId === m.id)
    const total = memEntries.reduce((sum, e) => sum + (e.value || 0), 0)
    const avg = memEntries.length ? Math.round((total / memEntries.length) * 100) / 100 : 0
    return { ...m, entryCount: memEntries.length, total, avg }
  })

  const getRoleBadge = (role) => {
    const variants = {
      ceo: 'bg-amber-50 text-amber-700 border border-amber-100',
      manager: 'bg-blue-50 text-blue-700 border border-blue-100',
      team_lead: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
      assisting_lead: 'bg-purple-50 text-purple-700 border border-purple-100',
      member: 'bg-green-50 text-green-700 border border-green-100',
    }
    const labels = {
      ceo: 'CEO',
      manager: 'Manager',
      team_lead: 'Team Lead',
      assisting_lead: 'Assisting Lead',
      member: 'Member',
    }
    return { className: variants[role] || variants.member, label: labels[role] || role }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Team Members Performance</h3>
        <div className="flex gap-2 text-sm text-slate-500">
          <span>Total: {members.length}</span>
          <span>•</span>
          <span>{memberStats.reduce((sum, m) => sum + m.entryCount, 0)} entries</span>
        </div>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Member</th>
            <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
            <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Employee ID</th>
            <th className="pb-3 text-xs font-semibold text-slate-500 uppercase text-right">Entries</th>
            <th className="pb-3 text-xs font-semibold text-slate-500 uppercase text-right">Total Value</th>
            <th className="pb-3 text-xs font-semibold text-slate-500 uppercase text-right">Avg</th>
          </tr>
        </thead>
        <tbody>
          {memberStats.map((m) => {
            const badge = getRoleBadge(m.role)
            return (
              <tr
                key={m.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer"
                onClick={() => setSelectedMember(selectedMember === m.id ? null : m.id)}
              >
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${badge.className}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="py-3 text-sm text-slate-600">{m.employeeId}</td>
                <td className="py-3 text-sm font-medium text-slate-700 text-right">{m.entryCount}</td>
                <td className="py-3 text-sm font-medium text-slate-700 text-right">{m.total}</td>
                <td className="py-3 text-sm font-medium text-slate-700 text-right">{m.avg}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {selectedMember && (
        <div className="mt-6 pt-6 border-t border-slate-100 bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-medium text-slate-700">Performance entries for</span>
            <span className="text-sm font-bold text-slate-900">{selectedMember.name}</span>
            <button
              onClick={() => setSelectedMember(null)}
              className="ml-auto p-1 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {entries
              .filter((e) => e.userId === selectedMember.id)
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 10)
              .map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2 text-sm border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">{e.metric}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">{e.category}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="font-medium text-slate-900">{e.value}</span>
                    <span className="text-slate-400 text-xs">{e.date}</span>
                  </div>
                </div>
              ))}
          </div>
          {entries.filter((e) => e.userId === selectedMember.id).length === 0 && (
            <div className="text-center py-4 text-sm text-slate-400">No performance entries yet.</div>
          )}
        </div>
      )}
    </div>
  )
}
