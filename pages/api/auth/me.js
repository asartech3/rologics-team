import { getSessionFromReq } from '../../../lib/auth'
import { getUserById } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = getSessionFromReq(req)
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const user = getUserById(session.id)
  if (!user) {
    return res.status(401).json({ error: 'User not found' })
  }

  return res.status(200).json({
    user: {
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team,
    },
  })
}
