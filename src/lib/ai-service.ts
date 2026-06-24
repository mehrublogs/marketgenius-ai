// Central AI Service - Supports Groq, Gemini, OpenRouter, and Demo mode
// Uses plain fetch() - no SDKs required

type AIProvider = 'groq' | 'gemini' | 'openrouter' | 'demo'

interface AIConfig {
  provider: AIProvider
  apiKey?: string
  model?: string
}

function getConfig(): AIConfig {
  return {
    provider: (process.env.AI_PROVIDER as AIProvider) || 'demo',
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
  }
}

// --- Universal AI call via Groq (OpenAI-compatible) ---
async function callGroq(prompt: string, systemPrompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error: ${res.status} - ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// --- Gemini API ---
async function callGemini(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY
  const model = process.env.AI_MODEL || 'gemini-2.0-flash'

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${res.status} - ${err}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// --- OpenRouter (OpenAI-compatible) ---
async function callOpenRouter(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter API error: ${res.status} - ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// --- Unified AI call ---
async function callAI(prompt: string, systemPrompt: string): Promise<string> {
  const config = getConfig()

  if (config.provider === 'groq' && config.apiKey) {
    try { return await callGroq(prompt, systemPrompt) } catch (e) { console.error('Groq failed:', e) }
  }
  if (config.provider === 'gemini' || process.env.GEMINI_API_KEY) {
    try { return await callGemini(prompt, systemPrompt) } catch (e) { console.error('Gemini failed:', e) }
  }
  if (config.provider === 'openrouter' || process.env.OPENROUTER_API_KEY) {
    try { return await callOpenRouter(prompt, systemPrompt) } catch (e) { console.error('OpenRouter failed:', e) }
  }
  return ''
}

// --- Tool-specific AI generation ---

async function generateArticle(inputs: {
  topic: string; language: string; tone: string; targetAudience: string; wordCount: string
}) {
  const system = 'You are an expert content writer. Return your response as valid JSON with these fields: title (string), outline (array of strings), body (string - full article in markdown), metaDescription (string, max 160 chars). Return ONLY the JSON, no markdown fences.'
  const prompt = `Write a ${inputs.wordCount}-word article about "${inputs.topic}" in ${inputs.language} language. Tone: ${inputs.tone}. Target audience: ${inputs.targetAudience}. Make it SEO-optimized and engaging.`

  const raw = await callAI(prompt, system)
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { title: `Guide to ${inputs.topic}`, outline: ['Introduction', 'Key Benefits', 'How to Get Started', 'Conclusion'], body: raw, metaDescription: `Learn about ${inputs.topic} with this comprehensive guide.` }
  }
}

async function generateSEOTitle(keyword: string) {
  const system = 'Generate 5 SEO-optimized title tags. Return ONLY a JSON array of 5 strings. No markdown fences.'
  const raw = await callAI(`Generate 5 SEO title tags for the keyword "${keyword}". Each title should be under 60 characters and include the keyword.`, system)
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return { titles: JSON.parse(cleaned) }
  } catch {
    return { titles: [`${keyword}: Complete Guide`, `Best ${keyword} Tips`, `${keyword} 101`, `Top ${keyword} Strategies`, `How to Master ${keyword}`] }
  }
}

async function generateSEOMeta(keyword: string, content: string) {
  const system = 'Generate 3 SEO meta descriptions. Return ONLY a JSON array of 3 strings. No markdown fences.'
  const raw = await callAI(`Generate 3 meta descriptions (max 160 chars each) for a page about "${keyword}". Content summary: ${content || keyword}`, system)
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return { descriptions: JSON.parse(cleaned) }
  } catch {
    return { descriptions: [`Learn about ${keyword} with our comprehensive guide.`, `Discover the best ${keyword} strategies for ${new Date().getFullYear()}.`, `Everything you need to know about ${keyword} in one place.`] }
  }
}

