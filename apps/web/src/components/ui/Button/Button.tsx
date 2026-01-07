import { type PropsWithChildren, useMemo } from 'react';

interface ButtonProps extends PropsWithChildren {
  variant?: 'neutral' | 'accent' | 'warning' | 'danger' | 'success' | 'transparent';
  size?: 'regular' | 'narrow';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}
const Button: React.FC<ButtonProps> = ({
  children,
  variant = '',
  size = 'regular',
  className = '',
  onClick,
  disabled,
}) => {
  const variantStyles = useMemo(() => {
    switch (variant) {
      case 'neutral':
        return 'bg-neutral-3 hover:bg-neutral-4 disabled:hover:bg-neutral-3';
      case 'accent':
        return 'bg-accent-9 hover:bg-accent-10 disabled:hover:bg-accent-9';
      case 'warning':
        return 'bg-warning-9 hover:bg-warning-10 disabled:hover:bg-warning-9';
      case 'danger':
        return 'bg-danger-9 hover:bg-danger-10 disabled:hover:bg-danger-9';
      case 'success':
        return 'bg-success-9 hover:bg-success-10 disabled:hover:bg-success-9';
      case 'transparent':
        return 'bg-transparent hover:bg-neutral-3 disabled:hover:bg-transparent';
      default:
        return 'bg-neutral-9 hover:bg-neutral-10 disabled:hover:bg-neutral-9';
    }
  }, [variant]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-7 disabled:opacity-50 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${size === 'regular' && 'h-[32px] min-w-[32px] px-2'} ${variantStyles} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
