import { getSessionFromReq, ROLES, canViewAllReports, canViewTeamReports } from '../../lib/auth'
import { getPerformance, getPerformanceById, createPerformanceEntry, updatePerformanceEntry, deletePerformanceEntry, getUsers, createNotification, getProjects } from '../../lib/db'

// Real project name when known ("HPE"), else titled slug ("Monthly Events QA")
function prettyMetric(projects, slug) {
  const p = projects.find((x) => x.slug === slug)
  return p ? p.name : String(slug || '').split(/[-_]/).map((w) => w && w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default async function handler(req, res) {
  const session = getSessionFromReq(req)
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const projects = await getProjects()

  if (req.method === 'GET') {
    let entries = await getPerformance()
    const { team, userId, metric, dateFrom, dateTo } = req.query

    // CEO and Manager see all teams; Team Lead sees their team; Members see only their own
    if (canViewAllReports(session)) {
      if (team) entries = entries.filter((e) => e.team === team)
    } else if (session.role === ROLES.TEAM_LEAD || session.role === ROLES.ASSISTING_LEAD) {
      entries = entries.filter((e) => e.team === session.team)
    } else {
      entries = entries.filter((e) => e.userId === session.id)
    }

    if (userId) entries = entries.filter((e) => e.userId === userId)
    if (metric) entries = entries.filter((e) => e.metric === metric)
    if (dateFrom) entries = entries.filter((e) => e.date >= dateFrom)
    if (dateTo) entries = entries.filter((e) => e.date <= dateTo)

    entries = entries.sort((a, b) => new Date(b.date) - new Date(a.date))

    return res.status(200).json({ entries })
  }

  if (req.method === 'POST') {
    const { metric, value, date, notes, team, category, userId } = req.body || {}
    if (!metric || value === undefined || !date) {
      return res.status(400).json({ error: 'metric, value, date required' })
    }

    // Hierarchy: an entry only affects stats after a leader approves it.
    // Leaders may log an entry on behalf of a member who is on leave.
    const isCEOorMgr = session.role === ROLES.CEO || session.role === ROLES.MANAGER
    let entryUserId = session.id
    let entryTeam
    let onBehalf = false

    if (userId && userId !== session.id) {
      if (!(isCEOorMgr || session.role === ROLES.TEAM_LEAD)) {
        return res.status(403).json({ error: 'Forbidden: only leaders can log entries on behalf of members' })
      }
      const users = await getUsers()
      const target = users.find((u) => u.id === userId)
      if (!target) return res.status(404).json({ error: 'Member not found' })
      if (target.role === ROLES.CEO || target.role === ROLES.MANAGER) {
        return res.status(403).json({ error: 'Invalid member for on-behalf entries' })
      }
      if (session.role === ROLES.TEAM_LEAD) {
        if (target.team !== session.team) {
          return res.status(403).json({ error: 'Forbidden: you can only log entries for your own team' })
        }
        entryTeam = target.team
      } else {
        entryTeam = team || target.team
      }
      entryUserId = userId
      onBehalf = true
    } else {
      entryTeam = canViewAllReports(session) ? (team || session.team || null) : session.team
    }

    if (!entryTeam) {
      return res.status(400).json({ error: 'Team required' })
    }

    const entry = await createPerformanceEntry({
      userId: entryUserId,
      team: entryTeam,
      metric,
      value: Number(value),
      date,
      notes: notes || '',
      category: category || 'general',
      status: 'pending',
      workDescription: workDescription || '',
    })

    // Notify the leaders who can approve this entry
    const users = await getUsers()
    const approvers = users.filter(
      (u) => u.id !== entryUserId && (
        u.role === ROLES.CEO || u.role === ROLES.MANAGER ||
        (u.role === ROLES.TEAM_LEAD && u.team === entryTeam)
      )
    )
    if (approvers.length) {
      await createNotification({
        userIds: approvers.map((u) => u.id),
        title: onBehalf ? 'Entry Logged On Behalf' : 'New Performance Entry',
        message: onBehalf
          ? session.name + ' logged ' + prettyMetric(projects, metric) + ' on behalf of ' + (users.find((u) => u.id === entryUserId) || {}).name + ' — awaiting approval'
          : session.name + ' logged ' + prettyMetric(projects, metric) + ' — awaiting approval',
        type: 'entry',
      })
    }
    // Tell the member when someone logged it for them
    if (onBehalf) {
      const member = users.find((u) => u.id === entryUserId)
      if (member) {
        await createNotification({
          userIds: [entryUserId],
          title: 'Entry Logged For You',
          message: session.name + ' logged ' + prettyMetric(projects, metric) + ' on your behalf — it counts once a leader approves it',
          type: 'entry',
        })
      }
    }

    return res.status(201).json({ entry })
  }

  if (req.method === 'PUT') {
    const { id, ...updates } = req.body || {}
    const existing = await getPerformanceById(id)
    if (!existing) return res.status(404).json({ error: 'Not found' })

    const isCEOOrManager = session.role === ROLES.CEO || session.role === ROLES.MANAGER
    const isLeadOfTeam = session.role === ROLES.TEAM_LEAD && existing.team === session.team
    const isOwner = existing.userId === session.id

    // Assisting Leads canNOT approve entries — read-only for leadership review
    const allowed = isCEOOrManager || isLeadOfTeam || (isOwner && session.role !== ROLES.ASSISTING_LEAD)
    if (!allowed) return res.status(403).json({ error: 'Forbidden' })

    // Approval workflow: only CEO, Manager, Team Lead can change status
    let cleanUpdates = updates
    if ('status' in updates) {
      if (!(isCEOOrManager || isLeadOfTeam)) cleanUpdates = { ...updates, status: 'pending' }
    }

    const updated = await updatePerformanceEntry(id, cleanUpdates)

    // Notify the member when a leader reviews their entry
    if ('status' in cleanUpdates && (isCEOOrManager || isLeadOfTeam) && existing.userId !== session.id) {
      const statusNote =
        cleanUpdates.status === 'approved' ? 'approved your entry' :
        cleanUpdates.status === 'rejected' ? 'rejected your entry' : 'reviewed your entry'
      await createNotification({
        userIds: [existing.userId],
        title: 'Entry ' + (cleanUpdates.status || 'reviewed').charAt(0).toUpperCase() + (cleanUpdates.status || '').slice(1),
        message: session.name + ' ' + statusNote,
        type: 'review',
      })
    }

    return res.status(200).json({ entry: updated })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const existing = await getPerformanceById(id)
    if (!existing) return res.status(404).json({ error: 'Not found' })

    const allowed =
      session.role === ROLES.CEO ||
      session.role === ROLES.MANAGER ||
      session.role === ROLES.TEAM_LEAD ||
      existing.userId === session.id

    if (!allowed) return res.status(403).json({ error: 'Forbidden' })

    await deletePerformanceEntry(id)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
