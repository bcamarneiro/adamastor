import { describe, expect, it, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import { PostalCodeInput } from './PostalCodeInput';

describe('PostalCodeInput', () => {
  it('should render the input with label', () => {
    render(<PostalCodeInput onSubmit={() => {}} />);
    expect(screen.getByLabelText('O teu codigo postal')).toBeTruthy();
  });

  it('should render the placeholder', () => {
    render(<PostalCodeInput onSubmit={() => {}} />);
    expect(screen.getByPlaceholderText('1000-001')).toBeTruthy();
  });

  it('should render the submit button', () => {
    render(<PostalCodeInput onSubmit={() => {}} />);
    expect(screen.getByRole('button', { name: 'Ver' })).toBeTruthy();
  });

  describe('input formatting', () => {
    it('should format input with hyphen after 4 digits', () => {
      render(<PostalCodeInput onSubmit={() => {}} />);
      const input = screen.getByLabelText('O teu codigo postal') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '1000001' } });
      expect(input.value).toBe('1000-001');
    });

    it('should only allow digits', () => {
      render(<PostalCodeInput onSubmit={() => {}} />);
      const input = screen.getByLabelText('O teu codigo postal') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'abc123def456' } });
      expect(input.value).toBe('1234-56');
    });

    it('should not add hyphen for less than 4 digits', () => {
      render(<PostalCodeInput onSubmit={() => {}} />);
      const input = screen.getByLabelText('O teu codigo postal') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '100' } });
      expect(input.value).toBe('100');
    });

    it('should limit to 7 digits (format XXXX-XXX)', () => {
      render(<PostalCodeInput onSubmit={() => {}} />);
      const input = screen.getByLabelText('O teu codigo postal') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '12345678901' } });
      expect(input.value).toBe('1234-567');
    });
  });

  describe('submit button state', () => {
    it('should disable submit button when input has less than 4 digits', () => {
      render(<PostalCodeInput onSubmit={() => {}} />);
      const input = screen.getByLabelText('O teu codigo postal') as HTMLInputElement;
      const button = screen.getByRole('button', { name: 'Ver' });

      fireEvent.change(input, { target: { value: '100' } });
      expect(button.hasAttribute('disabled')).toBe(true);
    });

    it('should enable submit button when input has 4 or more digits', () => {
      render(<PostalCodeInput onSubmit={() => {}} />);
      const input = screen.getByLabelText('O teu codigo postal') as HTMLInputElement;
      const button = screen.getByRole('button', { name: 'Ver' });

      fireEvent.change(input, { target: { value: '1000' } });
      expect(button.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('form submission', () => {
    it('should call onSubmit with first 4 digits when form is submitted', () => {
      const handleSubmit = mock(() => {});
      render(<PostalCodeInput onSubmit={handleSubmit} />);

      const input = screen.getByLabelText('O teu codigo postal') as HTMLInputElement;
      const form = input.closest('form')!;

      fireEvent.change(input, { target: { value: '1000001' } });
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(handleSubmit).toHaveBeenCalledWith('1000');
    });

    it('should not call onSubmit when input has less than 4 digits', () => {
      const handleSubmit = mock(() => {});
      render(<PostalCodeInput onSubmit={handleSubmit} />);

      const input = screen.getByLabelText('O teu codigo postal') as HTMLInputElement;
      const form = input.closest('form')!;

      fireEvent.change(input, { target: { value: '100' } });
      fireEvent.submit(form);

      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should disable input when loading', () => {
      render(<PostalCodeInput onSubmit={() => {}} isLoading={true} />);
      const input = screen.getByLabelText('O teu codigo postal') as HTMLInputElement;
      expect(input.hasAttribute('disabled')).toBe(true);
    });

    it('should show spinner instead of button text when loading', () => {
      render(<PostalCodeInput onSubmit={() => {}} isLoading={true} />);
      const button = screen.getByRole('button');
      expect(button.textContent).not.toContain('Ver');
      // Spinner is rendered (has the animate-spin class)
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });
  });

  describe('error state', () => {
    it('should display error message', () => {
      render(<PostalCodeInput onSubmit={() => {}} error="Código postal inválido" />);
      expect(screen.getByText('Código postal inválido')).toBeTruthy();
    });

    it('should apply error border to input', () => {
      const { container } = render(<PostalCodeInput onSubmit={() => {}} error="Erro" />);
      const input = container.querySelector('input');
      expect(input?.className).toContain('border-danger-9');
    });

    it('should not show error message when no error', () => {
      render(<PostalCodeInput onSubmit={() => {}} />);
      const errorElements = screen.queryAllByText('Código postal inválido');
      expect(errorElements.length).toBe(0);
    });
  });
});
