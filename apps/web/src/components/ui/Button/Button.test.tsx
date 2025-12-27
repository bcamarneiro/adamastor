import { describe, expect, it, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: 'Click me' })).toBeTruthy();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = mock(() => {});

    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should have type="button" by default', () => {
    render(<Button>Submit</Button>);

    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
  });

  describe('variants', () => {
    it('should apply neutral variant styles', () => {
      render(<Button variant="neutral">Neutral</Button>);

      expect(screen.getByRole('button').className).toContain('bg-neutral-3');
    });

    it('should apply accent variant styles', () => {
      render(<Button variant="accent">Accent</Button>);

      expect(screen.getByRole('button').className).toContain('bg-accent-9');
    });

    it('should apply warning variant styles', () => {
      render(<Button variant="warning">Warning</Button>);

      expect(screen.getByRole('button').className).toContain('bg-warning-9');
    });

    it('should apply danger variant styles', () => {
      render(<Button variant="danger">Danger</Button>);

      expect(screen.getByRole('button').className).toContain('bg-danger-9');
    });

    it('should apply success variant styles', () => {
      render(<Button variant="success">Success</Button>);

      expect(screen.getByRole('button').className).toContain('bg-success-9');
    });

    it('should apply transparent variant styles', () => {
      render(<Button variant="transparent">Transparent</Button>);

      expect(screen.getByRole('button').className).toContain('bg-transparent');
    });

    it('should apply default neutral-9 background when no variant', () => {
      render(<Button>Default</Button>);

      expect(screen.getByRole('button').className).toContain('bg-neutral-9');
    });
  });

  describe('sizes', () => {
    it('should apply regular size styles by default', () => {
      render(<Button>Regular</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('h-[32px]');
      expect(button.className).toContain('min-w-[32px]');
      expect(button.className).toContain('px-2');
    });

    it('should not apply size styles for narrow size', () => {
      render(<Button size="narrow">Narrow</Button>);

      const button = screen.getByRole('button');
      // narrow size doesn't have the h-[32px] class applied
      expect(button.className).not.toContain('h-[32px]');
    });
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);

    expect(screen.getByRole('button').className).toContain('custom-class');
  });

  it('should have proper layout classes', () => {
    render(<Button>Layout</Button>);

    const button = screen.getByRole('button');
    expect(button.className).toContain('rounded-md');
    expect(button.className).toContain('flex');
    expect(button.className).toContain('items-center');
    expect(button.className).toContain('justify-center');
    expect(button.className).toContain('cursor-pointer');
  });
});
