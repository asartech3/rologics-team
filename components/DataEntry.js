import { useState } from 'react'
import { Plus, Activity } from 'lucide-react'

export default function PerformanceEntry({ user, onSuccess }) {
  const [metric, setMetric] = useState('')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [category, setCategory] = useState('general')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const CATEGORIES = [
    { value: 'general', label: 'General' },
    { value: 'tasks', label: 'Tasks Completed' },
    { value: 'sales', label: 'Sales' },
    { value: 'quality', label: 'Quality Score' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'target', label: 'Target Achievement' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!metric || value === '') {
      setError('Metric and value are required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric, value: Number(value), date, notes, category }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save entry')
        setSubmitting(false)
        return
      }
      setMetric('')
      setValue('')
      setNotes('')
      setCategory('general')
      onSuccess?.()
    } catch (err) {
      setError('Server error')
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">Add Performance Entry</h3>
        <Plus className="w-5 h-5 text-blue-600" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Metric</label>
            <input
              type="text"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g. Tasks Completed"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <label className="block text-sm font-medium text-slate-700 mb-1 mr-2">Value</label>
            <div className="relative flex-1">
              <input
                type="number"
                className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            rows={2}
            placeholder="Optional notes about this performance entry..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-100">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <Activity className="w-4 h-4" /> {submitting ? 'Saving...' : 'Save Performance Entry'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-sm text-slate-500">
        <p>Your team: <span className="font-medium text-slate-700 capitalize">{user.team}</span></p>
        <p>Entries are saved to your team's performance record.</p>
      </div>
    </div>
  )
}
