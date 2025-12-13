import { useState } from 'react'
import {
  User,
  Lock,
  Palette,
  ShieldCheck,
  Save,
  CheckCircle2,
  Moon,
  Sun,
  Monitor,
  Database,
  HardDrive,
  Calendar,
  Briefcase,
  Zap,
  Plus,
  RefreshCw,
  BookOpen,
  Award,
  UserPlus,
  Users,
  BadgeCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useSysConfig } from '@/modules/system'
import { MetaAppShell } from '../../components/shell/MetaAppShell'

// Enterprise Design System Imports
import { NexusCard } from '../../components/nexus/NexusCard'
import { NexusButton } from '../../components/nexus/NexusButton'
import { NexusInput } from '../../components/nexus/NexusInput'
import { NexusBadge } from '../../components/nexus/NexusBadge'

export function SysProfilePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<
    'identity' | 'growth' | 'connections' | 'settings'
  >('identity')
  const [isSaving, setIsSaving] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(128)
  const { markComplete } = useSysConfig()

  // SSOT Data
  const hrData = {
    officialName: 'Steven G. Rogers',
    employeeId: 'NEX-001',
    department: 'Operations',
    manager: 'Nick Fury',
    role: 'Owner & Captain',
    joinedDate: '2012-05-04',
    syncStatus: 'Synced 2 mins ago',
  }

  const [formData, setFormData] = useState({
    displayName: 'Steve Rogers',
    bio: 'Just a kid from Brooklyn. Leading the Avengers initiative.',
    email: 'steve@nexus.com',
    theme: 'dark',
    density: 'comfortable',
    openToWork: true,
  })

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      markComplete('profile')
      toast.success('Profile synchronized with HRM Core.')
    }, 1500)
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    setFollowerCount((prev) => (isFollowing ? prev - 1 : prev + 1))
    if (!isFollowing) toast.success('You are now following Steve.')
  }

  return (
    <MetaAppShell>
      <div className="mx-auto max-w-6xl p-6 text-zinc-100 duration-500 animate-in fade-in md:p-8">
        {/* HEADER */}
        <div className="sticky top-16 z-30 mb-8 flex flex-col items-start justify-between gap-6 border-b border-[#1F1F1F] bg-[#0A0A0A] pb-8 md:flex-row md:items-center">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden border border-[#333] bg-[#1F1F1F]">
                <span className="font-mono text-2xl text-zinc-500">SR</span>
              </div>
              <div className="absolute -bottom-2 -right-2 border border-[#333] bg-[#000] p-1">
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-medium tracking-tight text-white">
                {formData.displayName}
                <NexusBadge variant="neutral">{hrData.employeeId}</NexusBadge>
              </h1>
              <p className="mt-1 font-mono text-sm text-zinc-500">
                {hrData.role} // {hrData.department}
              </p>
              <div className="mt-3 flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <RefreshCw className="h-3 w-3" />
                  {hrData.syncStatus}
                </span>
                <span className="text-zinc-700">|</span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Users className="h-3 w-3" />
                  {followerCount} Followers
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NexusButton
              variant={isFollowing ? 'secondary' : 'primary'}
              onClick={handleFollow}
              className="min-w-[140px]"
            >
              {isFollowing ? 'Following' : 'Follow Profile'}
            </NexusButton>

            <div className="hidden border border-[#1F1F1F] bg-[#050505] px-3 py-2 font-mono text-[10px] text-zinc-600 md:block">
              SYS_04 :: PROFILE
            </div>
          </div>
        </div>

        <div className="flex min-h-[600px] flex-col gap-8 md:grid md:grid-cols-[240px_1fr]">
          {/* SIDEBAR NAVIGATION - Left Pane */}
          <div className="space-y-1 border-r border-[#1F1F1F] pr-4">
            <NavButton
              active={activeTab === 'identity'}
              onClick={() => setActiveTab('identity')}
              label="01 // Profile"
              desc="Personal Info"
            />
            <NavButton
              active={activeTab === 'growth'}
              onClick={() => setActiveTab('growth')}
              label="02 // Growth"
              desc="Development"
            />
            <NavButton
              active={activeTab === 'connections'}
              onClick={() => setActiveTab('connections')}
              label="03 // Apps"
              desc="Integrations"
            />
            <NavButton
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              label="04 // Settings"
              desc="Preferences"
            />
          </div>

          {/* MAIN CONTENT - Right Pane */}
          <div className="relative">
            <NexusCard className="relative h-full min-h-full" padding="md">
              {/* IDENTITY TAB */}
              {activeTab === 'identity' && (
                <div className="space-y-8 duration-300 animate-in fade-in slide-in-from-bottom-2">
                  <SectionHeader
                    title="Identity & HR Data"
                    sub="Official Records & Profile Settings"
                  />

                  {/* IMMUTABLE DATA */}
                  <div className="space-y-4 rounded-sm border border-[#1F1F1F] bg-[#000000] p-6">
                    <div className="mb-2 flex items-center gap-2">
                      <Lock className="h-3 w-3 text-zinc-500" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                        HR RECORD (READ ONLY)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <NexusInput
                        label="Full Name"
                        value={hrData.officialName}
                        readOnly
                      />
                      <NexusInput
                        label="Role / Title"
                        value={hrData.role}
                        readOnly
                      />
                      <NexusInput
                        label="Direct Manager"
                        value={hrData.manager}
                        readOnly
                      />
                      <NexusInput
                        label="Department"
                        value={hrData.department}
                        readOnly
                      />
                    </div>
                  </div>

                  {/* MUTABLE DATA */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-zinc-400" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                        PROFILE DETAILS
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <NexusInput
                        label="Display Name"
                        value={formData.displayName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            displayName: e.target.value,
                          })
                        }
                      />
                      <NexusInput
                        label="Email Address"
                        value={formData.email}
                        readOnly
                        icon={<Lock className="h-3 w-3" />}
                      />
                      <div className="col-span-2 space-y-2">
                        <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                          Bio / Summary
                        </label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) =>
                            setFormData({ ...formData, bio: e.target.value })
                          }
                          className="min-h-[80px] w-full rounded-[2px] border border-[#27272a] bg-[#050505] px-3 py-2.5 font-sans text-sm text-zinc-100 placeholder:text-zinc-700 focus:border-emerald-500/50 focus:outline-none"
                          placeholder="Tell us about your role..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GROWTH TAB */}
              {activeTab === 'growth' && (
                <div className="space-y-8 duration-300 animate-in fade-in slide-in-from-bottom-2">
                  <SectionHeader
                    title="Professional Development"
                    sub="LMS & Career Growth"
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <StatCard
                      label="Learning Hours"
                      value="24h"
                      sub="This Quarter"
                    />
                    <StatCard
                      label="Skill Assessment"
                      value="850"
                      sub="Top 10%"
                      highlight
                    />
                    <StatCard label="Certifications" value="03" sub="Active" />
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-2">
                      <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                        Required Training
                      </h3>
                      <button className="flex items-center gap-1 font-mono text-[10px] text-emerald-500 hover:text-white">
                        <RefreshCw className="h-3 w-3" /> Sync LMS
                      </button>
                    </div>

                    <CourseRow
                      title="Cybersecurity Awareness 2024"
                      status="Completed"
                      progress={100}
                    />
                    <CourseRow
                      title="Advanced React Patterns"
                      status="In Progress"
                      progress={45}
                    />
                  </div>

                  <div className="pt-8">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="font-mono text-[12px] uppercase tracking-widest text-zinc-400">
                        Skills & Endorsements
                      </h2>
                      <NexusButton
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px]"
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add Skill
                      </NexusButton>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <NexusBadge variant="neutral">
                        Leadership{' '}
                        <span className="ml-1 text-zinc-600">12</span>
                      </NexusBadge>
                      <NexusBadge variant="neutral">
                        React Native{' '}
                        <span className="ml-1 text-zinc-600">8</span>
                      </NexusBadge>
                      <NexusBadge variant="success">
                        Crisis Mgmt{' '}
                        <span className="ml-1 text-emerald-800">New</span>
                      </NexusBadge>
                    </div>
                  </div>
                </div>
              )}

              {/* CONNECTIONS TAB */}
              {activeTab === 'connections' && (
                <div className="space-y-8 duration-300 animate-in fade-in slide-in-from-bottom-2">
                  <SectionHeader
                    title="Connected Apps"
                    sub="Third-party Integrations"
                  />
                  <div className="grid grid-cols-1 gap-4">
                    <ConnectionRow
                      icon={<HardDrive />}
                      name="Google Drive"
                      status="Connected"
                    />
                    <ConnectionRow
                      icon={<Calendar />}
                      name="Google Calendar"
                      status="Connected"
                    />
                    <ConnectionRow
                      icon={<Briefcase />}
                      name="Jira Cloud"
                      status="Disconnected"
                    />
                  </div>
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="space-y-8 duration-300 animate-in fade-in slide-in-from-bottom-2">
                  <SectionHeader title="Preferences" sub="System Settings" />
                  <div className="grid grid-cols-3 gap-4">
                    <ThemeOption
                      icon={<Moon />}
                      label="Dark"
                      active={formData.theme === 'dark'}
                      onClick={() =>
                        setFormData({ ...formData, theme: 'dark' })
                      }
                    />
                    <ThemeOption
                      icon={<Sun />}
                      label="Light"
                      active={formData.theme === 'light'}
                      onClick={() =>
                        setFormData({ ...formData, theme: 'light' })
                      }
                    />
                    <ThemeOption
                      icon={<Monitor />}
                      label="Auto"
                      active={formData.theme === 'system'}
                      onClick={() =>
                        setFormData({ ...formData, theme: 'system' })
                      }
                    />
                  </div>
                </div>
              )}

              {/* FOOTER */}
              <div className="-mx-6 -mb-6 mt-8 flex justify-end border-t border-[#1F1F1F] bg-[#0A0A0A] p-6">
                <NexusButton
                  onClick={handleSave}
                  isLoading={isSaving}
                  className="w-48"
                >
                  Save Changes
                </NexusButton>
              </div>
            </NexusCard>
          </div>
        </div>
      </div>
    </MetaAppShell>
  )
}

