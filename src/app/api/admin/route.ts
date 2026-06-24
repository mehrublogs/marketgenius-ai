import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getSession()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalUsers, totalContent, totalLinks, clickAgg, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.generatedContent.count(),
      prisma.shortLink.count(),
      prisma.shortLink.aggregate({ _sum: { clicks: true } }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
    ])

    return NextResponse.json({
      totalUsers,
      totalContent,
      totalLinks,
      totalClicks: clickAgg._sum.clicks || 0,
      recentUsers,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
