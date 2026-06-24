# MarketGenius AI

All-in-One AI Marketing SaaS Platform

## Features

- **AI Article Writer** - Generate articles with customizable topic, tone, and audience
- **SEO Tools** - Title generator, meta descriptions, SEO checklist, and on-page score
- **Image Prompt Generator** - Create detailed prompts for AI image generation
- **Social Media Posts** - Generate posts for Facebook, Instagram, LinkedIn, Twitter
- **Product Description Generator** - Short descriptions, long descriptions, bullet points
- **Keyword Research** - Get keyword suggestions with intent, difficulty, and volume estimates
- **Hashtag Generator** - Popular, niche, branded, and low-competition hashtags
- **URL Shortener** - Shorten URLs with click tracking
- **Analytics Dashboard** - Track content generation, URL clicks, and tool usage
- **Admin Panel** - Manage users, content, links, and system settings
- **Bilingual** - Full English and Arabic support with RTL layout
- **Mobile Responsive** - Works on all devices
- **Demo Mode** - Works without any paid AI API keys

## Tech Stack

- **Frontend**: Next.js 16 with App Router, React 19, Tailwind CSS 4
- **Backend**: Next.js API routes and server actions
- **Database**: SQLite with Prisma ORM
- **Auth**: JWT-based with bcrypt password hashing
- **Charts**: Recharts
- **i18n**: Custom translation system (English + Arabic)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Database

```bash
npx prisma db push
```

### 3. Seed Database

```bash
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Default Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin12345 | Admin |
| user@example.com | user12345 | User |

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Required:
- `DATABASE_URL` - SQLite database path (default: `file:./dev.db`)
- `JWT_SECRET` - Secret key for JWT tokens
- `NEXT_PUBLIC_APP_URL` - Your app URL (default: `http://localhost:3000`)

Optional (AI Provider):
- `AI_PROVIDER` - Set to `openai` to use real AI (default: demo mode)
- `AI_API_KEY` - Your AI API key
- `AI_MODEL` - Model to use (default: `gpt-4o-mini`)

## Project Structure

```
marketgenius-ai/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed data
├── src/
│   ├── app/
│   │   ├── (auth)/          # Auth pages (login, register)
│   │   ├── (dashboard)/     # Dashboard pages & tools
│   │   ├── (admin)/         # Admin panel
│   │   ├── api/             # API routes
│   │   ├── s/[slug]/        # URL shortener redirects
│   │   ├── pricing/         # Pricing page
│   │   └── features/        # Features page
│   ├── components/          # Reusable components
│   └── lib/                 # Utilities & services
├── .env.example
└── README.md
```

## Database Models

- **User** - User accounts with roles (user/admin)
- **GeneratedContent** - All AI-generated content
- **ShortLink** - Shortened URLs
- **ClickEvent** - URL click tracking
- **Plan** - Subscription plans (Free, Pro, Agency)
- **Subscription** - User subscriptions
- **UsageLog** - Usage tracking

## Payment System

The app includes a demo/manual payment checkout. No real payment processing is required. The system is designed to be modular so you can easily add Stripe, Paddle, or other providers later.

Plans:
- **Free** - 50 contents/month, 10 short URLs
- **Pro** - $29/month, 500 contents/month, 100 short URLs
- **Agency** - $99/month, unlimited everything

## Deployment

This app can be deployed on any platform that supports Node.js:

### Vercel
```bash
npm run build
```

### Self-hosted
```bash
npm run build
npm run start
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## License

MIT
