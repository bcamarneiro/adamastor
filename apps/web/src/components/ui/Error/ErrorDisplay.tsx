interface ErrorDisplayProps {
  title?: string;
  error: Error | unknown;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Error',
  error,
}) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-red-600 text-center">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p>
          {error instanceof Error
            ? error.message
            : 'An unexpected error occurred'}
        </p>
      </div>
    </div>
  );
};

export default ErrorDisplay;
