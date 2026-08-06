# Templates de e-mail do Supabase Auth

Estes são os 6 templates de Authentication → Emails do Supabase. Cole cada
bloco no campo **Body** do template correspondente e ajuste o **Subject**.

Regras que valem para todos:
- Os links passam pela rota `/auth/confirm` (verifyOtp com `token_hash`).
- O que muda entre eles é o `type=` do link (signup, invite, magiclink,
  email_change, recovery). A `Reautenticação` não tem link, mostra um código.
- A logo é servida de `https://www.ayumana.com.br/brand/ayumana-logo.png`.

Assuntos sugeridos:
- Confirm sign up: `Confirme seu e-mail na Ayumana`
- Invite user: `Seu convite para a Ayumana`
- Magic link: `Seu link de acesso à Ayumana`
- Change email: `Confirme seu novo e-mail na Ayumana`
- Reset password: `Redefinir sua senha na Ayumana`
- Reauthentication: `Seu código de confirmação Ayumana`
