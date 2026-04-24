import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LineItemTable from '../LineItemTable';

describe('LineItemTable', () => {
  const mockLineItems = [
    { id: '1', description: 'Drywall Installation', quantity: 100, unitPrice: 12.50, unit: 'ea', total: 1250 },
    { id: '2', description: 'Paint Labor', quantity: 8, unitPrice: 75, unit: 'hr', total: 600 },
  ];

  const defaultProps = {
    items: mockLineItems,
    editable: true,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders existing line items', () => {
    render(<LineItemTable {...defaultProps} />);
    expect(screen.getByDisplayValue('Drywall Installation')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Paint Labor')).toBeInTheDocument();
  });

  it('renders correct number of rows', () => {
    render(<LineItemTable {...defaultProps} />);
    const rows = screen.getAllByRole('row');
    // header row + 2 data rows
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  it('shows add row button when editable', () => {
    render(<LineItemTable {...defaultProps} />);
    expect(screen.getByText(/add line item/i)).toBeInTheDocument();
  });

  it('calls onChange when add row button is clicked', () => {
    render(<LineItemTable {...defaultProps} />);
    fireEvent.click(screen.getByText(/add line item/i));
    expect(defaultProps.onChange).toHaveBeenCalled();
    const updatedItems = defaultProps.onChange.mock.calls[0][0];
    expect(updatedItems).toHaveLength(3);
  });

  it('calls onChange when delete row button is clicked', () => {
    render(<LineItemTable {...defaultProps} />);
    const deleteButtons = screen.getAllByLabelText(/remove/i);
    fireEvent.click(deleteButtons[0]);
    expect(defaultProps.onChange).toHaveBeenCalled();
    const updatedItems = defaultProps.onChange.mock.calls[0][0];
    expect(updatedItems).toHaveLength(1);
  });

  it('displays row totals formatted as currency', () => {
    render(<LineItemTable {...defaultProps} />);
    expect(screen.getByText('$1,250.00')).toBeInTheDocument();
    expect(screen.getByText('$600.00')).toBeInTheDocument();
  });

  it('calls onChange when a value is updated', () => {
    render(<LineItemTable {...defaultProps} />);
    const quantityInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(quantityInputs[0], { target: { value: '200' } });
    expect(defaultProps.onChange).toHaveBeenCalled();
  });

  it('renders without edit controls when not editable', () => {
    render(<LineItemTable items={mockLineItems} editable={false} />);
    expect(screen.queryByText(/add line item/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/remove/i)).not.toBeInTheDocument();
  });
});
