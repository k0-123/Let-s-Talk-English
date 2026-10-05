import { render, screen, userEvent } from '@testing-library/react-native'

import Login from '@/app/(auth)/login'
import { ApiError } from '@/lib/api'

const mockSignIn = jest.fn()

jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ signIn: mockSignIn }) }))
jest.mock('expo-router', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Link: ({ children }: { children: unknown }) => React.createElement(Text, null, children),
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  }
})

describe('Log in screen', () => {
  beforeEach(() => mockSignIn.mockReset())

  it('asks for both fields before calling the server', async () => {
    const user = userEvent.setup()
    await render(<Login />)
    await user.press(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.getByText('Enter your email and password.')).toBeOnTheScreen()
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('signs in with what was typed', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValueOnce(undefined)
    await render(<Login />)
    await user.type(screen.getByLabelText('Email'), 'student@example.com')
    await user.type(screen.getByLabelText('Password'), 'Password123!')
    await user.press(screen.getByRole('button', { name: 'Log in' }))
    expect(mockSignIn).toHaveBeenCalledWith('student@example.com', 'Password123!')
  })

  it('explains a wrong password in plain words', async () => {
    const user = userEvent.setup()
    mockSignIn.mockRejectedValueOnce(new ApiError(401, 'The email or password provided is incorrect.'))
    await render(<Login />)
    await user.type(screen.getByLabelText('Email'), 'student@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.press(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText('That email and password do not match.')).toBeOnTheScreen()
  })
})
