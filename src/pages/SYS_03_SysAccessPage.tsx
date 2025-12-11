import { useState } from 'react';
import { MetaAppShell } from '../components/shell/MetaAppShell';
import { MetaPageHeader } from '../components/MetaPageHeader';
import { PageAuditTrail, PageAuditData } from '../components/PageAuditTrail';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Shield, Mail, UserPlus, MoreHorizontal, Circle } from 'lucide-react';

// ============================================================================
// SYS_03 - ACCESS CONTROL
// USERS: RBAC, Invites, Team management
// ============================================================================

interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'AUDITOR' | 'VIEWER';
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  lastActive: string;
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
];

export function SysAccessPage() {
  const [users] = useState<User[]>(MOCK_USERS);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

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
  };

  return (
    <MetaAppShell>
      <div className="px-6 py-8 md:px-12 md:py-12 max-w-[1200px] mx-auto">
        <MetaPageHeader
          variant="document"
          code="SYS_03"
          title="ACCESS CONTROL"
          subtitle="CREW MANIFEST"
          description="Manage tenant access, role-based permissions, and invitation protocols."
        />

        <div className="mt-8 space-y-6">
          {/* Quick Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Input
                placeholder="Search crew..."
                className="bg-[#050505] border-[#1F1F1F] font-mono text-sm w-[300px] focus:border-emerald-500"
              />
            </div>
            <Button
              onClick={() => setIsInviteOpen(!isInviteOpen)}
              className="bg-zinc-100 hover:bg-white text-black font-mono text-xs tracking-wide"
            >
              <UserPlus className="w-4 h-4 mr-2" /> INVITE UNIT
            </Button>
          </div>

          {/* Invite Panel (Conditional) */}
          {isInviteOpen && (
            <Card className="bg-[#0F0F0F] border-[#333] border-l-2 border-l-emerald-500 p-6 animate-in slide-in-from-top-2 fade-in">
              <h3 className="text-sm font-mono text-white mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500" /> DISPATCH INVITATION
              </h3>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <Input
                    placeholder="officer@company.com"
                    className="bg-black border-[#333] font-mono text-sm"
                  />
                </div>
                <div className="w-[200px] space-y-2">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Clearance Level
                  </label>
                  <Select defaultValue="VIEWER">
                    <SelectTrigger className="bg-black border-[#333] font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-[#333]">
                      <SelectItem value="ADMIN">ADMIN (Level 5)</SelectItem>
                      <SelectItem value="AUDITOR">AUDITOR (Read Only)</SelectItem>
                      <SelectItem value="VIEWER">VIEWER (Restricted)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs">
                  SEND TRANSMISSION
                </Button>
              </div>
            </Card>
          )}

          {/* Users Table */}
          <Card className="bg-[#0A0A0A] border-[#1F1F1F] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#050505] border-b border-[#1F1F1F]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 h-10">
                    Identity
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 h-10">
                    Role
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 h-10">
                    Status
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 h-10 text-right">
                    Last Signal
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-b border-[#1F1F1F] hover:bg-[#0F0F0F] transition-colors"
                  >
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-white font-mono">{user.name}</div>
                        <div className="text-xs text-zinc-500 font-mono">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`
                        inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border
                        ${
                          user.role === 'OWNER'
                            ? 'border-amber-500/30 text-amber-500 bg-amber-500/10'
                            : user.role === 'ADMIN'
                              ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                              : 'border-zinc-700 text-zinc-400 bg-zinc-800'
                        }
                      `}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.status === 'ACTIVE' && (
                          <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
                        )}
                        {user.status === 'INVITED' && (
                          <Circle className="w-2 h-2 fill-transparent text-amber-500" />
                        )}
                        <span className="text-xs font-mono text-zinc-400">{user.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-zinc-500">
                      {user.lastActive}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-white"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Role Legend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="p-4 border border-[#1F1F1F] rounded bg-[#050505]">
              <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Shield className="w-3 h-3" /> Security Policy
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Roles are strictly enforced by the NexusCanon kernel. "Owner" role cannot be
                transferred without multi-signature verification. "Auditors" have read-only access
                to all verified ledgers.
              </p>
            </div>
          </div>
        </div>
      </div>
      <PageAuditTrail data={auditData} />
    </MetaAppShell>
  );
}
