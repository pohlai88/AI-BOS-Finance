import { useState } from 'react'
import { MetaAppShell } from '../components/shell/MetaAppShell'
import { MetaPageHeader } from '../components/MetaPageHeader'
import { PageAuditTrail, PageAuditData } from '../components/PageAuditTrail'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Shield, Mail, UserPlus, MoreHorizontal, Circle } from 'lucide-react'

// ============================================================================
// SYS_03 - ACCESS CONTROL
// USERS: RBAC, Invites, Team management
// ============================================================================

interface User {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'AUDITOR' | 'VIEWER'
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED'
  lastActive: string
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'System Admin',
    email: 'admin@nexuscanon.com',
    role: 'OWNER',
    status: 'ACTIVE',
    lastActive: 'Now',
  },
  {
    id: '2',
    name: 'Sarah Chief',
    email: 'cfo@company.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastActive: '2h ago',
  },
  {
    id: '3',
    name: 'Mike Audit',
    email: 'mike@big4.com',
    role: 'AUDITOR',
    status: 'INVITED',
    lastActive: '-',
  },
]

export function SysAccessPage() {
  const [users] = useState<User[]>(MOCK_USERS)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const auditData: PageAuditData = {
    pageCode: 'SYS_03',
    version: '1.0.0',
    status: 'ACTIVE',
    lastUpdated: new Date().toISOString(),
    validator: 'SEC_OPS',
    classification: 'RESTRICTED',
    recentChanges: [
      {
        timestamp: new Date().toISOString(),
        change: 'Access control matrix loaded',
        validator: 'SYSTEM',
      },
    ],
  }

  return (
    <MetaAppShell>
      <div className="mx-auto max-w-[1200px] px-6 py-8 md:px-12 md:py-12">
        <MetaPageHeader
          variant="document"
          code="SYS_03"
          title="ACCESS CONTROL"
          subtitle="CREW MANIFEST"
          description="Manage tenant access, role-based permissions, and invitation protocols."
        />

        <div className="mt-8 space-y-6">
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Input
                placeholder="Search crew..."
                className="w-[300px] border-[#1F1F1F] bg-[#050505] font-mono text-sm focus:border-emerald-500"
              />
            </div>
            <Button
              onClick={() => setIsInviteOpen(!isInviteOpen)}
              className="bg-zinc-100 font-mono text-xs tracking-wide text-black hover:bg-white"
            >
              <UserPlus className="mr-2 h-4 w-4" /> INVITE UNIT
            </Button>
          </div>

          {/* Invite Panel (Conditional) */}
          {isInviteOpen && (
            <Card className="border-l-2 border-[#333] border-l-emerald-500 bg-[#0F0F0F] p-6 animate-in fade-in slide-in-from-top-2">
              <h3 className="mb-4 flex items-center gap-2 font-mono text-sm text-white">
                <Mail className="h-4 w-4 text-emerald-500" /> DISPATCH
                INVITATION
              </h3>
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Email Address
                  </label>
                  <Input
                    placeholder="officer@company.com"
                    className="border-[#333] bg-black font-mono text-sm"
                  />
                </div>
                <div className="w-[200px] space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Clearance Level
                  </label>
                  <Select defaultValue="VIEWER">
                    <SelectTrigger className="border-[#333] bg-black font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#333] bg-[#0A0A0A]">
                      <SelectItem value="ADMIN">ADMIN (Level 5)</SelectItem>
                      <SelectItem value="AUDITOR">
                        AUDITOR (Read Only)
                      </SelectItem>
                      <SelectItem value="VIEWER">
                        VIEWER (Restricted)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-emerald-600 font-mono text-xs text-white hover:bg-emerald-500">
                  SEND TRANSMISSION
                </Button>
              </div>
            </Card>
          )}

          {/* Users Table */}
          <Card className="overflow-hidden border-[#1F1F1F] bg-[#0A0A0A]">
            <Table>
              <TableHeader className="border-b border-[#1F1F1F] bg-[#050505]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Identity
                  </TableHead>
                  <TableHead className="h-10 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Role
                  </TableHead>
                  <TableHead className="h-10 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Status
                  </TableHead>
                  <TableHead className="h-10 text-right font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Last Signal
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-b border-[#1F1F1F] transition-colors hover:bg-[#0F0F0F]"
                  >
                    <TableCell>
                      <div>
                        <div className="font-mono text-sm font-medium text-white">
                          {user.name}
                        </div>
                        <div className="font-mono text-xs text-zinc-500">
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] ${
                          user.role === 'OWNER'
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                            : user.role === 'ADMIN'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                              : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                        } `}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.status === 'ACTIVE' && (
                          <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                        )}
                        {user.status === 'INVITED' && (
                          <Circle className="h-2 w-2 fill-transparent text-amber-500" />
                        )}
                        <span className="font-mono text-xs text-zinc-400">
                          {user.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-zinc-500">
                      {user.lastActive}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-white"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Role Legend */}
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded border border-[#1F1F1F] bg-[#050505] p-4">
              <h4 className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-zinc-400">
                <Shield className="h-3 w-3" /> Security Policy
              </h4>
              <p className="text-xs leading-relaxed text-zinc-600">
                Roles are strictly enforced by the NexusCanon kernel. "Owner"
                role cannot be transferred without multi-signature verification.
                "Auditors" have read-only access to all verified ledgers.
              </p>
            </div>
          </div>
        </div>
      </div>
      <PageAuditTrail data={auditData} />
    </MetaAppShell>
  )
}
