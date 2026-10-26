import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const { name, email, planName } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dualswim.app';
    const activationLink = `${appUrl}/dual?payment=success&email=${encodeURIComponent(email)}`;
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'Dual Swim <membership@dualswim.app>',
        to: [email],
        subject: `Your Dual Pro Membership is Ready! 🏊‍♂️`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #090d16; color: #ffffff; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0f172a; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
                .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
                .title { font-size: 28px; font-weight: 800; color: #38bdf8; margin-top: 12px; }
                .content { padding: 24px 0; font-size: 16px; line-height: 1.6; color: #cbd5e1; }
                .btn { display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, #f97316, #f59e0b); color: #ffffff; font-weight: bold; text-decoration: none; border-radius: 8px; margin-top: 20px; text-align: center; font-size: 18px; }
                .footer { text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #64748b; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="title">DUAL PRO</div>
                  <p style="color: #94a3b8; margin: 4px 0 0;">Membership Order Confirmed</p>
                </div>
                <div class="content">
                  <h2 style="color: #ffffff;">Thank you for joining Dual Pro, ${name || 'Swimmer'}! 🎉</h2>
                  <p>Your purchase of the <strong>${planName || 'Dual Pro Membership'}</strong> via Squarespace has been confirmed.</p>
                  <p>Click the button below to return to the Dual App and automatically activate your full Pro access:</p>
                  <div style="text-align: center;">
                    <a href="${activationLink}" class="btn">Activate Dual Pro Membership →</a>
                  </div>
                  <p style="margin-top: 24px; font-size: 14px; color: #94a3b8;">
                    If the button above does not work, copy and paste this activation URL into your browser:<br>
                    <a href="${activationLink}" style="color: #38bdf8;">${activationLink}</a>
                  </p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Dual Swim. All rights reserved.</p>
                  <p>${appUrl}</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
      return NextResponse.json({ success: true, delivered: true });
    }

    console.log(`[Membership Confirmation Email Logged] To: ${email}, Link: ${activationLink}`);
    return NextResponse.json({
      success: true,
      delivered: false,
      message: 'Membership email logged (add RESEND_API_KEY to send live emails)',
      activationLink,
    });
  } catch (error: any) {
    console.error('Membership Email Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send membership email' }, { status: 500 });
  }
}
