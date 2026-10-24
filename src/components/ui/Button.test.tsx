/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button UI Primitive', () => {
  it('renders button label properly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles loading state with spinner and disables button', () => {
    render(<Button isLoading>Submitting</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  it('applies primary variant styling', () => {
    render(<Button variant="primary">Primary Action</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-[#059669]');
  });
});
