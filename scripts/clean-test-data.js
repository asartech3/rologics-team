// Clean test artifacts: entries, reports, targets, notifications — users/profiles kept
const fs = require('fs')
const path = require('path')
const DATA = path.join(process.cwd(), 'db', 'data.json')
const data = JSON.parse(fs.readFileSync(DATA, 'utf8'))
data.performance = []
data.reports = []
if (data.targets) data.targets = []
if (data.notifications) data.notifications = []
fs.writeFileSync(DATA, JSON.stringify(data, null, 2))
console.log('Cleaned. Users:', data.users.length, 'Profiles:', data.profiles.length)
