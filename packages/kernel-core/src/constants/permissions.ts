/**
 * Kernel Permission Definitions (Build 3.3)
 * 
 * Centralized permission codes following convention:
 * kernel.<domain>.<resource>.<action>
 * 
 * These are seeded into the permission repository on startup.
 */

export const KERNEL_PERMISSIONS: Array<{ code: string; description: string }> = [
  // IAM Permissions
  { code: "kernel.iam.user.create", description: "Create users" },
  { code: "kernel.iam.user.list", description: "List users" },
  { code: "kernel.iam.role.create", description: "Create roles" },
  { code: "kernel.iam.role.list", description: "List roles" },
  { code: "kernel.iam.role.assign", description: "Assign roles to users" },
  { code: "kernel.iam.credential.set_password", description: "Set user passwords" },

  // Registry Permissions
  { code: "kernel.registry.canon.register", description: "Register Canons" },
  { code: "kernel.registry.route.create", description: "Create route mappings" },
  { code: "kernel.registry.route.list", description: "List route mappings" },

  // Gateway Permissions
  { code: "kernel.gateway.proxy.invoke", description: "Invoke Gateway proxy" },

  // Event Permissions
  { code: "kernel.event.publish", description: "Publish events" },

  // Audit Permissions
  { code: "kernel.audit.read", description: "Read audit trail" },
];
