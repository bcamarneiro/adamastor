import { Spinner } from '@/components/Spinner';

interface LoadingDisplayProps {
  message?: string;
}

const LoadingDisplay: React.FC<LoadingDisplayProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="flex flex-col justify-center items-center h-64 gap-4">
      <Spinner size="lg" />
      {message && <p className="text-neutral-11">{message}</p>}
    </div>
  );
};

export default LoadingDisplay;
