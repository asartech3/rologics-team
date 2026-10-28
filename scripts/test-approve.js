const http = require('http')

function request(path, method, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const opts = {
      hostname: 'localhost', port: 3000, path, method,
      headers: {
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
    }
    const req = http.request(opts, (res) => {
      let raw = ''
      res.on('data', (chunk) => { raw += chunk })
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: raw }))
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

async function main() {
  // Login as Edge lead
  const leadLogin = await request('/api/auth/login', 'POST', { employeeId: 'RDO0250924', password: 'Edge@2026' })
  const leadCookie = (Array.isArray(leadLogin.headers['set-cookie']) ? leadLogin.headers['set-cookie'][0] : leadLogin.headers['set-cookie']).split(';')[0]
  console.log('Lead login status:', leadLogin.status)
  
  // Get pending entries
  const perfRes = await request('/api/performance', 'GET', null, leadCookie)
  console.log('Performance status:', perfRes.status)
  if (perfRes.status === 200) {
    const entries = JSON.parse(perfRes.body).entries
    console.log('Entries:', entries.length)
    entries.forEach(e => console.log('  -', e.id, e.metric, e.value, e.status, e.userId))
    
    if (entries.length > 0) {
      const entryId = entries[0].id
      const approveRes = await request('/api/performance', 'PUT', { id: entryId, status: 'approved' }, leadCookie)
      console.log('Approve status:', approveRes.status)
      console.log('Approve body:', approveRes.body.substring(0, 500))
    }
  }
}

main().catch(err => { console.error('Error:', err.message); process.exit(1) })
