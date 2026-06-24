import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    const link = await prisma.shortLink.findUnique({
      where: { slug },
    })

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    // Record click event
    await prisma.clickEvent.create({
      data: {
        linkId: link.id,
        userAgent: request.headers.get('user-agent') || '',
        referer: request.headers.get('referer') || '',
      },
    })

    // Increment click count
    await prisma.shortLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    })

    return NextResponse.redirect(link.url)
  } catch (error) {
    console.error('Error redirecting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
