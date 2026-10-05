import { randomInt } from 'crypto'
import type { Payload, PayloadRequest } from 'payload'

// No 0/O or 1/I/L, so codes are easy to read out loud and type on a phone.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const INVITE_CODE_LENGTH = 6

export const generateInviteCode = (): string => {
  let code = ''
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)]
  }
  return code
}

export const normaliseInviteCode = (input: string): string =>
  input.replace(/[\s-]/g, '').toUpperCase()

export const generateUniqueInviteCode = async (
  payload: Payload,
  req?: PayloadRequest,
): Promise<string> => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode()
    const { totalDocs } = await payload.count({
      collection: 'users',
      where: { inviteCode: { equals: code } },
      req,
    })
    if (totalDocs === 0) return code
  }
  throw new Error('Could not generate a unique invite code')
}
