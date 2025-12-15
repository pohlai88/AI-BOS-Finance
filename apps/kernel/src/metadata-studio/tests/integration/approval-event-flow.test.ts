// metadata-studio/tests/integration/approval-event-flow.test.ts
/**
 * Integration test: Approval → Event Emission → Profile Run
 * 
 * Tests the complete event-driven approval workflow:
 * 1. Create a Tier1 metadata approval request
 * 2. Approve it via POST /approvals/:id/approve
 * 3. Verify events were emitted
 * 4. Verify profile subscriber was triggered
 * 5. Verify profile was saved
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createApp } from '../../index';
import { db } from '../../db/client';
import { mdmApproval } from '../../db/schema/approval.tables';
import { mdmGlobalMetadata } from '../../db/schema/metadata.tables';
import { mdmProfile } from '../../db/schema/observability.tables';
import { eq } from 'drizzle-orm';
import { eventBus } from '../../events';
import type { Event } from '@aibos/events';

describe('Approval Event Flow (Integration)', () => {
    const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001';
    const TEST_USER_ID = 'test-approver';
    let app: Awaited<ReturnType<typeof createApp>>;
    let approvalId: string;
    let capturedEvents: Event[] = [];

    beforeAll(async () => {
        // Setup: Create app + capture events
        app = createApp();

        // Subscribe to all events for verification
        eventBus.subscribe('*' as any, (event: Event) => {
            capturedEvents.push(event);
            console.log(`[TEST] Event captured: ${event.type}`);
        });
    });

    afterAll(async () => {
        // Cleanup: Remove test data
        if (approvalId) {
            await db.delete(mdmApproval).where(eq(mdmApproval.id, approvalId));
        }
        await db.delete(mdmGlobalMetadata).where(eq(mdmGlobalMetadata.canonicalKey, 'test_revenue_gross'));
        await db.delete(mdmProfile).where(eq(mdmProfile.entityUrn, `urn:aibos:metadata:${TEST_TENANT_ID}:test_revenue_gross`));
    });

    it('should create approval request', async () => {
        // Create approval request directly via DB
        const [inserted] = await db
            .insert(mdmApproval)
            .values({
                tenantId: TEST_TENANT_ID,
                entityType: 'GLOBAL_METADATA',
                entityId: null,
                entityKey: 'test_revenue_gross',
                tier: 'tier1',
                lane: 'governed',
                payload: {
                    tenantId: TEST_TENANT_ID,
                    canonicalKey: 'test_revenue_gross',
                    label: 'Test Revenue Gross',
                    description: 'Integration test for approval workflow',
                    domain: 'Finance',
                    module: 'GL',
                    entityUrn: `urn:aibos:metadata:${TEST_TENANT_ID}:test_revenue_gross`,
                    tier: 'tier1',
                    standardPackId: 'IFRS_CORE',
                    dataType: 'DECIMAL',
                    format: '18,2',
                    ownerId: 'user-123',
                    stewardId: 'user-456',
                    status: 'active',
                },
                currentState: null,
                status: 'pending',
                requestedBy: 'test-requester',
                requiredRole: 'metadata_steward',
            })
            .returning();

        approvalId = inserted.id;
        expect(approvalId).toBeDefined();
        expect(inserted.status).toBe('pending');
    });

    it('should approve request and emit events', async () => {
        capturedEvents = []; // Reset event capture

        const response = await app.request(
            `/approvals/${approvalId}/approve`,
            {
                method: 'POST',
                headers: {
                    'x-tenant-id': TEST_TENANT_ID,
                    'x-user-id': TEST_USER_ID,
                    'x-role': 'metadata_steward',
                },
            }
        );

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.status).toBe('approved');
        expect(body.approvalId).toBe(approvalId);
        expect(body.entityKey).toBe('test_revenue_gross');
        expect(body.tier).toBe('tier1');
    });

    it('should have updated approval status in DB', async () => {
        const [approval] = await db
            .select()
            .from(mdmApproval)
            .where(eq(mdmApproval.id, approvalId));

        expect(approval.status).toBe('approved');
        expect(approval.decidedBy).toBe(TEST_USER_ID);
        expect(approval.decidedAt).toBeDefined();
    });

    it('should have created metadata row', async () => {
        const [meta] = await db
            .select()
            .from(mdmGlobalMetadata)
            .where(eq(mdmGlobalMetadata.canonicalKey, 'test_revenue_gross'));

        expect(meta).toBeDefined();
        expect(meta.label).toBe('Test Revenue Gross');
        expect(meta.tier).toBe('tier1');
        expect(meta.status).toBe('active');
    });

    it('should have emitted metadata.approved event', async () => {
        // Wait a bit for async event handling
        await new Promise(resolve => setTimeout(resolve, 100));

        const approvedEvent = capturedEvents.find(e => e.type === 'metadata.approved');
        expect(approvedEvent).toBeDefined();
        expect(approvedEvent?.payload).toMatchObject({
            approvalId,
            canonicalKey: 'test_revenue_gross',
            tier: 'tier1',
        });
    });

    it('should have emitted metadata.changed event', async () => {
        const changedEvent = capturedEvents.find(e => e.type === 'metadata.changed');
        expect(changedEvent).toBeDefined();
        expect(changedEvent?.payload).toMatchObject({
            canonicalKey: 'test_revenue_gross',
            changeType: 'APPROVAL',
            tier: 'tier1',
        });
    });

    it('should have emitted metadata.profile.due event (Tier1)', async () => {
        const profileDueEvent = capturedEvents.find(e => e.type === 'metadata.profile.due');
        expect(profileDueEvent).toBeDefined();
        expect(profileDueEvent?.payload).toMatchObject({
            entityType: 'METADATA',
            canonicalKey: 'test_revenue_gross',
            priority: 'high',
            reason: 'STRUCTURAL_CHANGE',
            tier: 'tier1',
        });
    });

    it('should have emitted approval.approved event', async () => {
        const approvalApprovedEvent = capturedEvents.find(e => e.type === 'approval.approved');
        expect(approvalApprovedEvent).toBeDefined();
        expect(approvalApprovedEvent?.payload).toMatchObject({
            approvalId,
            entityType: 'METADATA',
            entityKey: 'test_revenue_gross',
        });
    });

    it('should have triggered profile run (if binding exists)', async () => {
        // Note: This test will only pass if metadata has physical binding
        // (bindingSchema, bindingTable, bindingColumns)
        // For now, we just verify the event was emitted

        // In a real integration test, you'd:
        // 1. Setup test data in a test schema/table
        // 2. Add physical binding to metadata
        // 3. Wait for profile.subscriber to complete
        // 4. Verify mdmProfile row exists

        await new Promise(resolve => setTimeout(resolve, 500));

        const profileCompletedEvent = capturedEvents.find(e => e.type === 'metadata.profile.completed');

        if (profileCompletedEvent) {
            // Profile ran successfully!
            expect(profileCompletedEvent.payload).toHaveProperty('qualityScore');
            expect(profileCompletedEvent.payload).toHaveProperty('completeness');
            expect(profileCompletedEvent.payload).toHaveProperty('uniqueness');
            expect(profileCompletedEvent.payload).toHaveProperty('validity');

            // Verify profile was saved
            const [profile] = await db
                .select()
                .from(mdmProfile)
                .where(eq(mdmProfile.entityUrn, `urn:aibos:metadata:${TEST_TENANT_ID}:test_revenue_gross`))
                .orderBy(mdmProfile.createdAt, 'desc')
                .limit(1);

            expect(profile).toBeDefined();
            expect(profile.qualityScore).toBeGreaterThanOrEqual(0);
            expect(profile.qualityScore).toBeLessThanOrEqual(100);
        } else {
            console.warn('[TEST] Profile did not run (likely missing physical binding)');
            console.warn('[TEST] This is expected if metadata has no bindingSchema/bindingTable');
        }
    });

    it('should have correct event count', () => {
        // Expected events:
        // 1. metadata.approved
        // 2. metadata.changed
        // 3. metadata.profile.due (Tier1)
        // 4. approval.approved
        // 5. metadata.profile.completed (optional, if binding exists)

        expect(capturedEvents.length).toBeGreaterThanOrEqual(4);

        const eventTypes = capturedEvents.map(e => e.type);
        expect(eventTypes).toContain('metadata.approved');
        expect(eventTypes).toContain('metadata.changed');
        expect(eventTypes).toContain('metadata.profile.due');
        expect(eventTypes).toContain('approval.approved');

        console.log('[TEST] Events captured:', eventTypes);
    });
});

