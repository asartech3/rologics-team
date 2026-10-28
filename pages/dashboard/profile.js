import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import {
  Contact,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Clock,
  Banknote,
  Info,
  Edit,
  ChevronRight,
  Users,
  Calendar,
} from 'lucide-react'

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [myEntries, setMyEntries] = useState([])
  const [activeDay, setActiveDay] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const meRes = await fetch('/api/auth/me')
        const meData = await meRes.json()
        if (!meData.user) {
          router.replace('/')
          return
        }
        setUser(meData.user)

        const [profRes, perfRes] = await Promise.all([
          fetch('/api/members?includeSelf=1'),
          fetch('/api/performance'),
        ])
        const profData = await profRes.json()
        const perfData = await perfRes.json()
        const myProfile = profData.members.find((m) => m.id === meData.user.id)
        setProfile(myProfile ? { ...myProfile, ...(myProfile.profile || {}) } : null)
        if (mounted) setMyEntries(perfData.entries || [])
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [router])

  // Attendance calendar (current month, built from hourly entries)
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayDow = (new Date(year, month, 1).getDay() + 6) % 7 // Monday-first
  const loggedDays = new Set(
    myEntries.filter((e) => e.date.startsWith(now.toISOString().slice(0, 7))).map((e) => e.date.slice(8))
  )
  const todayStr = String(now.getDate()).padStart(2, '0')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const prof = profile || {
    designation: 'Not set',
    department: 'Not set',
    dateOfJoining: 'Not set',
    dateOfBirth: 'Not set',
    gender: 'Not set',
    bloodGroup: 'Not set',
    phone: 'Not set',
    emergencyContact: 'Not set',
    address: 'Not set',
    city: 'Not set',
    state: 'Not set',
    pincode: 'Not set',
    aadhaar: 'Not set',
    pan: 'Not set',
    uan: 'Not set',
    esic: 'Not set',
    bankName: 'Not set',
    accountNumber: 'Not set',
    ifsc: 'Not set',
    baseSalary: 'Not set',
    employmentType: 'Not set',
    reportingTo: 'Not set',
  }

  const teamColor = user.team === 'rolo-core' ? 'text-blue-600' : user.team === 'rolo-edge' ? 'text-purple-600' : 'text-amber-600'

  return (
    <Layout user={user}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
              <p className="text-slate-600 text-sm">Your personal and employment details</p>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                editing
                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Edit className="w-4 h-4" />
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
                <span className={`px-2 py-1 rounded text-xs font-medium ${teamColor === 'text-blue-600' ? 'bg-blue-50 text-blue-700' : teamColor === 'text-purple-600' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'}`}>
                  {user.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-slate-500 text-sm">{prof.designation} • {prof.department}</p>
              <p className="text-xs text-slate-400 mt-1">Employee ID: {user.employeeId}</p>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Personal Info */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Contact className="w-4 h-4" /> Personal Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow label="Full Name" value={user.name} icon={Contact} />
                <DetailRow label="Employee ID" value={user.employeeId} icon={Contact} />
                <DetailRow label="Email" value={user.email} icon={Mail} />
                <DetailRow label="Phone" value={prof.phone} icon={Phone} />
                <DetailRow label="Emergency Contact" value={prof.emergencyContact} icon={Phone} />
                <DetailRow label="Designation" value={prof.designation} icon={GraduationCap} />
                <DetailRow label="Department" value={prof.department} icon={GraduationCap} />
                <DetailRow label="Date of Joining" value={prof.dateOfJoining} icon={Clock} />
                <DetailRow label="Date of Birth" value={prof.dateOfBirth} icon={Clock} />
                <DetailRow label="Gender" value={prof.gender} icon={Info} />
                <DetailRow label="Blood Group" value={prof.bloodGroup} icon={Info} />
                <DetailRow label="Employment Type" value={prof.employmentType} icon={Info} />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Address
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase">Address</p>
                <p className="text-sm text-slate-800">{prof.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">City</p>
                  <p className="text-sm text-slate-800">{prof.city}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">State</p>
                  <p className="text-sm text-slate-800">{prof.state}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase">Pincode</p>
                <p className="text-sm text-slate-800">{prof.pincode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Banknote className="w-4 h-4" /> Employment & Compensation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailRow label="Base Salary" value={`₹${prof.baseSalary}`} icon={Banknote} />
            <DetailRow label="UAN" value={prof.uan} icon={Contact} />
            <DetailRow label="ESIC" value={prof.esic} icon={Contact} />
            <DetailRow label="Bank Name" value={prof.bankName} icon={Banknote} />
            <DetailRow label="Account Number" value={prof.accountNumber} icon={Banknote} />
            <DetailRow label="IFSC Code" value={prof.ifsc} icon={Banknote} />
            <DetailRow label="PAN" value={prof.pan} icon={Contact} />
            <DetailRow label="Aadhaar" value={prof.aadhaar} icon={Contact} />
            <DetailRow label="Reporting To" value={prof.reportingTo || 'N/A'} icon={Users} />
          </div>
        </div>

        {/* Team Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Team Information</h3>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${user.team === 'rolo-core' ? 'bg-blue-600' : user.team === 'rolo-edge' ? 'bg-purple-600' : 'bg-amber-600'}`}>
              {user.team === 'rolo-core' ? 'R' : user.team === 'rolo-edge' ? 'E' : 'X'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {user.team === 'rolo-core' ? 'Rolo Core' : user.team === 'rolo-edge' ? 'Rolo Edge' : 'Unassigned'}
              </p>
              <p className="text-xs text-slate-500">{user.team === 'rolo-core' ? 'Infopark, Kochi' : user.team === 'rolo-edge' ? 'Technopark, Trivandrum' : 'Executive Office'}</p>
            </div>
          </div>
        </div>

        {/* Attendance calendar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2 dark:text-slate-200">
            <Calendar className="w-4 h-4" /> Attendance — {now.toLocaleString('en', { month: 'long' })} {year}
          </h3>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <span key={d} className="text-[10px] font-bold text-slate-400 uppercase py-1">{d}</span>
            ))}
            {Array.from({ length: firstDayDow }).map((_, i) => (
              <span key={'x' + i} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = String(i + 1).padStart(2, '0')
              const logged = loggedDays.has(day)
              const isToday = day === todayStr
              return (
                <button
                  key={day}
                  onMouseEnter={() => setActiveDay(day)}
                  onMouseLeave={() => setActiveDay(null)}
                  className={
                    'aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all ' +
                    (logged
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : isToday
                      ? 'border-2 border-indigo-500 text-indigo-600'
                      : 'bg-slate-50 text-slate-400 dark:bg-slate-700')
                  }
                  title={logged ? 'Entry logged' : 'No entry'}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-slate-500 mt-4 dark:text-slate-400">
            <span className="inline-block w-3 h-3 bg-emerald-500 rounded mr-1.5 align-middle" />
            Days you logged entries (built from Hourly Entry) — {loggedDays.size} of {daysInMonth} days this month
            {activeDay ? ` • Day ${activeDay}: ${loggedDays.has(activeDay) ? 'present' : 'no entry'}` : ''}
          </p>
        </div>
      </div>
    </Layout>
  )
}

function DetailRow({ label, value, icon: Icon }) {
  return (
    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
      <p className="text-xs font-bold text-slate-400 uppercase truncate">{label}</p>
      <p className="text-sm text-slate-800 truncate">{value}</p>
    </div>
  )
}
