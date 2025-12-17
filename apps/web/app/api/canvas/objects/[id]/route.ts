/**
 * Canvas Object API
 * 
 * GET /api/canvas/objects/:id - Get single object
 * PATCH /api/canvas/objects/:id - Update object
 * DELETE /api/canvas/objects/:id - Delete object
 */

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Mock object lookup
    const mockObject = {
      id,
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
      // Aggregates
      reactions: [
        { emoji: '🚩', count: 2, userIds: ['user-1', 'user-2'] },
        { emoji: '👀', count: 1, userIds: ['user-3'] },
      ],
      acknowledgments: [],
    };
    
    return NextResponse.json(mockObject);
  } catch (error) {
    console.error('Failed to fetch canvas object:', error);
    return NextResponse.json(
      { error: 'Failed to fetch object' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const expectedVersion = body.version;
    
    // Mock update with version check
    const updatedObject = {
      id,
      ...body,
      version: (expectedVersion ?? 1) + 1,
      updatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json(updatedObject);
  } catch (error) {
    console.error('Failed to update canvas object:', error);
    return NextResponse.json(
      { error: 'Failed to update object' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Mock deletion
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Failed to delete canvas object:', error);
    return NextResponse.json(
      { error: 'Failed to delete object' },
      { status: 500 }
    );
  }
}
