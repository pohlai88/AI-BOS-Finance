// ============================================================================
// HEX GRID BACKGROUND - Hexagonal force field pattern
// Powers up (reveals more) as stage increases
// ============================================================================

interface HexGridBackgroundProps {
  stage: number;
  maxStages?: number;
}

export const HexGridBackground = ({ stage, maxStages = 6 }: HexGridBackgroundProps) => {
  const revealPercentage = (stage / maxStages) * 100;

  return (
    <div
      className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='40' viewBox='0 0 24 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40c5.523 0 10-4.477 10-10V10c0-5.523-4.477-10-10-10s-10 4.477-10 10v20c0 5.523 4.477 10 10 10z' fill='none' stroke='%2328E7A2' stroke-width='1' opacity='0.3'/%3E%3C/svg%3E")`,
        maskImage: `linear-gradient(to top, rgba(0,0,0,1) ${revealPercentage}%, transparent 100%)`,
        WebkitMaskImage: `linear-gradient(to top, rgba(0,0,0,1) ${revealPercentage}%, transparent 100%)`,
      }}
    />
  );
};
