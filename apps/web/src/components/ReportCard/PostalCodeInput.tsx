import { useCallback, useState } from 'react';

interface PostalCodeInputProps {
  onSubmit: (postalCode: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function PostalCodeInput({ onSubmit, isLoading, error }: PostalCodeInputProps) {
  const [value, setValue] = useState('');

  const formatPostalCode = useCallback((input: string) => {
    // Remove non-digits
    const digits = input.replace(/\D/g, '');

    // Format as XXXX-XXX
    if (digits.length <= 4) {
      return digits;
    }
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}`;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostalCode(e.target.value);
    setValue(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 4) {
      onSubmit(digits.substring(0, 4));
    }
  };

  const isValid = value.replace(/\D/g, '').length >= 4;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
      <div className="flex flex-col gap-2">
        <label htmlFor="postal-code" className="text-sm font-medium text-neutral-11">
          O teu codigo postal
        </label>
        <div className="flex gap-2">
          <input
            id="postal-code"
            type="text"
            inputMode="numeric"
            placeholder="1000-001"
            value={value}
            onChange={handleChange}
            maxLength={8}
            className={`flex-1 px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-9 ${
              error ? 'border-danger-9' : 'border-neutral-6'
            }`}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="px-6 py-3 bg-accent-9 text-monochrome-white font-medium rounded-lg hover:bg-accent-10 focus:outline-none focus:ring-2 focus:ring-accent-9 focus:ring-offset-2 disabled:bg-neutral-8 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-monochrome-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Ver'
            )}
          </button>
        </div>
        {error && <p className="text-sm text-danger-11">{error}</p>}
      </div>
    </form>
  );
}
