import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import {
  Brain,
  FileText,
  Download,
  Clock,
  Users,
  BarChart3,
  CheckCircle,
  Loader2,
  RefreshCw,
  Mail,
  Info,
  FileSpreadsheet,
  Printer,
  MessageCircle,
} from 'lucide-react'

export default function AIReports() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [reports, setReports] = useState([])
  const [error, setError] = useState('')

  const [reportType, setReportType] = useState('team_performance')
  const [teamFilter, setTeamFilter] = useState('all')
  const [memberId, setMemberId] = useState('')
  const [membersList, setMembersList] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const reportTypes = [
    { value: 'team_performance', label: 'Team Performance Report', icon: BarChart3 },
    { value: 'individual_performance', label: 'Individual Performance', icon: Users },
    { value: 'monthly_summary', label: 'Monthly Summary', icon: Clock },
    { value: 'comparative', label: 'Comparative Analysis', icon: BarChart3 },
  ]

  const teams = [
    { value: 'all', label: 'All Teams' },
    { value: 'rolo-core', label: 'Rolo Core', color: 'bg-blue-500' },
    { value: 'rolo-edge', label: 'Rolo Edge', color: 'bg-purple-500' },
  ]

  useEffect(() => {
    let mounted = true
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json().catch(() => ({}))
        if (!data.user) {
          router.replace('/')
          return
        }
        setUser(data.user)
        loadReports()
        if (data.user.role !== 'member') loadMembers()
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadUser()
    return () => { mounted = false }
  }, [router])

  const loadMembers = async () => {
    try {
      const res = await fetch('/api/members')
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.members || data.users || [])
      setMembersList(list.filter((m) => ['member', 'assisting_lead', 'team_lead'].includes(m.role)))
    } catch (err) {
      console.error(err)
    }
  }

  const loadReports = async () => {
    try {
      const res = await fetch('/api/reports')
      const data = await res.json()
      setReports(data.reports || [])
    } catch (err) {
      console.error(err)
    }
  }

  const generateReport = async () => {
    setError('')
    setGenerating(true)
    try {
      const res = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: teamFilter === 'all' ? undefined : teamFilter,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          type: reportType,
          memberId: reportType === 'individual_performance' && memberId ? memberId : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate report')
        setGenerating(false)
        return
      }
      setReportData(data)
      // Save to report history so it stays accessible under "Report History"
      try {
        await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title || reportTypes.find((r) => r.value === reportType)?.label || 'Report',
            type: reportType,
            team: teamFilter === 'all' ? undefined : teamFilter,
            dateFrom: data.dateFrom || dateFrom || undefined,
            dateTo: data.dateTo || dateTo || undefined,
            aiInsights: data.aiInsights || '',
            data: { totalEntries: data.totalEntries, totalValue: data.totalValue, userList: data.userList, metricList: data.metricList },
          }),
        })
      } catch (e) {
        console.error('history save failed', e)
      }
      loadReports()
    } catch (err) {
      setError('Server error')
    } finally {
      setGenerating(false)
    }
  }

  const downloadSaved = (r) => {
    const d = r.data || {}
    const lines = []
    lines.push('Rolo Team Performance Report')
    lines.push('============================')
    lines.push('Title: ' + (r.title || 'Report'))
    lines.push('Type: ' + String(r.type || 'report').replace(/_/g, ' '))
    lines.push('Team: ' + (r.team || 'All Teams'))
    lines.push('Period: ' + (r.dateFrom || 'N/A') + ' to ' + (r.dateTo || 'N/A'))
    lines.push('Generated: ' + (r.createdAt || ''))
    lines.push('')
    lines.push('Total Entries: ' + (d.totalEntries ?? 0) + ' | Total Value: ' + (d.totalValue ?? 0))
    if (Array.isArray(d.userList) && d.userList.length) {
      lines.push('')
      lines.push('TOP PERFORMERS')
      d.userList.sort((a, b) => b.total - a.total).slice(0, 10).forEach((u, i) =>
        lines.push((i + 1) + '. ' + u.name + ' — ' + u.total + ' total (' + u.count + ' entries, avg ' + u.avg + ')')
      )
    }
    lines.push('')
    lines.push('AI INSIGHTS')
    lines.push('-----------')
    lines.push(r.aiInsights || 'No AI insights stored for this report.')
    lines.push('')
    lines.push('---')
    lines.push('Generated by Rolo Team Dashboard — team.rologicsinfolabs.com')
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rolo-report-' + (r.createdAt || new Date().toISOString()).slice(0, 10) + '.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const reportSummary = () => {
    const top = (reportData.userList || []).sort((a, b) => b.total - a.total).slice(0, 3)
    let s = 'ROLO TEAM — PERFORMANCE REPORT\n'
    s += (reportData.title || 'Report') + '\n'
    s += 'Period: ' + (dateFrom || 'All time') + ' → ' + (dateTo || 'today') + '\n'
    s += 'Total Entries: ' + (reportData.totalEntries ?? 0) + ' | Total Value: ' + (reportData.totalValue ?? 0) + '\n'
    if (top.length) {
      s += '\nTop Performers:\n'
      top.forEach((u, i) => { s += (i + 1) + '. ' + u.name + ' — ' + u.total + '\n' })
    }
    s += '\n' + (reportData.aiInsights || '').slice(0, 1200)
    return s
  }

  const shareWhatsApp = () => {
    window.open('https://wa.me/?text=' + encodeURIComponent(reportSummary()), '_blank')
  }

  const shareEmail = () => {
    const subject = encodeURIComponent('Rolo Team — ' + (reportData.title || 'Performance Report'))
    window.location.href = 'mailto:?subject=' + subject + '&body=' + encodeURIComponent(reportSummary())
  }

  const exportExcel = () => {
    const rows = []
    rows.push(['Metric', 'Total', 'Entries', 'Average'])
    ;(reportData.metricList || []).forEach((m) => rows.push([m.metric, m.total, m.count, m.avg]))
    rows.push([])
    rows.push(['Member', 'Team', 'Entries', 'Total', 'Average'])
    ;(reportData.userList || [])
      .sort((a, b) => b.total - a.total)
      .forEach((u) => rows.push([u.name, u.team || '', u.count, u.total, u.avg]))
    const csv = rows.map((r) => r.map((c) => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rolo-report-' + new Date().toISOString().slice(0, 10) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    const w = window.open('', '_blank', 'width=800,height=900')
    if (!w) return
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const stats = `
      <div class="cards">
        <div class="card"><b>${reportData.totalEntries ?? 0}</b><span>Total Entries</span></div>
        <div class="card"><b>${reportData.totalValue ?? 0}</b><span>Total Value</span></div>
        <div class="card"><b>${reportData.recentCount ?? 0}</b><span>Recent Activity</span></div>
      </div>`
    const metrics = (reportData.metricList || []).length
      ? '<h2>Metrics Breakdown</h2><table><tr><th>Metric</th><th>Total</th><th>Entries</th><th>Avg</th></tr>' +
        (reportData.metricList || []).map((m) => `<tr><td>${esc(m.metric)}</td><td>${m.total}</td><td>${m.count}</td><td>${m.avg}</td></tr>`).join('') + '</table>'
      : ''
    const users = (reportData.userList || []).length
      ? '<h2>Top Performers</h2><table><tr><th>#</th><th>Member</th><th>Team</th><th>Entries</th><th>Total</th></tr>' +
        (reportData.userList || []).sort((a, b) => b.total - a.total).slice(0, 15).map((u, i) => `<tr><td>${i + 1}</td><td>${esc(u.name)}</td><td>${esc(u.team || '—')}</td><td>${u.count}</td><td>${u.total}</td></tr>`).join('') + '</table>'
      : ''
    const insights = '<h2>AI Insights</h2><pre class="ai">' + esc(reportData.aiInsights || 'No insights available') + '</pre>'
    w.document.write(`<!doctype html><html><head><title>Rolo Team Report</title><style>
      body{font-family:Arial,sans-serif;color:#1e293b;margin:40px;max-width:760px}
      h1{color:#4f46e5;border-bottom:3px solid #4f46e5;padding-bottom:8px}
      h2{color:#334155;margin-top:28px;font-size:15px;text-transform:uppercase;letter-spacing:.05em}
      .cards{display:flex;gap:12px;margin:16px 0}
      .card{flex:1;background:#eef2ff;border-radius:12px;padding:14px}
      .card b{display:block;font-size:26px;color:#312e81}
      .card span{font-size:11px;color:#64748b;text-transform:uppercase}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{background:#f1f5f9;text-align:left;padding:8px;font-size:11px;text-transform:uppercase;color:#64748b}
      td{border-bottom:1px solid #e2e8f0;padding:8px}
      pre.ai{white-space:pre-wrap;font-family:Arial;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;font-size:13px}
      .foot{margin-top:30px;font-size:11px;color:#94a3b8}
    </style></head><body>
      <h1>🧠 Rolo Team — AI Performance Report</h1>
      <p><b>${esc(reportData.title || 'Report')}</b> • ${new Date().toLocaleString()}</p>
      ${stats}${metrics}${users}${insights}
      <p class="foot">Generated by Rolo Team Dashboard — team.rologicsinfolabs.com</p>
      <script>setTimeout(function(){window.print()},400)<\/script>
    </body></html>`)
    w.document.close()
  }

  const downloadReport = () => {
    if (!reportData) return
    const lines = []
    lines.push('Rolo Team Performance Report')
    lines.push('============================')
    lines.push('Title: ' + (reportData.title || 'Generated Report'))
    lines.push('Type: ' + reportData.type)
    lines.push('Generated: ' + (reportData.generatedAt || new Date().toISOString()))
    lines.push('Team: ' + (teamFilter === 'all' ? 'All Teams' : teamFilter))
    lines.push('Period: ' + (dateFrom || 'N/A') + ' to ' + (dateTo || 'N/A'))
    lines.push('')
    lines.push('EXECUTIVE SUMMARY')
    lines.push('-----------------')
    lines.push('Total Entries: ' + (reportData.totalEntries ?? 0))
    lines.push('Total Value: ' + (reportData.totalValue ?? 0))
    lines.push('Recent Activity (30 days): ' + (reportData.recentCount ?? 0))
    lines.push('')
    lines.push('PERFORMANCE BY METRIC')
    lines.push('---------------------')
    ;(reportData.metricList || []).forEach((m) => {
      lines.push('- ' + m.metric + ': ' + m.total + ' total (' + m.count + ' entries, avg: ' + m.avg + ')')
    })
    lines.push('')
    lines.push('PERFORMANCE BY TEAM')
    lines.push('-------------------')
    ;(reportData.teamList || []).forEach((t) => {
      lines.push('- ' + t.team + ': ' + t.total + ' total (' + t.count + ' entries)')
    })
    lines.push('')
    lines.push('TOP PERFORMERS')
    lines.push('--------------')
    ;(reportData.userList || [])
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .forEach((u) => {
        lines.push('- ' + u.name + ' (' + u.team + '): ' + u.total + ' total, ' + u.count + ' entries, avg: ' + u.avg)
      })
    lines.push('')
    lines.push('AI INSIGHTS')
    lines.push('-----------')
    lines.push(reportData.aiInsights || 'No AI insights available')
    lines.push('')
    lines.push('---')
    lines.push('Generated by Rolo Team Dashboard - team.rologicsinfolabs.com')

    const content = lines.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rolo-report-' + new Date().toISOString().slice(0, 10) + '.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const isLeader = user.role === 'manager' || user.role === 'ceo' || user.role === 'team_lead'

  return (
    <Layout user={user}>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Reports</h1>
              <p className="text-slate-600 text-sm">Generate intelligent performance reports</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3">
            <Info className="w-4 h-4 text-red-600 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Generate New Report</h3>

          {/* Step 1 - Report type: stacked on mobile, 4-up on larger screens */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-3">1. Report Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {reportTypes.map((rt) => {
                const Icon = rt.icon
                const active = reportType === rt.value
                return (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => setReportType(rt.value)}
                    className={
                      'flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium border transition-all text-left ' +
                      (active
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50')
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="leading-tight">{rt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step legend (fallback hidden) */}
          {/* Step: Individual member picker (leaders, individual_performance only) */}
          {isLeader && reportType === 'individual_performance' && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-3">Member</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full px-3 py-3 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All members (summary of everyone)</option>
                {membersList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.team ? '• ' + (m.team === 'rolo-core' ? 'Core' : m.team === 'rolo-edge' ? 'Edge' : '') : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 2 - Team filter (leaders only) */}
          {isLeader && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-3">2. Team</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {teams.map((t) => {
                  const active = teamFilter === t.value
                  const activeColor =
                    t.value === 'rolo-core'
                      ? 'bg-blue-600 border-transparent text-white'
                      : t.value === 'rolo-edge'
                      ? 'bg-purple-600 border-transparent text-white'
                      : 'bg-slate-700 border-transparent text-white'
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTeamFilter(t.value)}
                      className={
                        'flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium border transition-all ' +
                        (active ? activeColor : 'border-slate-200 text-slate-600 hover:bg-slate-50')
                      }
                    >
                      <span
                        className={
                          'w-2 h-2 rounded-full ' +
                          (t.value === 'rolo-core'
                            ? 'bg-blue-400'
                            : t.value === 'rolo-edge'
                            ? 'bg-purple-400'
                            : 'bg-slate-400')
                        }
                      />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3 - Date range + generate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
              />
            </div>
          </div>

          <button
            onClick={generateReport}
            disabled={generating}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating AI Report...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Generate Report
              </>
            )}
          </button>
        </div>

        {reportData && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Report Results</h3>
                <p className="text-sm text-slate-500">Generated for {user.name}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportExcel}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </button>
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                >
                  <Printer className="w-4 h-4" /> PDF / Print
                </button>
                <button
                  onClick={shareWhatsApp}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
                <button
                  onClick={shareEmail}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                >
                  <Mail className="w-4 h-4" /> Email
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase">Total Entries</p>
                <p className="text-2xl font-bold text-slate-900">{reportData.totalEntries ?? 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                <p className="text-xs font-bold text-green-600 uppercase">Total Value</p>
                <p className="text-2xl font-bold text-slate-900">{reportData.totalValue ?? 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                <p className="text-xs font-bold text-purple-600 uppercase">Recent Activity</p>
                <p className="text-2xl font-bold text-slate-900">{reportData.recentCount ?? 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-xs font-bold text-amber-600 uppercase">Top Performer</p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {(reportData.userList || []).sort((a, b) => b.total - a.total)[0]?.name || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h4 className="text-sm font-bold text-slate-700 mb-4">AI Insights</h4>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <div className="text-slate-600 whitespace-pre-line">
                    {reportData.aiInsights || 'No insights available'}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-4">Metrics Breakdown</h4>
                <div className="space-y-3">
                  {(reportData.metricList || []).map((m) => {
                    const pct = Math.min((m.total / Math.max(1, reportData.totalValue)) * 100, 100)
                    return (
                      <div key={m.metric} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{String(m.metric || '').split(/[-_]/).map((w) => w && w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                          <span className="text-sm font-bold text-slate-900">{m.total}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="h-2 rounded-full bg-indigo-600" style={{ width: pct + '%' }} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {m.count} entries \u2022 Avg: {m.avg}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Report History</h3>

          {/* Mobile: card list */}
          <div className="md:hidden space-y-3">
            {reports.slice(0, 10).map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                  <button
                    onClick={() => downloadSaved(r)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap"
                  >
                    Download
                  </button>
                </div>
                <p className="text-xs text-slate-500 capitalize">
                  {r.type} • {r.team || 'All'} • {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            {reports.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                No reports generated yet. Create your first AI report above.
              </p>
            )}
          </div>

          {/* Tablet/Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Title</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Team</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase text-right">Generated</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 10).map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 text-sm text-slate-800">{r.title}</td>
                    <td className="py-3 text-sm text-slate-600 capitalize">{r.type}</td>
                    <td className="py-3 text-sm text-slate-600 capitalize">{r.team || 'All'}</td>
                    <td className="py-3 text-sm text-slate-500 text-right">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => downloadSaved(r)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No reports generated yet. Create your first AI report above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
