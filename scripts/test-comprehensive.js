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
  console.log('=== COMPREHENSIVE E2E TEST ===\n')

  // Helper to login and get cookie
  const loginAs = async (empId, pw) => {
    const res = await request('/api/auth/login', 'POST', { employeeId: empId, password: pw })
    const sc = Array.isArray(res.headers['set-cookie']) ? res.headers['set-cookie'][0] : res.headers['set-cookie']
    return sc ? sc.split(';')[0] : null
  }

  // 1. Manager logs on behalf of member (Edge lead for Edge member)
  console.log('--- Test 1: Manager on-behalf logging ---')
  const mgrCookie = await loginAs('RDO0100816', 'Rolo@2026')
  const memberLogin = await request('/api/auth/login', 'POST', { employeeId: 'RDO0180526', password: 'Edge@2026' })
  const memberCookie = (Array.isArray(memberLogin.headers['set-cookie']) ? memberLogin.headers['set-cookie'][0] : memberLogin.headers['set-cookie']).split(';')[0]
  const memberId = JSON.parse(await (await request('/api/auth/me', 'GET', null, memberCookie)).body).user.id

  const onBehalfRes = await request('/api/performance', 'POST', {
    metric: 'bulk-upload', value: 10, date: '2026-10-28', notes: 'On behalf test', category: 'project', userId: memberId
  }, mgrCookie)
  console.log('On-behalf entry status:', onBehalfRes.status, onBehalfRes.status === 201 ? '✅' : '❌')
  const onBehalfEntry = JSON.parse(onBehalfRes.body).entry
  console.log('  Entry status:', onBehalfEntry.status, '(should be pending)')

  // 2. Member tries on-behalf (should be 403)
  console.log('\n--- Test 2: Member on-behalf (should be 403) ---')
  const forbiddenRes = await request('/api/performance', 'POST', {
    metric: 'hpe', value: 1, date: '2026-10-28', userId: memberId
  }, memberCookie)
  console.log('Member on-behalf status:', forbiddenRes.status, forbiddenRes.status === 403 ? '✅ Blocked' : '❌ Not blocked')

  // 3. Cross-team on-behalf (Edge lead for Core member - should be 403)
  console.log('\n--- Test 3: Cross-team on-behalf (should be 403) ---')
  const edgeLeadCookie = await loginAs('RDO0250924', 'Edge@2026')
  const coreMemberId = 'mvqndteru0ys6' // BIJOY
  const crossRes = await request('/api/performance', 'POST', {
    metric: 'hpe', value: 1, date: '2026-10-28', userId: coreMemberId
  }, edgeLeadCookie)
  console.log('Cross-team on-behalf status:', crossRes.status, crossRes.status === 403 ? '✅ Blocked' : '❌ Not blocked')

  // 4. Approve the on-behalf entry
  console.log('\n--- Test 4: Approve on-behalf entry ---')
  const approveRes = await request('/api/performance', 'PUT', { id: onBehalfEntry.id, status: 'approved' }, edgeLeadCookie)
  console.log('Approve status:', approveRes.status, approveRes.status === 200 ? '✅' : '❌')

  // 5. Check stats include the approved entry
  console.log('\n--- Test 5: Stats after approval ---')
  const statsRes = await request('/api/stats', 'GET', null, mgrCookie)
  const stats = JSON.parse(statsRes.body)
  const bulkUpload = stats.metricList.find(m => m.metric === 'Bulk Upload')
  console.log('Total entries:', stats.totalEntries, '(should be 2)')
  console.log('Bulk Upload row:', bulkUpload ? `${bulkUpload.total} total, ${bulkUpload.count} entries` : 'not found')

  // 6. Test AI report generation
  console.log('\n--- Test 6: AI Report generation ---')
  const aiRes = await request('/api/ai-report', 'POST', {
    type: 'team_performance', team: 'rolo-edge',
    dateFrom: '2026-10-01', dateTo: '2026-10-28'
  }, mgrCookie)
  console.log('AI report status:', aiRes.status, aiRes.status === 200 ? '✅' : '❌')
  if (aiRes.status === 200) {
    const aiData = JSON.parse(aiRes.body)
    console.log('Report type:', aiData.type)
    console.log('Insights length:', aiData.aiInsights.length, 'chars')
    console.log('Mentions HPE:', aiData.aiInsights.includes('HPE'))
    console.log('Mentions Bulk Upload:', aiData.aiInsights.includes('Bulk Upload'))
  }

  // 7. Test target assignment
  console.log('\n--- Test 7: Target assignment ---')
  const targetRes = await request('/api/targets', 'POST', {
    memberId, metric: 'hpe', targetValue: 10, weekStart: '2026-10-26'
  }, edgeLeadCookie)
  console.log('Target status:', targetRes.status, targetRes.status === 201 ? '✅' : '❌')

  // 8. Test notifications
  console.log('\n--- Test 8: Notifications ---')
  const notifRes = await request('/api/notifications', 'GET', null, memberCookie)
  console.log('Notifications status:', notifRes.status, notifRes.status === 200 ? '✅' : '❌')
  if (notifRes.status === 200) {
    const notifs = JSON.parse(notifRes.body).notifications
    console.log('Notification count:', notifs.length)
    notifs.forEach(n => console.log('  -', n.title, '|', n.message.substring(0, 60)))
  }

  console.log('\n=== ALL TESTS COMPLETE ===')
}

main().catch(err => { console.error('Error:', err.message); process.exit(1) })
