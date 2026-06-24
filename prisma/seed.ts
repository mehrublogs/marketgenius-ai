import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const adminPassword = await bcrypt.hash('admin12345', 12)
  const userPassword = await bcrypt.hash('user12345', 12)

  // Create plans
  await prisma.plan.createMany({
    data: [
      { name: 'Free', description: 'Perfect for getting started', price: 0, contentLimit: 50, urlLimit: 10, features: JSON.stringify(['10 AI generations', '5 short URLs', 'Basic analytics', 'Email support']) },
      { name: 'Pro', description: 'For growing businesses', price: 29, contentLimit: 500, urlLimit: 100, features: JSON.stringify(['500 AI generations', '100 short URLs', 'Advanced analytics', 'Priority support', 'All AI tools']) },
      { name: 'Agency', description: 'For marketing agencies', price: 99, contentLimit: -1, urlLimit: -1, features: JSON.stringify(['Unlimited generations', 'Unlimited URLs', 'All analytics', 'Priority support', 'All AI tools', 'Team members']) },
    ],
  })

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
    },
  })

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Demo User',
      role: 'user',
    },
  })

  // Create subscriptions
  const freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } })
  if (freePlan) {
    await prisma.subscription.upsert({
      where: { userId: demoUser.id },
      update: {},
      create: { userId: demoUser.id, planId: freePlan.id },
    })
  }

  // Create demo content
  await prisma.generatedContent.createMany({
    data: [
      { userId: demoUser.id, tool: 'article-writer', input: JSON.stringify({ topic: 'Digital Marketing' }), output: 'The Complete Guide to Digital Marketing...' },
      { userId: demoUser.id, tool: 'seo-title', input: JSON.stringify({ keyword: 'digital marketing' }), output: '5 Top SEO Titles Generated' },
      { userId: demoUser.id, tool: 'social-posts', input: JSON.stringify({ platform: 'Instagram', topic: 'Content Strategy' }), output: '3 Social Posts Generated' },
      { userId: demoUser.id, tool: 'hashtag-generator', input: JSON.stringify({ topic: 'Marketing' }), output: '24 Hashtags Generated' },
      { userId: demoUser.id, tool: 'image-prompt', input: JSON.stringify({ subject: 'Marketing Team' }), output: 'Professional image prompt generated' },
    ],
  })

  // Create demo short links
  await prisma.shortLink.createMany({
    data: [
      { userId: demoUser.id, slug: 'demo-link1', url: 'https://example.com/very-long-url-that-needs-shortening', clicks: 42 },
      { userId: demoUser.id, slug: 'demo-link2', url: 'https://github.com/marketgenius', clicks: 15 },
    ],
  })

  // Create demo usage logs
  await prisma.usageLog.createMany({
    data: [
      { userId: demoUser.id, action: 'generate', tool: 'article-writer' },
      { userId: demoUser.id, action: 'generate', tool: 'seo-title' },
      { userId: demoUser.id, action: 'create_url', tool: 'url-shortener' },
    ],
  })

  console.log('Database seeded successfully!')
  console.log('Admin: admin@example.com / admin12345')
  console.log('Demo:  user@example.com / user12345')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
