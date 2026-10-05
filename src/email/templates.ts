import { SITE_NAME } from '@/lib/constants'
import { getServerURL } from '@/lib/server-url'

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

type LayoutArgs = {
  heading: string
  intro: string
  buttonLabel: string
  url: string
  footer: string
}

const layout = ({ heading, intro, buttonLabel, url, footer }: LayoutArgs): string => `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;">
      <tr><td style="padding:32px;">
        <p style="margin:0 0 8px;font-size:14px;color:#52606d;">${escapeHtml(SITE_NAME)}</p>
        <h1 style="margin:0 0 16px;font-size:22px;">${escapeHtml(heading)}</h1>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.5;">${escapeHtml(intro)}</p>
        <p style="margin:0 0 24px;">
          <a href="${url}" style="display:inline-block;padding:12px 20px;background:#1d4ed8;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">${escapeHtml(buttonLabel)}</a>
        </p>
        <p style="margin:0 0 8px;font-size:13px;color:#52606d;">If the button does not work, copy this link into your browser:</p>
        <p style="margin:0 0 24px;font-size:13px;word-break:break-all;"><a href="${url}">${url}</a></p>
        <p style="margin:0;font-size:13px;color:#52606d;">${escapeHtml(footer)}</p>
      </td></tr>
    </table>
  </body>
</html>`

export const verifyEmailSubject = (): string => `Confirm your email for ${SITE_NAME}`

export const verifyEmailHTML = ({ name, token }: { name?: string | null; token: string }): string =>
  layout({
    heading: `Welcome${name ? `, ${name}` : ''}!`,
    intro: 'Please confirm your email address to activate your account.',
    buttonLabel: 'Confirm my email',
    url: `${getServerURL()}/verify-email?token=${encodeURIComponent(token)}`,
    footer: 'If you did not create an account, you can ignore this email.',
  })

export const resetPasswordSubject = (): string => `Reset your ${SITE_NAME} password`

export const resetPasswordHTML = ({ token }: { token: string }): string =>
  layout({
    heading: 'Reset your password',
    intro: 'We received a request to reset your password. This link expires in one hour.',
    buttonLabel: 'Choose a new password',
    url: `${getServerURL()}/reset-password?token=${encodeURIComponent(token)}`,
    footer: 'If you did not ask for a password reset, you can ignore this email.',
  })
