import { getSessionFromReq, ROLES, TEAMS, TEAM_LABELS } from '../../lib/auth'
import { getUsers } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = getSessionFromReq(req)
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const users = await getUsers()

  const teams = Object.values(TEAMS).map((teamCode) => {
    const members = users.filter((u) => u.team === teamCode && u.role !== ROLES.CEO && u.role !== ROLES.MANAGER)
    const lead = members.find((u) => u.role === ROLES.TEAM_LEAD)
    const assisting = members.find((u) => u.role === ROLES.ASSISTING_LEAD)
    return {
      code: teamCode,
      name: TEAM_LABELS[teamCode] || teamCode,
      lead,
      assistingLead: assisting,
      memberCount: members.filter((u) => u.role === ROLES.MEMBER).length,
      totalMembers: members.length,
    }
  })

  return res.status(200).json({ teams })
}
