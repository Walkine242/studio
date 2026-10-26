import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'Dual Swim <welcome@dualswim.app>',
        to: [email],
        subject: `Welcome to Dual, ${name || 'Swimmer'}! 🏊‍♂️`,
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
                .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(90deg, #f97316, #f59e0b); color: #ffffff; font-weight: bold; text-decoration: none; border-radius: 8px; margin-top: 20px; text-align: center; }
                .footer { text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: #64748b; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="title">DUAL</div>
                  <p style="color: #94a3b8; margin: 4px 0 0;">Competitive Swimming Platform</p>
                </div>
                <div class="content">
                  <h2 style="color: #ffffff;">Welcome to Dual, ${name || 'Swimmer'}! 🎉</h2>
                  <p>Your Dual Swim account profile has been successfully created.</p>
                  <p>Here is what you can do right now on Dual:</p>
                  <ul>
                    <li><strong>Enter Virtual Swim Meets:</strong> Join global public and private dual races.</li>
                    <li><strong>AI Workout Generator:</strong> Create customized training sessions tailored to your goals.</li>
                    <li><strong>Track Personal Bests:</strong> Monitor your stroke progress and compare times globally.</li>
                  </ul>
                  <div style="text-align: center;">
                    <a href="https://dualswim.app/dashboard" class="btn">Go to Dual Dashboard →</a>
                  </div>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Dual Swim. All rights reserved.</p>
                  <p>https://dualswim.app</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
      return NextResponse.json({ success: true, delivered: true });
    }

    console.log(`[Welcome Email Logged] To: ${email}, Name: ${name}`);
    return NextResponse.json({
      success: true,
      delivered: false,
      message: 'Email logged (add RESEND_API_KEY environment variable to send live emails)',
    });
  } catch (error: any) {
    console.error('Welcome Email Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send welcome email' }, { status: 500 });
  }
}
