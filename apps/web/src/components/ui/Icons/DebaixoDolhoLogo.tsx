/**
 * Debaixo d'olho Logo
 *
 * A stylized pixelated eye logo inspired by Camões (the one-eyed Portuguese poet).
 * The design represents "watching" politicians - the project's mission.
 *
 * Sizes: sm (24px), md (32px), lg (48px)
 */

interface DebaixoDolhoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 24,
  md: 32,
  lg: 48,
};

const DebaixoDolhoLogo = ({ className = '', size = 'md' }: DebaixoDolhoLogoProps) => {
  const dimension = sizes[size];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={dimension}
      height={dimension}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
    >
      <title>Debaixo d'olho</title>

      {/* Eye outline - pixelated style */}
      <g fill="currentColor">
        {/* Top of eye */}
        <rect x="8" y="8" width="4" height="4" />
        <rect x="12" y="4" width="4" height="4" />
        <rect x="16" y="4" width="4" height="4" />
        <rect x="20" y="8" width="4" height="4" />

        {/* Sides of eye */}
        <rect x="4" y="12" width="4" height="4" />
        <rect x="24" y="12" width="4" height="4" />
        <rect x="4" y="16" width="4" height="4" />
        <rect x="24" y="16" width="4" height="4" />

        {/* Bottom of eye */}
        <rect x="8" y="20" width="4" height="4" />
        <rect x="12" y="24" width="4" height="4" />
        <rect x="16" y="24" width="4" height="4" />
        <rect x="20" y="20" width="4" height="4" />
      </g>

      {/* Iris - green (Portuguese flag color) */}
      <g fill="#046A38">
        <rect x="10" y="12" width="4" height="4" />
        <rect x="10" y="16" width="4" height="4" />
        <rect x="14" y="12" width="4" height="4" />
        <rect x="14" y="16" width="4" height="4" />
        <rect x="18" y="12" width="4" height="4" />
        <rect x="18" y="16" width="4" height="4" />
      </g>

      {/* Pupil - dark center */}
      <g fill="#1a1a1a">
        <rect x="14" y="12" width="4" height="4" />
        <rect x="14" y="16" width="4" height="4" />
      </g>

      {/* Highlight - top right of pupil */}
      <rect x="16" y="12" width="2" height="2" fill="white" opacity="0.7" />
    </svg>
  );
};

export default DebaixoDolhoLogo;
