import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = user.role === 'admin'
    const userIdFilter = isAdmin ? {} : { userId: user.id }

    const [contentCount, urlCount, clickAgg, toolUsage, recentContent, recentClicks] = await Promise.all([
      prisma.generatedContent.count({ where: userIdFilter }),
      prisma.shortLink.count({ where: userIdFilter }),
      prisma.shortLink.aggregate({ where: userIdFilter, _sum: { clicks: true } }),
      prisma.generatedContent.groupBy({
        by: ['tool'],
        where: userIdFilter,
        _count: true,
        orderBy: { _count: { tool: 'desc' } },
        take: 10,
      }),
      prisma.generatedContent.findMany({
        where: userIdFilter,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.clickEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: { link: { select: { slug: true, url: true } } },
      }),
    ])

    return NextResponse.json({
      contentCount,
      urlCount,
      totalClicks: clickAgg._sum.clicks || 0,
      toolUsage: toolUsage.map(t => ({ tool: t.tool, count: t._count })),
      recentContent,
      recentClicks,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
