/** Sello oficial — anillo lime, tipografía perimetral y CG central con drips */
export function Sello({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      role="img"
      aria-label="Capital Gang sello 2026"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="120" cy="120" r="112" fill="none" stroke="#D6FF2F" strokeWidth="3" />
      <circle cx="120" cy="120" r="102" fill="none" stroke="#D6FF2F" strokeWidth="1.25" opacity="0.85" />

      <defs>
        <path id="cgSealTop" d="M40 120a80 80 0 0 1 160 0" fill="none" />
        <path id="cgSealBottom" d="M40 120a80 80 0 0 0 160 0" fill="none" />
      </defs>

      <text fill="#D6FF2F" fontSize="11" fontWeight="700" letterSpacing="4" fontFamily="var(--font-body), sans-serif">
        <textPath href="#cgSealTop" startOffset="50%" textAnchor="middle">
          CAPITAL GANG
        </textPath>
      </text>

      <text fill="#D6FF2F" fontSize="8" fontWeight="600" letterSpacing="2.5" fontFamily="var(--font-body), sans-serif">
        <textPath href="#cgSealBottom" startOffset="50%" textAnchor="middle">
          CLOTHING • TATTOO • CULTURE
        </textPath>
      </text>

      <text
        x="28"
        y="126"
        fill="#D6FF2F"
        fontSize="14"
        fontWeight="700"
        fontFamily="var(--font-body), sans-serif"
      >
        20
      </text>
      <text
        x="196"
        y="126"
        fill="#D6FF2F"
        fontSize="14"
        fontWeight="700"
        fontFamily="var(--font-body), sans-serif"
      >
        26
      </text>

      {/* CG central */}
      <g fill="#FFFFFF" transform="translate(68 62)">
        <path d="M68 10c-7.6-6.1-17.2-8.8-27.3-7.4C19.5 5.4 7 20 7 39.8c0 20.2 13 35 32.4 37.1 10.3 1.1 20.2-1.6 27.6-7.9l-8.3-10.3c-4.7 3.8-10.8 5.7-17.3 5-11.9-1.3-20-10.8-20-23.9 0-12.8 7.9-22.1 19.6-23.6 6.3-.8 12.2.9 16.6 4.3L68 10Z" />
        <path d="M50 24.5c-9.7 0-17.3 7.2-17.3 16.9 0 9.5 7.4 16.7 17.1 16.7 4.9 0 9.2-1.6 12.2-4.5v-5.6H50.7V37h25.6v23.4c-5.6 5.2-13.3 8.3-22.1 8.3-16.9 0-29.9-12.4-29.9-30.1C24.3 21.5 36.9 9 54 9c7.6 0 14.4 2.5 19.6 6.8l-8.5 10.1C61.8 23.3 56.2 24.5 50 24.5Z" />
        <rect x="28" y="36" width="9" height="5" fill="#0A0A0A" />
        <rect x="56" y="36" width="9" height="5" fill="#0A0A0A" />
        {/* drips */}
        <path d="M22 86c0 4 1.1 8 1.1 11.8 0 2-.9 3-2 3s-2-1-2-3c0-3.8 1-7.8 1-11.8h1.9Z" />
        <path d="M44 88c0 5 1.3 10 1.3 14.2 0 2.3-1 3.6-2.2 3.6s-2.2-1.3-2.2-3.6C40.9 98 42.2 93 42.2 88H44Z" />
        <path d="M68 85c0 3.4.9 6.8.9 10 0 1.6-.7 2.5-1.6 2.5s-1.6-.9-1.6-2.5c0-3.2.8-6.6.8-10H68Z" />
        <path d="M86 87c0 3.8 1 7.6 1 11 0 1.8-.8 2.8-1.8 2.8s-1.8-1-1.8-2.8c0-3.4.9-7.2.9-11H86Z" />
      </g>
    </svg>
  );
}
