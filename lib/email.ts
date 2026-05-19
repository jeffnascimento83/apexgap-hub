import { Resend } from 'resend'

export async function sendInviteEmail(to: string, name: string, token: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const FROM = process.env.FROM_EMAIL ?? 'APEXGAP Hub <onboarding@resend.dev>'
  const APP_URL = process.env.APP_URL ?? 'http://localhost:3000'
  const link = `${APP_URL}/setup-password?token=${token}`
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Configure seu acesso — APEXGAP Hub',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 32px;background:#0a0a0f;color:#fff;border-radius:12px;">
        <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#555;margin-bottom:24px;">APEXGAP · Hub</p>
        <h2 style="font-size:20px;font-weight:600;margin-bottom:8px;">Olá, ${name}!</h2>
        <p style="color:#888;line-height:1.6;margin-bottom:28px;">
          Você foi adicionada ao <strong style="color:#fff;">APEXGAP Hub</strong>.<br/>
          Clique abaixo para criar sua senha e começar a usar a plataforma.
        </p>
        <a href="${link}" style="display:inline-block;padding:12px 28px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
          Criar minha senha
        </a>
        <p style="color:#444;font-size:11px;margin-top:28px;line-height:1.6;">
          Este link expira em 48 horas.<br/>
          Se não solicitou acesso, ignore este email.<br/><br/>
          <span style="color:#333;">Link direto: ${link}</span>
        </p>
      </div>
    `,
  })
}
