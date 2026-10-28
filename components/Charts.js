import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts'

const COLORS = ['#2563eb', '#7c3aed', '#047857', '#b45309', '#be185d', '#0891b2', '#84cc16', '#f59e0b']

const RADIUS = [0, 6, 6, 0]

export function TeamPerformanceChart({ entries }) {
  const byTeam = entries.reduce((acc, e) => {
    if (!acc[e.team]) acc[e.team] = { count: 0, total: 0 }
    acc[e.team].count += 1
    acc[e.team].total += e.value || 0
    return acc
  }, {})

  const data = Object.entries(byTeam).map(([team, stats]) => ({
    team: team === 'rolo-core' ? 'Rolo Core' : 'Rolo Edge',
    value: stats.total,
    color: team === 'rolo-core' ? '#2563eb' : '#7c3aed',
  }))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Team Performance Comparison</h3>
        <div className="flex gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span className="text-xs text-slate-500">Rolo Core</span>
          <span className="w-2 h-2 rounded-full bg-purple-600" />
          <span className="text-xs text-slate-500">Rolo Edge</span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize="30">
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="team" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} hide />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                      <p className="text-xs font-bold text-slate-700">{payload[0].payload.team}</p>
                      <p className="text-sm text-slate-500">Total Value: {payload[0].payload.value}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />
            {data.map((entry, idx) => (
              <Bar key={entry.team} dataKey="value" fill={entry.color} radius={RADIUS} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function PerformanceTrendChart({ entries }) {
  const byDate = entries.reduce((acc, e) => {
    acc[e.date] = (acc[e.date] || 0) + (e.value || 0)
    return acc
  }, {})

  const data = Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([date, value]) => ({ date, value }))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Performance Trend (14 Days)</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} hide />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                      <p className="text-xs font-bold text-slate-700">{payload[0].payload.date}</p>
                      <p className="text-sm text-slate-500">Total: {payload[0].payload.value}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#7c3aed"
              strokeWidth={3}
              dot
              strokeDasharray="4 2"
            />
            <Area type="monotone" dataKey="value" fill="url(#colorGradient)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function MetricDonutChart({ entries, title }) {
  const pretty = (m) => (m || '')
    .split(/[-_]/)
    .map((w) => w && w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const byMetric = entries.reduce((acc, e) => {
    if (!acc[e.metric]) acc[e.metric] = 0
    acc[e.metric] += e.value || 0
    return acc
  }, {})

  const data = Object.entries(byMetric).map(([metric, value]) => ({
    metric: pretty(metric),
    value,
  }))

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">{title}</h3>
      <div className="flex-1 flex items-center justify-center">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={data}
              cx={100}
              cy={100}
              outerRadius={80}
              fill="#8884d8"
              label
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{total}</div>
          <div className="text-xs text-slate-500">Total Value</div>
        </div>
      </div>
    </div>
  )
}

export function UserPerformanceBarChart({ entries, users }) {
  const byUser = {}
  entries.forEach((e) => {
    const user = users.find((u) => u.id === e.userId)
    if (!byUser[e.userId]) {
      byUser[e.userId] = { name: user ? user.name : 'Unknown', total: 0, count: 0 }
    }
    byUser[e.userId].total += e.value || 0
    byUser[e.userId].count += 1
  })

  const data = Object.values(byUser)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Top Performers</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize="25" layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <YAxis dataKey="name" axisLine={false} tickLine={false} width={100} />
            <XAxis axisLine={false} tickLine={false} hide />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#047857" radius={RADIUS} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="stat-card p-6 rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-200">
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="h-px bg-slate-100 mt-4" />
    </div>
  )
}

export { COLORS }
