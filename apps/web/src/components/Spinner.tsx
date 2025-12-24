interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner = ({ size = 'md', className = '' }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-600 ${sizeClasses[size]} ${className}`}
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
