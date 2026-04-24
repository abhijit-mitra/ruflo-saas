import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AmountSummary from '../AmountSummary';

describe('AmountSummary', () => {
  const defaultProps = {
    subtotal: 1850,
    taxRate: 8.5,
    taxAmount: 157.25,
    discountAmount: 0,
    discountRate: 0,
    total: 2007.25,
  };

  it('shows subtotal', () => {
    render(<AmountSummary {...defaultProps} />);
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('$1,850.00')).toBeInTheDocument();
  });

  it('shows tax amount with rate', () => {
    render(<AmountSummary {...defaultProps} />);
    expect(screen.getByText('Tax (8.5%)')).toBeInTheDocument();
    expect(screen.getByText('$157.25')).toBeInTheDocument();
  });

  it('shows discount when present', () => {
    render(
      <AmountSummary
        {...defaultProps}
        discountRate={10}
        discountAmount={185}
        total={1822.25}
      />,
    );
    expect(screen.getByText('Discount (10%)')).toBeInTheDocument();
    expect(screen.getByText('-$185.00')).toBeInTheDocument();
  });

  it('shows total', () => {
    render(<AmountSummary {...defaultProps} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$2,007.25')).toBeInTheDocument();
  });

  it('calculates displayed total correctly', () => {
    const props = {
      subtotal: 1000,
      taxRate: 8.5,
      taxAmount: 85,
      discountRate: 10,
      discountAmount: 100,
      total: 985,
    };
    render(<AmountSummary {...props} />);
    expect(screen.getByText('$985.00')).toBeInTheDocument();
  });
});