async function generateSEOChecklist(keyword: string) {
  const system = 'Generate an SEO checklist with 12 items. Return ONLY a JSON array of objects with "item" (string) and "done" (boolean, always false). No markdown fences.'
  const raw = await callAI(`Generate a content SEO checklist for optimizing a page about "${keyword}". Include title, meta, headers, images, links, speed, mobile, schema.`, system)
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return { checklist: JSON.parse(cleaned) }
  } catch {
    return { checklist: [
      { item: 'Title tag includes primary keyword', done: false },
      { item: 'Meta description is compelling', done: false },
      { item: 'URL is SEO-friendly', done: false },
      { item: 'H1-H3 headers structured', done: false },
      { item: 'Content is 1000+ words', done: false },
      { item: 'Images have alt text', done: false },
      { item: 'Internal links present', done: false },
      { item: 'External links to authority sites', done: false },
      { item: 'Page loads under 3 seconds', done: false },
      { item: 'Mobile responsive', done: false },
      { item: 'Schema markup applied', done: false },
      { item: 'Social meta tags present', done: false },
    ] }
  }
}

async function generateSEOScore(keyword: string, content: string) {
  const system = 'Analyze SEO score. Return ONLY a JSON object with "score" (number 0-100), "grade" (string: Good/Average/Needs Improvement), "issues" (array of strings). No markdown fences.'
  const raw = await callAI(`Analyze the SEO of content about "${keyword}". Content: ${content || 'No content provided'}. Give score, grade, and list issues.`, system)
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { score: 72, grade: 'Average', issues: ['Meta description could be more compelling', 'Content could be longer', 'Add more internal links'] }
  }
}

async function generateImagePrompt(inputs: {
  subject: string; style: string; mood: string; platform: string; aspectRatio: string
}) {
  const system = 'You are an expert AI image prompt writer. Return ONLY a JSON object with "prompt" field containing a detailed image generation prompt. No markdown fences.'
  const raw = await callAI(
    `Create a detailed image generation prompt for: Subject: ${inputs.subject}, Style: ${inputs.style}, Mood: ${inputs.mood}, Platform: ${inputs.platform}, Aspect Ratio: ${inputs.aspectRatio}. Make it professional and detailed.`,
    system
  )
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { prompt: raw || `Professional ${inputs.style} image of ${inputs.subject}, ${inputs.mood} mood, designed for ${inputs.platform}, ${inputs.aspectRatio} format, high quality, 8K resolution, professional lighting` }
  }
}

async function generateSocialPosts(inputs: {
  platform: string; topic: string; tone: string; language: string; cta: string
}) {
  const system = 'Create 4 social media post variations. Return ONLY a JSON object with "variations" array of objects with "id" (number) and "text" (string). No markdown fences.'
  const raw = await callAI(
    `Write 4 ${inputs.platform} posts about "${inputs.topic}" in ${inputs.language}. Tone: ${inputs.tone}. CTA: ${inputs.cta}. Each post should be unique and engaging with relevant emojis.`,
    system
  )
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { variations: [
      { id: 1, text: `Discover the power of ${inputs.topic}! ${inputs.cta}` },
      { id: 2, text: `Did you know? ${inputs.topic} can transform your results. ${inputs.cta}` },
      { id: 3, text: `Pro tip: Master ${inputs.topic} for better outcomes. ${inputs.cta}` },
      { id: 4, text: `Join thousands who are already using ${inputs.topic}. ${inputs.cta}` },
    ] }
  }
}

async function generateProductDescription(inputs: {
  productName: string; features: string; audience: string; tone: string; language: string
}) {
  const system = 'Write product descriptions. Return ONLY a JSON object with: shortDescription (string), longDescription (string), bulletPoints (array of strings), seoTitle (string). No markdown fences.'
  const raw = await callAI(
    `Write product descriptions for "${inputs.productName}" in ${inputs.language}. Features: ${inputs.features}. Target: ${inputs.audience}. Tone: ${inputs.tone}. Include short desc (1-2 sentences), long desc (2-3 paragraphs), bullet points, and SEO title.`,
    system
  )
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return {
      shortDescription: `Discover ${inputs.productName} - designed for ${inputs.audience}.`,
      longDescription: `${inputs.productName} is a premium solution crafted for ${inputs.audience}. ${inputs.features}.`,
      bulletPoints: inputs.features.split(',').map(f => f.trim()),
      seoTitle: `${inputs.productName} - Best for ${inputs.audience}`
    }
  }
}

