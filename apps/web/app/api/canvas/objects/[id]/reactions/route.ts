/**
 * Canvas Object Reactions API
 * 
 * POST /api/canvas/objects/:id/reactions - Add reaction
 * DELETE /api/canvas/objects/:id/reactions?emoji=:emoji - Remove reaction
 */

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { emoji } = body;
    
    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }
    
    // Mock reaction creation
    const reaction = {
      id: crypto.randomUUID(),
      objectId: id,
      userId: 'current-user', // From session
      emoji,
      createdAt: new Date().toISOString(),
    };
    
    return NextResponse.json(reaction, { status: 201 });
  } catch (error) {
    console.error('Failed to add reaction:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const emoji = searchParams.get('emoji');
    
    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji query parameter is required' },
        { status: 400 }
      );
    }
    
    // Mock reaction deletion
    return NextResponse.json({ success: true, objectId: id, emoji });
  } catch (error) {
    console.error('Failed to remove reaction:', error);
    return NextResponse.json(
      { error: 'Failed to remove reaction' },
      { status: 500 }
    );
  }
}
