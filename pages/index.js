import { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { Shield, User, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)

  // 3D tilt (pointer only — disabled on touch phones for performance)
  const cardRef = useRef(null)
  const handleMove = (e) => {
    const card = cardRef.current
    if (!card || e.pointerType === 'touch') return
    const r = card.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    card.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) translateZ(12px)`
  }
  const handleLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateZ(0)'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        // shake feedback
        if (cardRef.current) {
          cardRef.current.style.transform = 'perspective(1000px) translateX(0)'
          cardRef.current.classList.remove('rolo-shake')
          void cardRef.current.offsetWidth
          cardRef.current.classList.add('rolo-shake')
        }
        return
      }
      router.push('/dashboard')
    } catch (err) {
      setError('Server error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="rolo-login min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Cinematic background */}
      <div className="absolute inset-0 rolo-bg" />

      {/* Floating glow orbs */}
      <div className="rolo-orb rolo-orb-1" />
      <div className="rolo-orb rolo-orb-2" />
      <div className="rolo-orb rolo-orb-3" />

      {/* Grid floor (3D perspective) */}
      <div className="rolo-floor" />

      {/* Floating 3D cubes in the scene */}
      <div className="rolo-cube-scene rolo-cube-scene-1">
        <div className="rolo-cube">
          <div className="rolo-face rolo-face-f" /><div className="rolo-face rolo-face-b" />
          <div className="rolo-face rolo-face-l" /><div className="rolo-face rolo-face-r" />
          <div className="rolo-face rolo-face-t" /><div className="rolo-face rolo-face-d" />
        </div>
      </div>
      <div className="rolo-cube-scene rolo-cube-scene-2">
        <div className="rolo-cube">
          <div className="rolo-face rolo-face-f" /><div className="rolo-face rolo-face-b" />
          <div className="rolo-face rolo-face-l" /><div className="rolo-face rolo-face-r" />
          <div className="rolo-face rolo-face-t" /><div className="rolo-face rolo-face-d" />
        </div>
      </div>
      <div className="rolo-cube-scene rolo-cube-scene-3">
        <div className="rolo-cube">
          <div className="rolo-face rolo-face-f" /><div className="rolo-face rolo-face-b" />
          <div className="rolo-face rolo-face-l" /><div className="rolo-face rolo-face-r" />
          <div className="rolo-face rolo-face-t" /><div className="rolo-face rolo-face-d" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left — 3D brand showcase */}
        <div className="hidden lg:flex flex-col items-center justify-center text-center relative">
          {logoError ? (
            /* fallback: 3D cube when logo file is missing */
            <div className="rolo-cube-scene rolo-cube-scene-4">
              <div className="rolo-cube">
                <div className="rolo-face rolo-face-f rolo-cube-scene-4-f"><Shield className="w-10 h-10 text-white" /></div>
                <div className="rolo-face rolo-face-b rolo-cube-scene-4-f" />
                <div className="rolo-face rolo-face-l rolo-cube-scene-4-f" />
                <div className="rolo-face rolo-face-r rolo-cube-scene-4-f" />
                <div className="rolo-face rolo-face-t rolo-cube-scene-4-f" />
                <div className="rolo-face rolo-face-d rolo-cube-scene-4-f" />
              </div>
            </div>
          ) : (
            <img
              src="/rolo-logo.png"
              onError={() => setLogoError(true)}
              alt="Rologics Infolabs"
              className="w-40 h-40 object-contain drop-shadow-2xl animate-slide-up"
            />
          )}
          <h1 className="text-5xl font-bold text-slate-900 tracking-tight mt-8 relative z-10">
            Rolo<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500">Team</span>
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Performance. Measured. Simplified.</p>
          <div className="flex items-center gap-6 mt-8 text-xs text-slate-600">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" /> Rolo Core</span>
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Rolo Edge</span>
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> AI Reports</span>
          </div>
        </div>

        {/* Right — glassmorphic login card */}
        <div className="rolo-card-wrap w-full max-w-md mx-auto" onPointerMove={handleMove} onPointerLeave={handleLeave}>
          <div ref={cardRef} className="rolo-card">
            {/* Mobile logo */}
            <div className="lg:hidden flex flex-col items-center mb-6">
              {logoError ? (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 to-emerald-600 shadow-lg shadow-blue-500/40 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
              ) : (
                <img
                  src="/rolo-icon.svg"
                  onError={() => setLogoError(true)}
                  alt="Rologics Infolabs"
                  className="w-16 h-16 object-contain drop-shadow-lg"
                />
              )}
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-4">Rolo<span className="text-emerald-500">Team</span></h1>
            </div>

            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-sm text-slate-500 mb-7">Sign in to the performance dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Employee ID</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-700 transition-colors" />
                  <input
                    type="text"
                    autoComplete="username"
                    className="rolo-input"
                    placeholder="RDO••••••"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-700 transition-colors" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="rolo-input pr-11"
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-200 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rolo-btn"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 pt-5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Secure · Encrypted
              </span>
              <span>team.rologicsinfolabs.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
