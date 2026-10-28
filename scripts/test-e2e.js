const http = require('http')

function request(path, method, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
    }
    const req = http.request(opts, (res) => {
      let raw = ''
      res.on('data', (chunk) => { raw += chunk })
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: raw })
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

async function main() {
  // Login
  const loginRes = await request('/api/auth/login', 'POST', { employeeId: 'RDO0100816', password: 'Rolo@2026' })
  console.log('Login status:', loginRes.status)
  const setCookie = loginRes.headers['set-cookie']
  if (!setCookie) { console.log('No set-cookie header'); process.exit(1) }
  const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie
  const cookieValue = cookie.split(';')[0]
  console.log('Cookie:', cookieValue.substring(0, 60) + '...')

  // Stats
  const statsRes = await request('/api/stats', 'GET', null, cookieValue)
  console.log('Stats status:', statsRes.status)
  if (statsRes.status === 200) {
    const stats = JSON.parse(statsRes.body)
    console.log('Stats:', JSON.stringify({ totalEntries: stats.totalEntries, pendingCount: stats.pendingCount, metricCount: stats.metricList.length }))
  } else {
    console.log('Stats body:', statsRes.body.substring(0, 200))
  }

  // Projects
  const projRes = await request('/api/projects', 'GET', null, cookieValue)
  console.log('Projects status:', projRes.status)
  if (projRes.status === 200) {
    const projs = JSON.parse(projRes.body)
    console.log('Projects count:', projs.projects.length)
    projs.projects.forEach(p => console.log('  -', p.name, '(' + p.slug + ')', p.team || 'global'))
  } else {
    console.log('Projects body:', projRes.body.substring(0, 200))
  }

  // Test creating an entry as a member
  const memberLogin = await request('/api/auth/login', 'POST', { employeeId: 'RDO0180526', password: 'Edge@2026' })
  const memberCookie = (Array.isArray(memberLogin.headers['set-cookie']) ? memberLogin.headers['set-cookie'][0] : memberLogin.headers['set-cookie']).split(';')[0]
  
  const entryRes = await request('/api/performance', 'POST', {
    metric: 'hpe', value: 5, date: '2026-10-28', notes: 'Test entry', category: 'project'
  }, memberCookie)
  console.log('Create entry status:', entryRes.status)
  if (entryRes.status === 201) {
    const entry = JSON.parse(entryRes.body)
    console.log('Entry created:', entry.entry.id, 'status:', entry.entry.status)
    
    // Check stats - should still be pending (not counted)
    const stats2 = await request('/api/stats', 'GET', null, cookieValue)
    const s2 = JSON.parse(stats2.body)
    console.log('Stats after entry: totalEntries=', s2.totalEntries, 'pendingCount=', s2.pendingCount)
    
    // Approve as Edge lead
    const leadLogin = await request('/api/auth/login', 'POST', { employeeId: 'RDO0250924', password: 'Edge@2026' })
    const leadCookie = (Array.isArray(leadLogin.headers['set-cookie']) ? leadLogin.headers['set-cookie'][0] : leadLogin.headers['set-cookie']).split(';')[0]
    
    const approveRes = await request('/api/performance', 'PUT', { id: entry.entry.id, status: 'approved' }, leadCookie)
    console.log('Approve status:', approveRes.status)
    
    // Check stats again - should now be counted
    const stats3 = await request('/api/stats', 'GET', null, cookieValue)
    const s3 = JSON.parse(stats3.body)
    const hpe = s3.metricList.find(m => m.metric === 'HPE')
    console.log('Stats after approve: totalEntries=', s3.totalEntries, 'HPE row=', hpe ? hpe.total : 'not found')
  } else {
    console.log('Entry body:', entryRes.body.substring(0, 200))
  }
}

main().catch(err => { console.error('Error:', err.message); process.exit(1) })
