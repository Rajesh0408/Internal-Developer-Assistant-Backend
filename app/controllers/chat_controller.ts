import type { HttpContext } from '@adonisjs/core/http'
import Question from '#models/question'

export default class ChatController {
  async query({ request, response }: HttpContext) {
    const userQuery = request.input('query')
    const history = request.input('history', [])
    if (!userQuery) {
      return response.badRequest({ message: 'Query is required' })
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY
    if (!GROQ_API_KEY) {
      return {
        answer: "Error: GROQ_API_KEY is not configured.",
        sources: []
      }
    }

    const callGroq = async (systemMessage: string) => {
      let gMessages: { role: string, content: string }[] = []
      if (systemMessage) {
        gMessages.push({ role: 'system', content: systemMessage })
      }
      if (history && Array.isArray(history)) {
        gMessages.push(...history)
      }
      gMessages.push({ role: 'user', content: userQuery })

      const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: gMessages,
          temperature: 0.2
        })
      })
      if (!gRes.ok) {
        throw new Error(await gRes.text())
      }
      const gData = await gRes.json() as any
      return gData.choices[0].message.content as string
    }

    // 1. Check Documents (FAISS via Python Microservice)
    try {
      const faissResponse = await fetch('http://127.0.0.1:8000/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery, top_k: 3 }),
      })

      if (faissResponse.ok) {
        const faissData = await faissResponse.json() as any
        if (faissData.results && faissData.results.length > 0) {
          let contextText = '--- DOCUMENT EXCERPTS ---\n'
          let docSources: any[] = []
          for (const res of faissData.results) {
            const exists = docSources.find((s) => s.link === res.url)
            if (!exists) {
              docSources.push({ type: 'Document', link: res.url })
            }
            contextText += `Excerpt from ${res.file} (Page ${res.page}):\n${res.text}\n\n`
          }

          const systemMsg = `Based ONLY on the following context, answer the user's question concisely. If the context does not contain the answer, reply exactly with: NOT_FOUND.\n\nContext:\n${contextText}`
          try {
            const docAns = await callGroq(systemMsg)
            if (!docAns.includes("NOT_FOUND")) {
              return { answer: docAns, sources: docSources }
            }
            // If NOT_FOUND, implicitly falls through to step 2
          } catch (e) {
            console.error("Groq Context Error:", e)
            throw e // rethrow to abort early showing the error
          }
        }
      }
    } catch (err) {
      console.error('Document check error:', err)
    }

    // 2. If not found in Document, check Database
    try {
      const keywords = userQuery.split(' ').filter((w: string) => w.length > 3)
      let qQuery = Question.query().preload('answers')

      if (keywords.length > 0) {
        qQuery.where((q) => {
          for (const word of keywords) {
            q.orWhereILike('title', `%${word}%`).orWhereILike('description', `%${word}%`)
          }
        })
      } else {
        qQuery.whereILike('title', `%${userQuery}%`)
      }

      const dbQuestions = await qQuery.limit(3)

      if (dbQuestions && dbQuestions.length > 0) {
        let contextText = '--- DATABASE Q&A ---\n'
        let dbSources: any[] = []
        for (const q of dbQuestions) {
          dbSources.push({ type: 'Database', link: `/questions/${q.id}` })
          contextText += `Question: ${q.title}\nDescription: ${q.description}\n`
          for (const ans of q.answers) {
            contextText += `Answer: ${ans.answerText}\n`
          }
          contextText += '\n'
        }

        const systemMsg = `Based ONLY on the following context, answer the user's question concisely. If the context does not contain the answer, reply exactly with: NOT_FOUND.\n\nContext:\n${contextText}`
        try {
          const dbAns = await callGroq(systemMsg)
          if (!dbAns.includes("NOT_FOUND")) {
            return { answer: dbAns, sources: dbSources }
          }
        } catch (e) {
          console.error("Groq Context Error:", e)
          throw e
        }
      }
    } catch (err) {
      console.error('Database check error:', err)
    }

    // 3. Fallback to general AI if both failed
    try {
      const systemMsg = `You are an internal developer assistant chatbot. Answer the user's technical question based on your own general knowledge and the conversation history. Be concise.`
      const aiAns = await callGroq(systemMsg)
      return { answer: aiAns, sources: [] }
    } catch (err) {
      console.error('Groq connection error:', err)
      return {
        answer: "Error: Failed to generate response from Groq AI. Check the server logs (the configured API Key is likely invalid).",
        sources: []
      }
    }
  }
}
