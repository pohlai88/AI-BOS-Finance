/**
 * GET /api/ar/customers/:id/contacts - List customer contacts
 * POST /api/ar/customers/:id/contacts - Add customer contact
 * 
 * AR-01 Customer Master Cell - BFF Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateContactInputSchema } from '@/src/features/customer/schemas';
import { getCustomerService } from '@/lib/customer-services.server';
import { apiRoute, RateLimitPresets, ValidationError, apiCache, cacheKey, CacheTTL } from '@/lib/api';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================================
// GET /api/ar/customers/:id/contacts - List Contacts
// ============================================================================

export const GET = apiRoute(
  RateLimitPresets.READ,
  async (request: NextRequest, actor, context?: RouteContext) => {
    const { id } = await context!.params;

    const key = cacheKey('customer-contacts', actor.tenantId, id);

    const contacts = await apiCache.getOrSet(
      key,
      async () => {
        const customerService = await getCustomerService();
        return customerService.getContacts(id, actor);
      },
      { ttl: CacheTTL.SHORT, tags: [`customer:${id}`, `tenant:${actor.tenantId}`] }
    );

    return NextResponse.json(contacts);
  }
);

// ============================================================================
// POST /api/ar/customers/:id/contacts - Add Contact
// ============================================================================

export const POST = apiRoute(
  RateLimitPresets.MUTATION,
  async (request: NextRequest, actor, context?: RouteContext) => {
    const { id } = await context!.params;
    const body = await request.json();

    const validation = CreateContactInputSchema.safeParse(body);
    if (!validation.success) {
      throw ValidationError.fromZod(validation.error);
    }

    const customerService = await getCustomerService();

    const contact = await customerService.addContact(
      id,
      {
        customerId: id,
        tenantId: actor.tenantId,
        contactType: validation.data.contactType,
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
        email: validation.data.email,
        phone: validation.data.phone,
        title: validation.data.title,
        isPrimary: validation.data.isPrimary,
        receivesInvoices: validation.data.receivesInvoices,
        receivesStatements: validation.data.receivesStatements,
      },
      actor
    );

    await apiCache.invalidateByTag(`customer:${id}`);

    return NextResponse.json(contact, { status: 201 });
  }
);
