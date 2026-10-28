import { getSessionFromReq, ROLES, hashPassword } from '../../lib/auth'
import { getUsers, updateUser, deleteUser, getPerformance, deletePerformanceEntry, getReports, deleteReport, getProfiles, deleteProfile } from '../../lib/db'

// Admin endpoint for user management.
// DELETE — remove an employee: CEO and MANAGER only, never CEO/MANAGER accounts.
// PATCH  — reset password: CEO/Manager for anyone; Team Lead only for own team members.

export default async function handler(req, res) {
  const session = getSessionFromReq(req)
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const users = await getUsers()

  if (req.method === 'DELETE') {
    // HARD RULE: only CEO and Manager can remove employees
    if (session.role !== ROLES.CEO && session.role !== ROLES.MANAGER) {
      return res.status(403).json({ error: 'Forbidden: only CEO and Manager can remove employees' })
    }
    const { id } = req.query
    const target = users.find((u) => u.id === id)
    if (!target) return res.status(404).json({ error: 'User not found' })
    if (target.role === ROLES.CEO || target.role === ROLES.MANAGER) {
      return res.status(403).json({ error: 'CEO and Manager accounts cannot be removed' })
    }

    // Remove the user's data so stats stay consistent
    const entries = (await getPerformance()).filter((e) => e.userId === id)
    for (const e of entries) await deletePerformanceEntry(e.id)

    const reports = (await getReports()).filter((r) => r.userId === id)
    for (const r of reports) await deleteReport(r.id)

    await deleteUser(id)

    // Remove the matching profile
    const profile = (await getProfiles() || []).find((p) => p.userId === id)
    if (profile) await deleteProfile(profile.id)

    return res.status(200).json({ ok: true, removedEntries: entries.length })
  }

  if (req.method === 'PATCH') {
    const { userId, newPassword } = req.body || {}
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'userId and newPassword required' })
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const target = users.find((u) => u.id === userId)
    if (!target) return res.status(404).json({ error: 'User not found' })

    if (session.role === ROLES.CEO || session.role === ROLES.MANAGER) {
      // CEO/Manager can reset anyone except CEO/Manager accounts
      if (target.role === ROLES.CEO || target.role === ROLES.MANAGER) {
        return res.status(403).json({ error: 'CEO and Manager passwords cannot be reset here' })
      }
    } else if (session.role === ROLES.TEAM_LEAD) {
      // Team Lead can only reset passwords of members in their own team
      if (target.team !== session.team) {
        return res.status(403).json({ error: 'Forbidden: you can only reset passwords in your own team' })
      }
      if (target.role === ROLES.CEO || target.role === ROLES.MANAGER) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    } else {
      return res.status(403).json({ error: 'Forbidden: only CEO, Manager, or Team Lead can reset passwords' })
    }

    await updateUser(userId, { passwordHash: hashPassword(newPassword) })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
