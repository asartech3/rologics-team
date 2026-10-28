import { getUserByEmployeeId, comparePassword } from '../../../lib/db'
import { comparePassword as cmp, signToken, setAuthCookie } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { employeeId, password } = req.body || {}
  if (!employeeId || !password) {
    return res.status(400).json({ error: 'Employee ID and password required' })
  }

  const user = getUserByEmployeeId(employeeId)
  if (!user || !(await cmp(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = signToken({
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team,
  })

  setAuthCookie(res, token)

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
