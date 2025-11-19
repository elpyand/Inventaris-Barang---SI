import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mocks
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // Render a simple img for tests
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />
  },
}))

const mockSignIn = jest.fn()
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignIn,
    },
  }),
}))

import LoginPage from '../page'

describe('LoginPage', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockSignIn.mockClear()
  })

  it('berhasil login dan mengarahkan ke /dashboard', async () => {
    mockSignIn.mockResolvedValue({ error: null })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/kata sandi|password/i), { target: { value: 'password123' } })

    fireEvent.click(screen.getByRole('button', { name: /masuk/i }))

    await waitFor(() => expect(mockSignIn).toHaveBeenCalled())
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('menampilkan pesan error saat kredensial salah', async () => {
    mockSignIn.mockResolvedValue({ error: new Error('Invalid credentials') })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/kata sandi|password/i), { target: { value: 'wrongpass' } })

    fireEvent.click(screen.getByRole('button', { name: /masuk/i }))

    await waitFor(() => expect(mockSignIn).toHaveBeenCalled())

    // Error message should appear in the document (check specific message)
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
  })
})
