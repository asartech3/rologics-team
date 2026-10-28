import { getSessionFromReq } from '../../lib/auth'
import { getNotifications, markNotificationsRead } from '../../lib/db'

// Real in-app notifications, scoped per user.
// True background web-push (lock-screen) is enabled after HTTPS deployment with VAPID keys.

export default async function handler(req, res) {
  const session = getSessionFromReq(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  if (req.method === 'GET') {
    const mine = getNotifications()
      .filter((n) => (n.userIds || []).includes(session.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 30)
      .map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        createdAt: n.createdAt,
        unread: !(n.readBy || []).includes(session.id),
      }))
    return res.status(200).json({
      notifications: mine,
      unread: mine.filter((n) => n.unread).length,
    })
  }

  if (req.method === 'PATCH') {
    const { ids } = req.body || {}
    markNotificationsRead(session.id, ids || null)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
