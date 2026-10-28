import { getSessionFromReq, ROLES } from '../../lib/auth'
import { getProjects, createProject, slugify } from '../../lib/db'

export default async function handler(req, res) {
  const session = getSessionFromReq(req)
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  // GET — everyone (incl. members) gets the projects they can log entries against.
  // Members / leads see global projects + their own team's projects.
  // CEO & Manager see everything, incl. team-specific ones.
  if (req.method === 'GET') {
    const all = await getProjects()
    const visible = all.filter((p) => {
      if (!p.team) return true // global project
      if (session.role === ROLES.CEO || session.role === ROLES.MANAGER) return true
      return p.team === session.team
    })
    return res.status(200).json({ projects: visible })
  }

  // POST — Team Lead can add projects for their OWN team only.
  // Manager / CEO can add for any team or global (team omitted/null).
  // Members cannot add projects.
  if (req.method === 'POST') {
    const { name, team } = req.body || {}
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Project name is required' })
    }
    if (String(name).trim().length > 60) {
      return res.status(400).json({ error: 'Project name is too long (max 60 chars)' })
    }

    const canAdd =
      session.role === ROLES.TEAM_LEAD ||
      session.role === ROLES.ASSISTING_LEAD ||
      session.role === ROLES.MANAGER ||
      session.role === ROLES.CEO
    if (!canAdd) {
      return res.status(403).json({ error: 'Only team leads and above can add projects' })
    }

    // Team lead / assisting lead → forced to their own team
    let projectTeam = team || null
    if (session.role === ROLES.TEAM_LEAD || session.role === ROLES.ASSISTING_LEAD) {
      projectTeam = session.team
    } else if (projectTeam) {
      // Manager/CEO may specify a team; normalize the label
      const t = String(projectTeam).toLowerCase()
      projectTeam = t.includes('edge') ? 'rolo-edge' : t.includes('core') ? 'rolo-core' : null
      if (projectTeam === 'null') projectTeam = null
    }

    const trimmed = String(name).trim()
    const slug = slugify(trimmed)
    const existing = (await getProjects()).find((p) => p.slug === slug)
    if (existing) {
      return res.status(409).json({ error: 'That project already exists', project: existing })
    }

    const project = await createProject({
      name: trimmed,
      team: projectTeam,
      createdBy: session.id,
    })
    return res.status(201).json({ project })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
