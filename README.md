# Dual

Dual is a modern swimming performance tracking and workout generator app built with Next.js 15, Tailwind CSS, and Genkit AI.

## Getting Started

### Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables in `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying

This app is host-agnostic and ready for deployment on **Vercel** or any Node.js hosting platform:

### Deploy to Vercel
1. Install Vercel CLI or link your repository in the Vercel Dashboard.
2. Set the `GEMINI_API_KEY` environment variable in your Vercel project settings.
3. Deploy with:
   ```bash
   npx vercel --prod
   ```

