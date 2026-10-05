import { ApiError } from '@/lib/api'
import { loginErrorMessage, registerErrorMessage, validateRegistration } from '@/lib/messages'

describe('messages', () => {
  it('rewords login errors like the website does', () => {
    expect(loginErrorMessage(new ApiError(401, 'The email or password provided is incorrect.'))).toBe('That email and password do not match.')
    expect(loginErrorMessage(new ApiError(403, 'Please verify your email before logging in.'))).toMatch(/confirm your email/)
    expect(loginErrorMessage(new ApiError(401, 'This user is locked due to having too many failed login attempts.'))).toMatch(/locked/)
    expect(loginErrorMessage(new ApiError(403, 'Your educator account is waiting for approval.'))).toBe('Your educator account is waiting for approval.')
    expect(loginErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.')
  })

  it('points a duplicate email at the email field', () => {
    expect(registerErrorMessage(new ApiError(400, 'A user with the given email is already registered.'))).toEqual({
      field: 'email',
      message: 'An account with this email already exists. Log in or reset your password.',
    })
    expect(registerErrorMessage(new ApiError(400, 'Something else'))).toEqual({ message: 'Something else' })
  })

  it('checks sign-up fields before sending', () => {
    expect(validateRegistration({ name: 'A', email: 'nope', password: 'short', confirmPassword: 'other' })).toEqual({
      name: 'Enter your name.',
      email: 'Enter a valid email address.',
      password: 'Use at least 8 characters.',
      confirmPassword: 'The passwords do not match.',
    })
    expect(validateRegistration({ name: 'Priya', email: 'priya@example.com', password: 'Password123!', confirmPassword: 'Password123!' })).toEqual({})
  })
})
