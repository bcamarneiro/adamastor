/**
 * Debaixo d'olho Logo
 *
 * Two overlapping leaf shapes (green + red) forming an eye,
 * with a white pupil at the intersection. Portuguese flag colors.
 *
 * Sizes: sm (24px), md (32px), lg (48px)
 * Pass className with width/height classes to override dimensions.
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
  const hasExplicitSize = /\bw-\d|h-\d/.test(className);

  return (
    <img
      src="/images/logo.png"
      alt="Debaixo d'olho"
      width={dimension}
      height={dimension}
      className={className}
      style={
        hasExplicitSize
          ? { objectFit: 'contain' }
          : { width: dimension, height: dimension, objectFit: 'contain' }
      }
    />
  );
};

export default DebaixoDolhoLogo;
