export default function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 110"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Roof */}
      <polygon points="15,35 50,10 85,35" />
      
      {/* Top Left Square */}
      <rect x="22" y="40" width="22" height="22" />
      
      {/* Top Right Square */}
      <rect x="49" y="40" width="22" height="22" />
      
      {/* Bottom Left Square */}
      <rect x="22" y="67" width="22" height="22" />
      
      {/* Bottom Right Large Square */}
      <rect x="49" y="67" width="38" height="38" />
    </svg>
  );
}
