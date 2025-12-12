/**
 * 🛡️ Drift Police Validation Test
 * 
 * This file tests that the Drift Police ESLint rule is working correctly.
 * 
 * EXPECTED BEHAVIOR:
 * - This file should trigger ESLint errors for disallowed colors
 * - Run: npm run lint:drift
 * - You should see errors for bg-[#...], text-red-500, etc.
 * 
 * After validation, you can delete this file or keep it as a reference.
 */

export function DriftPoliceTest() {
  return (
    <div>
      {/* ❌ These should trigger Drift Police errors */}
      {/* Test 1: Arbitrary hex colors */}
      <div className="bg-[#123456]" />
      <div className="text-[#FF0000]" />
      <div className="border-[#00FF00]" />

      {/* Test 2: Tailwind palette colors */}
      <div className="bg-red-500" />
      <div className="text-amber-400" />
      <div className="border-emerald-500" />
      <div className="bg-slate-200" />

      {/* Test 3: With opacity */}
      <div className="bg-red-500/50" />
      <div className="text-amber-400/75" />

      {/* ✅ These should NOT trigger errors (governed tokens) */}
      <div className="bg-surface-base" />
      <div className="text-text-primary" />
      <div className="bg-status-success" />
      <div className="text-status-error" />
      <div className="border-border-surface-base" />

      {/* ✅ Standard spacing (not color-related) */}
      <div className="p-4 m-2" />

      {/* Test 4: Inline styles (should trigger Phase E rule) */}
      {/* ❌ These should trigger no-inline-style-colors errors */}
      <div style={{ color: "#ff0000" }} />
      <div style={{ backgroundColor: "rgb(255, 0, 0)" }} />
      <div style={{ borderColor: "#00ff00" }} />

      {/* ✅ These should NOT trigger errors */}
      <div style={{ color: "var(--text-primary)" }} />
      <div style={{ backgroundColor: "var(--surface-base)" }} />
      <div style={{ width: "100px" }} />

      {/* Test 5: SVG attributes (should trigger Phase E rule) */}
      {/* ❌ These should trigger no-svg-hardcoded-colors errors */}
      <svg>
        <path fill="#28E7A2" />
        <circle stroke="rgb(40, 231, 162)" />
        <rect fill="red" />
      </svg>

      {/* ✅ These should NOT trigger errors */}
      <svg>
        <path fill="var(--action-primary)" />
        <circle fill="currentColor" />
        <rect fill="none" />
      </svg>
    </div>
  );
}
