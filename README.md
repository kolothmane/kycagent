# Financial Services Console

Salesforce-style KYC Service Agent demo built with Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI primitives, Zustand, and Vercel-compatible server routes.

## Local setup

1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env.local`
3. Set `OPENAI_KEY`
4. Run `npm run dev`

## Environment variables

- `OPENAI_KEY`: server-side API key for `/api/chat`
- `OPENAI_MODEL`: optional model override, defaults to `gpt-5.4-mini`

## Routes

- `POST /api/chat`: conversation orchestration via the OpenAI Responses API
- `POST /api/process-kyc`: structured KYC processing, compliance scoring, and CRM-style record generation

## Deployment

The project is ready for Vercel deployment as a standard Next.js App Router application. Set the required environment variables in the Vercel dashboard before promoting to production.
