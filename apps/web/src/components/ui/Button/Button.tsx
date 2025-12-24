import { type PropsWithChildren, useMemo } from 'react';

interface ButtonProps extends PropsWithChildren {
  variant?:
    | 'neutral'
    | 'accent'
    | 'warning'
    | 'danger'
    | 'success'
    | 'transparent';
  size?: 'regular' | 'narrow';
  className?: string;
  onClick?: () => void;
}
const Button: React.FC<ButtonProps> = ({
  children,
  variant = '',
  size = 'regular',
  className = '',
  onClick,
}) => {
  const bgColor = useMemo(() => {
    switch (variant) {
      case 'neutral':
        return 'bg-neutral-3';
      case 'accent':
        return 'bg-accent-9';
      case 'warning':
        return 'bg-warning-9';
      case 'danger':
        return 'bg-danger-9';
      case 'success':
        return 'bg-success-9';
      case 'transparent':
        return 'bg-transparent';
      default:
        return 'bg-neutral-9';
    }
  }, [variant]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md flex items-center justify-center cursor-pointer ${size === 'regular' && 'h-[32px] min-w-[32px] px-2'} ${bgColor} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
