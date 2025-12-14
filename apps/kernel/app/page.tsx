/**
 * Kernel Home Page
 * 
 * Simple landing page for the Kernel service.
 * Redirects to health check or provides basic info.
 */

export default function KernelHome() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>🧠 AIBOS Kernel</h1>
      <p>Control Plane Service - API Only</p>
      <ul>
        <li>
          <a href="/api/kernel/health">GET /api/kernel/health</a> - Health check
        </li>
        <li>
          <a href="/api/kernel/tenants">GET /api/kernel/tenants</a> - List tenants
        </li>
      </ul>
      <hr />
      <p style={{ color: "#666", fontSize: "0.875rem" }}>
        Build 1 - Walking Skeleton MVP
      </p>
    </main>
  );
}

