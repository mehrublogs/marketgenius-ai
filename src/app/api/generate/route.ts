import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAI } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, inputs: nestedInputs, ...rest } = body
    const inputs = nestedInputs || rest

    if (!type) {
      return NextResponse.json({ error: 'Tool type is required' }, { status: 400 })
    }

    const result = await generateAI(type, inputs)

    await prisma.generatedContent.create({
      data: {
        userId: user.id,
        tool: type,
        input: JSON.stringify(inputs),
        output: JSON.stringify(result),
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
