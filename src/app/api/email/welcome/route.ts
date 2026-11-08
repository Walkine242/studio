import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getServerUser, getAdminSupabase } from '@/lib/supabase/server';

// Sends the welcome email once per account, to the signed-in swimmer's own
// address. Called by the app after the first login. Needs RESEND_API_KEY.
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function POST() {
  try {
    const { user } = await getServerUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
    }

    const admin = getAdminSupabase();
    const { data: profile } = await admin
      .from('profiles')
      .select('name, welcome_sent_at')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile || profile.welcome_sent_at) {
      return NextResponse.json({ success: true, alreadySent: true });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: true, delivered: false, message: 'Add RESEND_API_KEY to send welcome emails.' });
    }

    const name = profile.name;
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'Dual Swim <welcome@dualswim.app>',
      to: [user.email],
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
                  <h2 style="color: #ffffff;">Welcome to Dual, ${escapeHtml(name || 'Swimmer')}! 🎉</h2>
                  <p>Your Dual Swim account profile has been successfully created, and your <strong>14-day free trial of Dual Pro</strong> has started. Every feature is unlocked; when the trial ends you can pick the plan that suits you.</p>
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

    await admin.from('profiles').update({ welcome_sent_at: new Date().toISOString() }).eq('id', user.id);
    return NextResponse.json({ success: true, delivered: true });
  } catch (error: any) {
    console.error('Welcome Email Error:', error);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
