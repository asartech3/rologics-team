import { getSessionFromReq, ROLES, canViewAllReports } from '../../lib/auth'
import { getPerformance, getUsers, getProjects } from '../../lib/db'

// Prefer the real project name ("HPE") over the raw slug ("hpe")
function prettyMetric(projects, slug) {
  const p = projects.find((x) => x.slug === slug)
  return p ? p.name : String(slug || '').split(/[-_]/).map((w) => w && w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = getSessionFromReq(req)
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const entries = await getPerformance()
  const users = await getUsers()

  // CEO and Manager see all; Team Lead sees their team; Members see only their own
  let filtered = entries
  if (canViewAllReports(session)) {
    // see all
  } else if (session.role === ROLES.TEAM_LEAD || session.role === ROLES.ASSISTING_LEAD) {
    filtered = filtered.filter((e) => e.team === session.team)
  } else {
    filtered = filtered.filter((e) => e.userId === session.id)
  }

  // Hierarchy rule: only APPROVED entries count in stats.
  // Pending entries stay invisible to all aggregates until a leader approves.
  const approved = filtered.filter((e) => e.status === 'approved')
  const pendingCount = filtered.filter((e) => e.status === 'pending').length

  // Aggregate by metric
  const projects = await getProjects()
  const byMetric = {}
  approved.forEach((e) => {
    if (!byMetric[e.metric]) byMetric[e.metric] = { count: 0, total: 0 }
    byMetric[e.metric].count += 1
    byMetric[e.metric].total += e.value || 0
  })

  const metricList = Object.entries(byMetric).map(([metric, data]) => ({
    metric: prettyMetric(projects, metric),
    count: data.count,
    total: data.total,
    avg: data.count ? Math.round((data.total / data.count) * 100) / 100 : 0,
  }))

  // Aggregate by team
  const byTeam = {}
  approved.forEach((e) => {
    if (!byTeam[e.team]) byTeam[e.team] = { count: 0, total: 0 }
    byTeam[e.team].count += 1
    byTeam[e.team].total += e.value || 0
  })

  const teamList = Object.entries(byTeam).map(([team, data]) => ({
    team,
    count: data.count,
    total: data.total,
  }))

  // Aggregate by user
  const byUser = {}
  approved.forEach((e) => {
    const user = users.find((u) => u.id === e.userId)
    const key = e.userId
    if (!byUser[key]) {
      byUser[key] = { name: user ? user.name : 'Unknown', team: e.team, count: 0, total: 0 }
    }
    byUser[key].count += 1
    byUser[key].total += e.value || 0
  })

  const userList = Object.entries(byUser).map(([userId, data]) => ({
    userId,
    name: data.name,
    team: data.team,
    count: data.count,
    total: data.total,
    avg: data.count ? Math.round((data.total / data.count) * 100) / 100 : 0,
  }))

  // Recent entries (last 30 days, approved only)
  const now = new Date()
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const recent = approved.filter((e) => new Date(e.date) >= last30)

  // Performance trend (last 14 days by date, approved only)
  const trend = {}
  approved.forEach((e) => {
    trend[e.date] = (trend[e.date] || 0) + (e.value || 0)
  })
  const trendList = Object.entries(trend)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([date, value]) => ({ date, value }))

  return res.status(200).json({
    totalEntries: approved.length,
    totalValue: approved.reduce((sum, e) => sum + (e.value || 0), 0),
    pendingCount: pendingCount,
    recentCount: recent.length,
    metricList,
    teamList,
    userList,
    trendList,
  })
}
