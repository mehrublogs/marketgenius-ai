import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { smartDetect, generateSmartResponse } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt } = await request.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const detection = await smartDetect(prompt)
    const result = await generateSmartResponse(prompt)

    return NextResponse.json({
      detection,
      ...result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