// ---------------------------------------------
// LOCAL COMPOSITES (Using Primitives where possible)
// ---------------------------------------------

function NavButton({ active, onClick, label, desc }: any) {
  return (
    <button
      onClick={onClick}
      className={`group w-full border-l-2 px-4 py-4 text-left transition-all ${active
          ? 'border-emerald-500 bg-[#0A0A0A]'
          : 'border-transparent hover:border-zinc-800 hover:bg-[#0A0A0A]/50'
        } `}
    >
      <div
        className={`mb-1 font-mono text-[11px] tracking-widest ${active ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}
      >
        {label}
      </div>
      <div className="text-[10px] text-zinc-600">{desc}</div>
    </button>
  )
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6 border-b border-[#1F1F1F] pb-4">
      <h2 className="text-lg font-medium tracking-tight text-white">{title}</h2>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {sub}
      </p>
    </div>
  )
}

function StatCard({ label, value, sub, highlight }: any) {
  return (
    <div className="border border-[#1F1F1F] bg-[#050505] p-4">
      <div className="mb-2 font-mono text-[10px] uppercase text-zinc-600">
        {label}
      </div>
      <div
        className={`font-mono text-2xl ${highlight ? 'text-emerald-500' : 'text-white'}`}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] text-zinc-600">{sub}</div>
    </div>
  )
}

function CourseRow({ title, status, progress }: any) {
  return (
    <div className="flex items-center justify-between border border-[#1F1F1F] bg-[#050505] p-4">
      <div>
        <div className="font-mono text-xs text-zinc-300">{title}</div>
        <div className="mt-1 text-[10px] text-zinc-600">{status}</div>
      </div>
      <div
        className={`font-mono text-xs ${progress === 100 ? 'text-emerald-500' : 'text-zinc-500'}`}
      >
        {progress}%
      </div>
    </div>
  )
}

function ConnectionRow({ icon, name, status }: any) {
  const connected = status === 'CONNECTED'
  return (
    <div className="flex items-center justify-between border border-[#1F1F1F] bg-[#050505] p-4">
      <div className="flex items-center gap-4">
        <div className="text-zinc-500">{icon}</div>
        <div className="font-mono text-xs text-zinc-300">{name}</div>
      </div>
      <NexusBadge variant={connected ? 'success' : 'neutral'}>
        {status}
      </NexusBadge>
    </div>
  )
}

function ThemeOption({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-3 border p-6 transition-all ${active
          ? 'border-emerald-500 bg-[#0A0A0A] text-emerald-500'
          : 'border-[#1F1F1F] bg-transparent text-zinc-600 hover:text-zinc-400'
        } `}
    >
      {icon}
      <span className="font-mono text-[10px] tracking-widest">{label}</span>
    </button>
  )
}
