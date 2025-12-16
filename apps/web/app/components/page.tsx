/**
 * Component Catalog Page
 * 
 * Visual browser for all COMP_* components in the system.
 * 
 * Phase: UI System Next-Level Enhancement
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Grid3x3,
  List,
  Package,
  CheckCircle2,
  AlertTriangle,
  Beaker,
} from 'lucide-react';
import { Suspense } from 'react';

// ============================================================================
// MOCK DATA (Replace with actual registry call)
// ============================================================================

const MOCK_COMPONENTS = [
  {
    id: 'COMP_StatCard',
    name: 'StatCard',
    meta: {
      code: 'COMP_StatCard',
      version: '1.0.0',
      family: 'CARD',
      purpose: 'METRICS',
      status: 'active' as const,
    },
    category: 'Data Display',
    filePath: 'src/components/canon/StatCard.tsx',
  },
  {
    id: 'COMP_TBLM01',
    name: 'MonetizeFullTable',
    meta: {
      code: 'TBLM01',
      version: '1.0.0',
      family: 'TABLE',
      purpose: 'MONETIZE',
      status: 'active' as const,
    },
    category: 'Data Display',
    filePath: 'packages/ui/canon/TBLM01.tsx',
  },
  // Add more as discovered
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function ComponentsPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Component Catalog</h1>
        <p className="text-muted-foreground">
          Browse and discover all COMP_* components in the NexusCanon system
        </p>
      </div>

      {/* Stats */}
      <ComponentStats components={MOCK_COMPONENTS} />

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            className="pl-9"
          />
        </div>
        <Tabs defaultValue="all" className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="experimental">Experimental</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Component Grid */}
      <Suspense fallback={<ComponentGridSkeleton />}>
        <ComponentGrid components={MOCK_COMPONENTS} />
      </Suspense>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ComponentStats({ components }: { components: typeof MOCK_COMPONENTS }) {
  const stats = {
    total: components.length,
    active: components.filter(c => c.meta.status === 'active').length,
    experimental: components.filter(c => c.meta.status === 'experimental').length,
    families: new Set(components.map(c => c.meta.family)).size,
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Components
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Experimental
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.experimental}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Families
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.families}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function ComponentGrid({ components }: { components: typeof MOCK_COMPONENTS }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {components.map((comp) => (
        <ComponentCard key={comp.id} component={comp} />
      ))}
    </div>
  );
}

function ComponentCard({ component }: { component: typeof MOCK_COMPONENTS[0] }) {
  const statusConfig = {
    active: { icon: CheckCircle2, color: 'text-green-600', label: 'Active' },
    experimental: { icon: Beaker, color: 'text-yellow-600', label: 'Experimental' },
    deprecated: { icon: AlertTriangle, color: 'text-red-600', label: 'Deprecated' },
  };

  const config = statusConfig[component.meta.status] || statusConfig.active;
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{component.name}</CardTitle>
            <p className="text-xs font-mono text-muted-foreground">
              {component.meta.code}
            </p>
          </div>
          <Badge variant="outline" className={config.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Family:</span>
          <Badge variant="secondary">{component.meta.family}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Purpose:</span>
          <span>{component.meta.purpose}</span>
        </div>
        <div className="text-xs text-muted-foreground font-mono truncate">
          {component.filePath}
        </div>
      </CardContent>
    </Card>
  );
}

function ComponentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