async function generateKeywords(inputs: {
  seedKeyword: string; country: string; language: string
}) {
  const system = 'Generate keyword research data. Return ONLY a JSON object with "keywords" array of objects with "keyword", "intent", "difficulty", "volume", "competition". No markdown fences.'
  const raw = await callAI(
    `Generate 10 keyword ideas related to "${inputs.seedKeyword}" for ${inputs.country} market in ${inputs.language}. Include search intent (informational/commercial/transactional), difficulty (Low/Medium/High), estimated monthly volume, and competition level.`,
    system
  )
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return { ...inputs, keywords: parsed.keywords || parsed, note: 'Estimates provided by AI. Connect a real keyword API for exact data.' }
  } catch {
    return { ...inputs, keywords: [
      { keyword: inputs.seedKeyword + ' strategies', intent: 'informational', difficulty: 'Medium', volume: 2400, competition: 'Medium' },
      { keyword: inputs.seedKeyword + ' tips', intent: 'informational', difficulty: 'Low', volume: 3600, competition: 'Low' },
      { keyword: inputs.seedKeyword + ' tools', intent: 'commercial', difficulty: 'Medium', volume: 1800, competition: 'High' },
      { keyword: 'best ' + inputs.seedKeyword, intent: 'commercial', difficulty: 'High', volume: 5400, competition: 'High' },
      { keyword: inputs.seedKeyword + ' guide', intent: 'informational', difficulty: 'Low', volume: 4200, competition: 'Medium' },
    ], note: 'AI-generated estimates. Connect a real keyword API for exact data.' }
  }
}

async function generateHashtags(inputs: {
  topic: string; niche: string; platform: string; language: string
}) {
  const system = 'Generate hashtags grouped by category. Return ONLY a JSON object with "popular", "niche", "branded", "lowCompetition" arrays of strings. No markdown fences.'
  const raw = await callAI(
    `Generate hashtags for "${inputs.topic}" in the ${inputs.niche} niche for ${inputs.platform} in ${inputs.language}. Group them as: popular (8), niche (8), branded (6), lowCompetition (7). Each should be a hashtag string with #.`,
    system
  )
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    const base = inputs.topic.replace(/\s+/g, '')
    return {
      popular: [`#${base}`, `#${base}Tips`, `#${base}Guide`, `#${base}2024`, `#${base}Pro`, `#Best${base}`, `#${base}Life`, `#${base}Daily`],
      niche: [`#${base}Community`, `#${base}Lovers`, `#${base}Addict`, `#${base}Family`, `#${base}World`, `#${base}Gram`, `#${base}OfTheDay`, `#${base}Mastery`],
      branded: [`#My${base}`, `#${base}ByCreator`, `#${base}Official`, `#${base}HQ`, `#${base}Studio`, `#Go${base}`],
      lowCompetition: [`#${base}Beginner`, `#${base}101`, `#${base}Basics`, `#${base}ForNewbies`, `#${base}Starter`, `#${base}Simplified`, `#Easy${base}`],
    }
  }
}

// --- Main generate function ---

export async function generateAI(type: string, inputs: Record<string, unknown>) {
  const config = getConfig()
  const hasAPI = config.apiKey && config.provider !== 'demo'

  if (!hasAPI) {
    return demoFallback(type, inputs)
  }

  try {
    switch (type) {
      case 'article-writer':
        return await generateArticle(inputs as unknown as Parameters<typeof generateArticle>[0])
      case 'seo-title':
        return await generateSEOTitle(inputs.keyword as string)
      case 'seo-meta':
        return await generateSEOMeta(inputs.keyword as string, inputs.content as string)
      case 'seo-checklist':
        return await generateSEOChecklist(inputs.keyword as string)
      case 'seo-score':
        return await generateSEOScore(inputs.keyword as string, inputs.content as string)
      case 'image-prompt':
        return await generateImagePrompt(inputs as unknown as Parameters<typeof generateImagePrompt>[0])
      case 'social-posts':
        return await generateSocialPosts(inputs as unknown as Parameters<typeof generateSocialPosts>[0])
      case 'product-description':
        return await generateProductDescription(inputs as unknown as Parameters<typeof generateProductDescription>[0])
      case 'keyword-research':
        return await generateKeywords(inputs as unknown as Parameters<typeof generateKeywords>[0])
      case 'hashtag-generator':
        return await generateHashtags(inputs as unknown as Parameters<typeof generateHashtags>[0])
      default:
        return demoFallback(type, inputs)
    }
  } catch (error) {
    console.error(`AI generation failed for ${type}:`, error)
    return demoFallback(type, inputs)
  }
}

