import { getSessionFromReq, ROLES, canViewAllReports, canViewTeamReports } from '../../lib/auth'
import { getUsers, getProfiles } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = getSessionFromReq(req)
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const users = getUsers()
  const profiles = getProfiles()
  const { team, includeSelf } = req.query

  let filtered = users.filter((u) => u.role !== ROLES.CEO && u.role !== ROLES.MANAGER)

  // Always include the requesting user's own record when requested (for profile page)
  const self = users.find((u) => u.id === session.id)

  // CEO and Manager can see all teams
  if (canViewAllReports(session)) {
    if (team) filtered = filtered.filter((u) => u.team === team)
  }
  // Team Lead and Assisting Lead see only their own team
  else if (session.role === ROLES.TEAM_LEAD || session.role === ROLES.ASSISTING_LEAD) {
    filtered = filtered.filter((u) => u.team === session.team)
  }
  // Members see only themselves
  else {
    filtered = filtered.filter((u) => u.id === session.id)
  }

  // Ensure own record is present when explicitly requested (leaders are excluded from the base list)
  if (includeSelf === '1' && self && !filtered.some((u) => u.id === self.id)) {
    filtered = [...filtered, self]
  }

  const members = filtered.map((u) => {
    const profile = profiles.find((p) => p.userId === u.id)
    return { ...u, profile }
  })

  return res.status(200).json({ members })
}
