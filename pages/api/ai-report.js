import { getSessionFromReq, ROLES, canViewAllReports, canViewTeamReports } from '../../lib/auth'
import { getPerformance, getUsers, getProfiles, getProjects } from '../../lib/db'

// Real project name when known ("HPE"), else titled slug ("Monthly Events QA")
function prettyMetric(projects, slug) {
  const p = (projects || []).find((x) => x.slug === slug)
  return p ? p.name : String(slug || '').split(/[-_]/).map((w) => w && w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = getSessionFromReq(req)
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { team, dateFrom, dateTo, type: reportType, memberId } = req.body || {}
  const type = reportType || 'team_performance'

  // Get performance data based on access level
  // CEO/Manager: all teams; Team Lead: their own team; Assisting Lead: their own team; Members: own data
  let entries = await getPerformance()
  if (canViewAllReports(session)) {
    if (team && team !== 'all') entries = entries.filter((e) => e.team === team)
  } else if (canViewTeamReports(session) || session.role === ROLES.ASSISTING_LEAD) {
    entries = entries.filter((e) => e.team === session.team)
  } else {
    entries = entries.filter((e) => e.userId === session.id)
  }

  if (dateFrom) entries = entries.filter((e) => e.date >= dateFrom)
  if (dateTo) entries = entries.filter((e) => e.date <= dateTo)

  // Hierarchy rule: only APPROVED entries go into reports.
  // Pending entries are awaiting leader approval and must not appear in any stats.
  const pendingCount = entries.filter((e) => e.status === 'pending').length
  const rejectedCount = entries.filter((e) => e.status === 'rejected').length
  entries = entries.filter((e) => e.status === 'approved')

  // Monthly Summary defaults to the current month when no dates given
  let dFrom = dateFrom
  let dTo = dateTo
  if (type === 'monthly_summary' && !dFrom && !dTo) {
    const now = new Date()
    dFrom = now.toISOString().slice(0, 8) + '01'
    dTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    entries = entries.filter((e) => e.date >= dFrom && e.date <= dTo)
  }

  // Individual Performance: optionally focus one member (leaders only)
  if (type === 'individual_performance' && memberId) {
    entries = entries.filter((e) => e.userId === memberId)
  }

  const users = await getUsers()
  const profiles = await getProfiles()
  const focusUserName = (type === 'individual_performance' && memberId)
    ? (users.find((u) => u.id === memberId) || {}).name || '' : null

  // Build data summary for AI
  const byMetric = {}
  const byTeam = {}
  const byUser = {}

  entries.forEach((e) => {
    const user = users.find((u) => u.id === e.userId)
    const profile = profiles.find((p) => p.userId === e.userId)

    // By metric
    if (!byMetric[e.metric]) byMetric[e.metric] = { count: 0, total: 0, entries: [] }
    byMetric[e.metric].count += 1
    byMetric[e.metric].total += e.value || 0
    byMetric[e.metric].entries.push({ ...e, userName: user ? user.name : 'Unknown' })

    // By team
    if (!byTeam[e.team]) byTeam[e.team] = { count: 0, total: 0 }
    byTeam[e.team].count += 1
    byTeam[e.team].total += e.value || 0

    // By user
    if (!byUser[e.userId]) {
      byUser[e.userId] = {
        name: user ? user.name : 'Unknown',
        team: e.team,
        count: 0,
        total: 0,
        designation: profile ? profile.designation : 'N/A',
        entries: [],
      }
    }
    byUser[e.userId].count += 1
    byUser[e.userId].total += e.value || 0
    byUser[e.userId].entries.push({ metric: e.metric, value: e.value, date: e.date })
  })

  const aiProjects = await getProjects()

  const metricList = Object.entries(byMetric).map(([metric, data]) => ({
    // real project name when known, else titled slug: "monthly-events-qa" → "Monthly Events QA"
    metric: prettyMetric(aiProjects, metric),
    count: data.count,
    total: data.total,
    avg: data.count ? Math.round((data.total / data.count) * 100) / 100 : 0,
  }))

  const teamList = Object.entries(byTeam).map(([teamName, data]) => ({
    team: teamName,
    count: data.count,
    total: data.total,
  }))

  const userList = Object.entries(byUser).map(([userId, data]) => ({
    userId,
    name: data.name,
    team: data.team,
    count: data.count,
    total: data.total,
    avg: data.count ? Math.round((data.total / data.count) * 100) / 100 : 0,
    designation: data.designation,
    entries: data.entries,
  }))

  const totalValue = entries.reduce((sum, e) => sum + (e.value || 0), 0)
  const totalEntries = entries.length

  // Generate AI insights using Groq — prompt tailored to the chosen report type
  let aiInsights = ''
  let reportTitle =
    type === 'individual_performance' ? 'Individual Performance Report'
    : type === 'monthly_summary' ? 'Monthly Summary'
    : type === 'comparative' ? 'Comparative Analysis'
    : 'Team Performance Report'
  if (type === 'individual_performance' && focusUserName) reportTitle += ' — ' + focusUserName
  try {
    const groqApiKey = process.env.GROQ_API_KEY
    if (groqApiKey) {
      const { Groq } = require('groq-sdk')
      const groq = new Groq({ apiKey: groqApiKey })

      const baseContext = `
Team: ${team || 'All Teams'}
Report Type: ${reportTitle}
Period: ${dFrom || 'All time'} to ${dTo || 'Today'}
Total Approved Entries: ${totalEntries}
Total Value: ${totalValue}
Pending (awaiting approval): ${pendingCount}
Rejected: ${rejectedCount}

Performance by Metric:
${JSON.stringify(metricList, null, 2)}

Performance by Team:
${JSON.stringify(teamList, null, 2)}

Top Performers:
${JSON.stringify(userList.sort((a, b) => b.total - a.total).slice(0, 10), null, 2)}`

      const typePrompt =
        type === 'individual_performance'
          ? `This is an INDIVIDUAL PERFORMANCE report${focusUserName ? ' for ' + focusUserName : ''}. Focus on the individual level:
1. Overall Assessment for the individual
2. Metric-by-metric breakdown of their numbers
3. Consistency & work patterns (days active vs entries)
4. Key Strengths
5. Areas for Improvement
6. Concrete coaching recommendations
7. Risk/attention flags`
        : type === 'monthly_summary'
        ? `This is a MONTHLY SUMMARY. Provide a clean month-level view:
1. Month at a Glance (totals, activity level)
2. Week-by-week trend within the month
3. Metric highlights for the month
4. Top performers of the month
5. Attendance/activity observations
6. Recommendations for next month`
        : type === 'comparative'
        ? `This is a COMPARATIVE ANALYSIS between Rolo Core and Rolo Edge.
1. Head-to-head comparison (entries, values, averages)
2. Which team leads on which metric and why
3. Individual standouts from each team
4. Where each team is underperforming
5. Balanced recommendations for both teams
6. Overall verdict`
        : `This is a TEAM PERFORMANCE report. Provide:
1. Executive Summary
2. Key Strengths
3. Areas for Improvement
4. Team Comparisons (if multiple teams)
5. Individual Performance Highlights
6. Actionable Recommendations
7. Risk Assessment`

      const prompt = `You are an expert HR and performance analyst. Use ONLY the numbers provided — do not invent data.${baseContext}\n\n${typePrompt}\n\nFormat as a professional business report with clear sections. Keep it grounded in the actual data. If there is little or no data for the period, say so directly and explain what the numbers that do exist show.`

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-120b',
        temperature: 0.7,
        max_tokens: 2000,
      })

      aiInsights = completion.choices[0].message.content || ''
    } else {
      aiInsights = `AI Insights unavailable (GROQ_API_KEY not configured). 

Basic Summary:
- Total Entries: ${totalEntries}
- Total Value: ${totalValue}
- Teams: ${teamList.map(t => t.team).join(', ') || 'None'}
- Top Performer: ${userList.sort((a, b) => b.total - a.total)[0]?.name || 'N/A'} (${userList.sort((a, b) => b.total - a.total)[0]?.total || 0} total value)`
    }
  } catch (err) {
    aiInsights = `AI generation failed: ${err.message}`
  }

  return res.status(200).json({
    title: reportTitle,
    type,
    dateFrom: dFrom || null,
    dateTo: dTo || null,
    pendingCount,
    rejectedCount,
    totalEntries,
    totalValue,
    recentCount: entries.filter((e) => {
      const d = new Date(e.date)
      const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return d >= last30
    }).length,
    metricList,
    teamList,
    userList,
    aiInsights,
    generatedAt: new Date().toISOString(),
  })
}
