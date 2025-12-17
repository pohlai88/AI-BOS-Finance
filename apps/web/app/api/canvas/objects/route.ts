/**
 * Canvas Objects API
 * 
 * GET /api/canvas/objects - List objects
 * POST /api/canvas/objects - Create object
 * 
 * Optimizations:
 * - Zod validation for input
 * - Proper error responses
 * - Cache headers for GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const QueryParamsSchema = z.object({
  layerType: z.enum(['data', 'team', 'personal']).optional(),
  zoneId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const CreateObjectSchema = z.object({
  objectType: z.enum(['hydrated_sticky', 'plain_sticky', 'annotation']),
  layerType: z.enum(['team', 'personal']), // 'data' layer is system-controlled
  sourceRef: z.string().regex(/^urn:aibos:ap:\d{2}:\w+:[a-f0-9-]{36}$/i).optional(),
  positionX: z.number(),
  positionY: z.number(),
  width: z.number().optional().default(280),
  height: z.number().optional().default(180),
  displayData: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    content: z.string().optional(),
    status: z.string().optional(),
  }).passthrough(),
  style: z.object({
    backgroundColor: z.string().optional(),
    borderColor: z.string().optional(),
  }).passthrough().optional(),
  tags: z.array(z.string()).optional().default([]),
  zoneId: z.string().uuid().optional(),
});

// Mock data for canvas objects
const MOCK_OBJECTS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    tenantId: 'tenant-1',
    objectType: 'hydrated_sticky',
    layerType: 'team',
    sourceRef: 'urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3',
    sourceStatus: 'active',
    positionX: 100,
    positionY: 200,
    width: 280,
    height: 180,
    zIndex: 100,
    displayData: {
      entityType: 'invoice',
      cellCode: 'AP-02',
      title: 'INV-2024-0001',
      subtitle: 'Acme Corp',
      status: 'pending_approval',
      statusColor: '#F59E0B',
      amount: '15000.00',
      currency: 'USD',
    },
    style: {
      backgroundColor: '#DBEAFE',
      borderColor: '#F59E0B',
      borderWidth: 2,
    },
    tags: ['#URGENT'],
    zoneId: 'zone-review',
    priorityScore: 75,
    requiresAcknowledgment: true,
    version: 1,
    createdAt: '2025-12-17T10:00:00Z',
    createdBy: 'user-1',
    updatedAt: '2025-12-17T10:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    tenantId: 'tenant-1',
    objectType: 'hydrated_sticky',
    layerType: 'team',
    sourceRef: 'urn:aibos:ap:05:payment:e4d909c2-9022-4d1d-8b22-1f6d9c3f1c0a',
    sourceStatus: 'active',
    positionX: 400,
    positionY: 200,
    width: 280,
    height: 180,
    zIndex: 100,
    displayData: {
      entityType: 'payment',
      cellCode: 'AP-05',
      title: 'PAY-2024-0089',
      subtitle: 'GlobalTech Ltd',
      status: 'processing',
      statusColor: '#8B5CF6',
      amount: '45000.00',
      currency: 'USD',
    },
    style: {
      backgroundColor: '#D1FAE5',
      borderColor: '#8B5CF6',
      borderWidth: 2,
    },
    tags: [],
    zoneId: 'zone-progress',
    priorityScore: 50,
    requiresAcknowledgment: false,
    version: 1,
    createdAt: '2025-12-17T09:00:00Z',
    createdBy: 'user-1',
    updatedAt: '2025-12-17T09:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query params
    const parseResult = QueryParamsSchema.safeParse({
      layerType: searchParams.get('layerType') ?? undefined,
      zoneId: searchParams.get('zoneId') ?? undefined,
      limit: searchParams.get('limit') ?? 50,
      offset: searchParams.get('offset') ?? 0,
    });
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const { layerType, zoneId, limit, offset } = parseResult.data;
    
    let objects = [...MOCK_OBJECTS];
    
    if (layerType) {
      objects = objects.filter(o => o.layerType === layerType);
    }
    
    if (zoneId) {
      objects = objects.filter(o => o.zoneId === zoneId);
    }
    
    // Apply pagination
    const total = objects.length;
    objects = objects.slice(offset, offset + limit);
    
    const response = NextResponse.json({
      objects,
      total,
      pagination: { limit, offset, hasMore: offset + limit < total },
    });
    
    // Cache for 10 seconds (canvas updates frequently)
    response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');
    
    return response;
  } catch (error) {
    console.error('Failed to fetch canvas objects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch objects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const parseResult = CreateObjectSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const validatedData = parseResult.data;
    
    // Mock creation - return the input with generated ID
    const newObject = {
      id: crypto.randomUUID(),
      tenantId: 'tenant-1', // From session in production
      ...validatedData,
      sourceStatus: 'active',
      zIndex: 100,
      priorityScore: 0,
      requiresAcknowledgment: false,
      version: 1,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user', // From session
      updatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json(newObject, { status: 201 });
  } catch (error) {
    // Handle JSON parse errors specifically
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    console.error('Failed to create canvas object:', error);
    return NextResponse.json(
      { error: 'Failed to create object' },
      { status: 500 }
    );
  }
}
