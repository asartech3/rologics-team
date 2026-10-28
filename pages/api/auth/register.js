import { getSessionFromReq, canAddMembers, hashPassword, ROLES, TEAMS } from '../../../lib/auth'
import { getUserByEmployeeId, createUser } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = getSessionFromReq(req)
  if (!session || !canAddMembers(session)) {
    return res.status(403).json({ error: 'Forbidden: CEO, Manager, or Team Lead only' })
  }

  const { employeeId, password, name, email, role, team } = req.body || {}
  if (!employeeId || !name || !role) {
    return res.status(400).json({ error: 'employeeId, name, role required' })
  }

  if (await getUserByEmployeeId(employeeId)) {
    return res.status(409).json({ error: 'Employee ID already exists' })
  }

  let finalTeam = team

  if (session.role === ROLES.TEAM_LEAD) {
    finalTeam = session.team
    if (String(role).toLowerCase() === 'manager' || String(role).toLowerCase() === 'ceo') {
      return res.status(403).json({ error: 'Cannot create manager or CEO accounts' })
    }
  }

  // Normalize incoming values to the canonical slugs so new users match
  // seeded users' role/team comparisons (e.g. 'Member'→'member', 'Rolo Edge'→'rolo-edge')
  const roleMap = {
    'ceo': ROLES.CEO, 'manager': ROLES.MANAGER,
    'team lead': ROLES.TEAM_LEAD, 'team_lead': ROLES.TEAM_LEAD,
    'assisting lead': ROLES.ASSISTING_LEAD, 'assisting_lead': ROLES.ASSISTING_LEAD,
    'member': ROLES.MEMBER,
  }
  const cleanRole = roleMap[String(role).toLowerCase()]
  if (!cleanRole) return res.status(400).json({ error: 'Invalid role' })
  const teamMap = {
    'rolo edge': TEAMS.EDGE, 'rolo-edge': TEAMS.EDGE,
    'rolo core': TEAMS.CORE, 'rolo-core': TEAMS.CORE,
    'unassigned': null,
  }
  const cleanTeam = finalTeam === undefined || finalTeam === null ? null
    : (teamMap[String(finalTeam).toLowerCase().trim()] !== undefined
      ? teamMap[String(finalTeam).toLowerCase().trim()]
      : finalTeam)

  const autoPassword = password || `Rolo${Math.floor(1000 + Math.random() * 9000)}!`

  const user = await createUser({
    employeeId,
    passwordHash: hashPassword(autoPassword),
    name,
    email: email || `${employeeId.toLowerCase()}@rologicsinfolabs.com`,
    role: cleanRole,
    team: cleanTeam,
  })

  return res.status(201).json({
    user: {
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team,
    },
    autoPassword,
  })
}
