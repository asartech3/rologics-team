import { hashPassword, comparePassword, signToken, verifyToken } from './crypto.js'

export { hashPassword, comparePassword, signToken, verifyToken }

const COOKIE_NAME = 'rolo_token'

export function setAuthCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
  )
}

export function clearAuthCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
  )
}

export function getSessionFromReq(req) {
  const cookieHeader = req.headers.cookie || ''
  const match = cookieHeader.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]+)'))
  if (!match) return null
  return verifyToken(match[1])
}

export const ROLES = {
  CEO: 'ceo',
  MANAGER: 'manager',
  TEAM_LEAD: 'team_lead',
  ASSISTING_LEAD: 'assisting_lead',
  MEMBER: 'member',
}

export const TEAMS = {
  CORE: 'rolo-core',
  EDGE: 'rolo-edge',
}

export const ROLE_LABELS = {
  ceo: 'CEO',
  manager: 'Manager',
  team_lead: 'Team Lead',
  assisting_lead: 'Assisting Lead',
  member: 'Member',
}

export const ROLE_COLORS = {
  ceo: 'text-amber-600 bg-amber-50 border-amber-100',
  manager: 'text-blue-600 bg-blue-50 border-blue-100',
  team_lead: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  assisting_lead: 'text-purple-600 bg-purple-50 border-purple-100',
  member: 'text-green-600 bg-green-50 border-green-100',
}

export const TEAM_COLORS = {
  'rolo-core': 'text-blue-600 bg-blue-50 border-blue-100',
  'rolo-edge': 'text-indigo-600 bg-indigo-50 border-indigo-100',
}

export const TEAM_LABELS = {
  'rolo-core': 'Rolo Core',
  'rolo-edge': 'Rolo Edge',
}

// CEO and Manager can see ALL reports across both teams
export function canViewAllReports(user) {
  return user && (user.role === ROLES.CEO || user.role === ROLES.MANAGER)
}

// Team Lead can see their own team reports
export function canViewTeamReports(user) {
  return user && (user.role === ROLES.CEO || user.role === ROLES.MANAGER || user.role === ROLES.TEAM_LEAD)
}

export function canManageTeam(user) {
  return user && (user.role === ROLES.CEO || user.role === ROLES.MANAGER || user.role === ROLES.TEAM_LEAD)
}

export function canAddMembers(user) {
  return user && (user.role === ROLES.CEO || user.role === ROLES.MANAGER || user.role === ROLES.TEAM_LEAD)
}

export function canViewAllData(user) {
  return user && (user.role === ROLES.CEO || user.role === ROLES.MANAGER || user.role === ROLES.TEAM_LEAD)
}

export function canApprove(user) {
  return user && (user.role === ROLES.CEO || user.role === ROLES.MANAGER || user.role === ROLES.TEAM_LEAD)
}

export function getAccessibleTeams(user) {
  if (!user) return []
  if (user.role === ROLES.CEO || user.role === ROLES.MANAGER || user.role === ROLES.TEAM_LEAD) {
    return [TEAMS.CORE, TEAMS.EDGE]
  }
  if (user.team) return [user.team]
  return []
}
