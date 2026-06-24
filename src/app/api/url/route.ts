import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url, slug: customSlug } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let slug = customSlug || generateSlug()

    if (customSlug) {
      const existing = await prisma.shortLink.findUnique({ where: { slug } })
      if (existing) {
        return NextResponse.json({ error: 'Custom slug already taken' }, { status: 409 })
      }
    }

    const link = await prisma.shortLink.create({
      data: {
        userId: user.id,
        slug,
        url,
        title: url,
      },
    })

    await prisma.usageLog.create({
      data: {
        userId: user.id,
        action: 'create_url',
        tool: 'url-shortener',
        metadata: JSON.stringify({ slug, url }),
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return NextResponse.json({
      id: link.id,
      slug: link.slug,
      shortUrl: `${appUrl}/s/${link.slug}`,
      url: link.url,
    })
  } catch (error) {
    console.error('Error creating short URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const links = await prisma.shortLink.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ links })
  } catch (error) {
    console.error('Error fetching URLs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