// --- Demo fallback (if API fails) ---

function demoFallback(type: string, inputs: Record<string, unknown>) {
  switch (type) {
    case 'article-writer': {
      const topic = inputs.topic as string
      return {
        title: `The Complete Guide to ${topic}`,
        outline: [`Introduction to ${topic}`, `Why ${topic} Matters in ${new Date().getFullYear()}`, `Key Benefits`, `How to Get Started`, `Advanced Strategies`, `Conclusion`],
        body: `# ${topic}\n\n${topic} has become essential for modern businesses. This guide covers everything you need to know.\n\n## Why ${topic} Matters\n\nCompanies that master ${topic} see significant improvements.\n\n## Key Benefits\n\n1. Increased efficiency\n2. Better targeting\n3. Higher engagement\n4. Measurable results\n\n## Getting Started\n\nStart by defining your goals and understanding your audience.\n\n## Advanced Strategies\n\nOnce you've mastered the basics, explore A/B testing and automation.`,
        metaDescription: `Complete guide to ${topic}. Learn strategies, tips, and best practices.`,
      }
    }
    case 'seo-title':
      return { titles: [`${inputs.keyword}: Ultimate Guide`, `Best ${inputs.keyword} Tips`, `${inputs.keyword} 101`, `Top ${inputs.keyword} Strategies`, `Master ${inputs.keyword}`] }
    case 'seo-meta':
      return { descriptions: [`Learn about ${inputs.keyword}. Comprehensive guide with tips.`, `Discover ${inputs.keyword} strategies that work.`, `Everything about ${inputs.keyword} in one place.`] }
    case 'seo-checklist':
      return { checklist: Array.from({ length: 12 }, (_, i) => ({ item: `SEO item ${i + 1}`, done: false })) }
    case 'seo-score':
      return { score: 75, grade: 'Average', issues: ['Add more content', 'Improve meta description', 'Add alt text to images'] }
    case 'image-prompt':
      return { prompt: `Professional ${inputs.style} image of ${inputs.subject}, ${inputs.mood} mood, ${inputs.platform} format, high quality` }
    case 'social-posts':
      return { variations: [1, 2, 3, 4].map(i => ({ id: i, text: `Post ${i} about ${inputs.topic}. ${inputs.cta}` })) }
    case 'product-description':
      return { shortDescription: `${inputs.productName} - perfect for ${inputs.audience}.`, longDescription: `${inputs.productName} is designed for ${inputs.audience}.`, bulletPoints: (inputs.features as string || '').split(',').map(f => f.trim()), seoTitle: `${inputs.productName} for ${inputs.audience}` }
    case 'keyword-research':
      return { keywords: ['strategies', 'tips', 'tools', 'guide', 'best'].map(k => ({ keyword: `${inputs.seedKeyword} ${k}`, intent: 'informational', difficulty: 'Medium', volume: Math.floor(Math.random() * 5000) + 100, competition: 'Medium' })), note: 'Demo estimates' }
    case 'hashtag-generator':
      const base = (inputs.topic as string || '').replace(/\s+/g, '')
      return { popular: [`#${base}`, `#${base}Tips`], niche: [`#${base}Niche`], branded: [`#${base}Brand`], lowCompetition: [`#${base}New`] }
    default:
      return { message: 'Demo output' }
  }
}
