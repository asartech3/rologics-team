import { getSessionFromReq, ROLES, canViewAllReports } from '../../lib/auth'
import { getPerformance, getUsers, createReport, getReports } from '../../lib/db'

export default async function handler(req, res) {
  const session = getSessionFromReq(req)
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  if (req.method === 'GET') {
    let reports = getReports()
    // CEO, Manager, Team Lead see all reports; Members see only their own
    if (!canViewAllReports(session)) {
      reports = reports.filter((r) => r.userId === session.id)
    }
    reports = reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return res.status(200).json({ reports })
  }

  if (req.method === 'POST') {
    const { title, type, team, dateFrom, dateTo, aiInsights, data } = req.body || {}
    if (!title || !type) {
      return res.status(400).json({ error: 'title and type required' })
    }

    // CEO, Manager, Team Lead can generate reports for any team; Members for themselves
    const reportTeam = canViewAllReports(session) ? (team || null) : session.team

    const report = createReport({
      userId: session.id,
      team: reportTeam,
      title,
      type,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      aiInsights: aiInsights || '',
      data: data || {},
      status: 'generated',
    })

    return res.status(201).json({ report })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
