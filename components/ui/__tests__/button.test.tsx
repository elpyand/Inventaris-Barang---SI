import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('merender label tombol dengan benar', () => {
    render(<Button>Tekan Saya</Button>);
    expect(screen.getByRole('button', { name: 'Tekan Saya' })).toBeInTheDocument();
  });

  it('memanggil fungsi onClick saat diklik', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Klik</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Klik' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('tidak bisa diklik saat disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Nonaktif</Button>);
    const btn = screen.getByRole('button', { name: 'Nonaktif' });
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
    expect(btn).toBeDisabled();
  });
});
