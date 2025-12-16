/**
 * Exception Resolution API
 * 
 * POST /api/payments/exceptions/[exceptionId]/resolve - Resolve an exception
 * DELETE /api/payments/exceptions/[exceptionId]/resolve - Unresolve an exception
 * 
 * Phase 6a Enhancement: Risk Queue
 */

import { NextRequest, NextResponse, type RouteContext } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/db';
import { getActorContext } from '@/lib/payment-services.server';
import { ExceptionService } from '@aibos/canon';

const ResolveSchema = z.object({
  resolution: z.string().min(1).max(1000),
});

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/payments/exceptions/[exceptionId]/resolve'>
) {
  try {
    const params = await ctx.params;
    const exceptionId = params.exceptionId;

    const actor = await getActorContext(request);
    const pool = getPool();
    const body = await request.json();

    const input = ResolveSchema.parse(body);

    const exceptionService = new ExceptionService(pool);
    const result = await exceptionService.resolveException(
      exceptionId,
      input.resolution,
      actor
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Exception resolution failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resolve exception' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<'/api/payments/exceptions/[exceptionId]/resolve'>
) {
  try {
    const params = await ctx.params;
    const exceptionId = params.exceptionId;

    const actor = await getActorContext(request);
    const pool = getPool();

    const exceptionService = new ExceptionService(pool);
    await exceptionService.unresolveException(exceptionId, actor);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Exception unresolve failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unresolve exception' },
      { status: 500 }
    );
  }
}
