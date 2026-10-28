import { getSessionFromReq, ROLES, canViewAllReports } from '../../lib/auth'
import { getTargets, getTargetMember, getUsers, getPerformance, setTarget, createNotification, getProjects } from '../../lib/db'

// Real project name when known ("HPE"), else titled slug ("Monthly Events QA")
function prettyMetric(slug) {
  const p = getProjects().find((x) => x.slug === slug)
  return p ? p.name : String(slug || '').split(/[-_]/).map((w) => w && w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// Weekly targets.
// GET:
//   leaders -> targets for their scope + computed progress for the current week
//   members -> their own target for the current week (+ progress)
// POST (assign): CEO/Manager any team member; Team Lead own team only.

function weekStartStr() {
  const d = new Date()
  const day = d.getDay() // 0 Sun
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7))
  return monday.toISOString().slice(0, 10)
}

export default async function handler(req, res) {
  const session = getSessionFromReq(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  const users = getUsers()
  const ws = weekStartStr()

  const withProgress = (t) => {
    const entries = getPerformance().filter(
      (e) => e.userId === t.memberId && (t.weekStart || '') <= e.date && e.date <= new Date().toISOString().slice(0, 10)
    )
    // if the target is from an older week, count that week's range
    const scoped = t.weekStart
      ? entries.filter((e) => e.date >= t.weekStart && e.date <= daysAfter(t.weekStart, 6))
      : entries
    const matching = scoped.filter((e) => e.metric === t.metric)
    // Hierarchy rule: only approved entries count toward the target
    const done = matching.filter((e) => e.status === 'approved').reduce((s, e) => s + (e.value || 0), 0)
    return { ...t, done: done, pct: Math.min(100, Math.round((done / Math.max(1, t.targetValue)) * 100)), openCount: matching.filter((e) => e.status === 'pending').length }
  }

  if (req.method === 'GET') {
    const all = getTargets()
    if (session.role === ROLES.CEO || session.role === ROLES.MANAGER) {
      const list = all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 60).map(withProgress)
      return res.status(200).json({ targets: list, weekStart: ws })
    }
    if (session.role === ROLES.TEAM_LEAD || session.role === ROLES.ASSISTING_LEAD) {
      const teamIds = users.filter((u) => u.team === session.team).map((u) => u.id)
      const list = all.filter((t) => teamIds.includes(t.memberId)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 60).map(withProgress)
      return res.status(200).json({ targets: list, weekStart: ws })
    }
    // member: own targets
    const list = all.filter((t) => t.memberId === session.id).sort((a, b) => (a.weekStart > b.weekStart ? -1 : 1)).slice(0, 8).map(withProgress)
    const current = (getTargetMember(session.id, ws) ? [withProgress(getTargetMember(session.id, ws))] : list.slice(0, 1))
    return res.status(200).json({ targets: current.length ? current : list, weekStart: ws })
  }

  if (req.method === 'POST') {
    if (!(session.role === ROLES.CEO || session.role === ROLES.MANAGER || session.role === ROLES.TEAM_LEAD)) {
      return res.status(403).json({ error: 'Forbidden: leaders only' })
    }
    const { memberId, metric, targetValue, weekStart } = req.body || {}
    if (!memberId || !metric || !targetValue) return res.status(400).json({ error: 'memberId, metric, targetValue required' })
    const target = users.find((u) => u.id === memberId)
    if (!target) return res.status(404).json({ error: 'Member not found' })
    if (target.role === ROLES.CEO || target.role === ROLES.MANAGER) return res.status(403).json({ error: 'Invalid target member' })
    if (session.role === ROLES.TEAM_LEAD && target.team !== session.team) {
      return res.status(403).json({ error: 'Forbidden: own team only' })
    }
    const t = setTarget({
      memberId,
      metric,
      targetValue: Number(targetValue),
      weekStart: weekStart || ws,
      assignedBy: session.id,
    })
    createNotification({
      userIds: [memberId],
      title: 'New Weekly Target Assigned',
      message: prettyMetric(metric) + ' target: ' + Number(targetValue) + ' for week of ' + (t.weekStart || ws),
      type: 'target',
    })
    return res.status(201).json({ target: t })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

function daysAfter(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
