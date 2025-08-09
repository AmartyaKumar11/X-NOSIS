import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    // Use GPT to understand the intent and extract parameters
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a voice command parser for a medical patient management system. 
          
          Parse the user's voice command and return a JSON object with the intent and extracted parameters.
          
          Possible intents:
          - create_patient: Extract patient name, date of birth, phone, email
          - delete_patient: Extract patient name
          - search_patient: Extract search query/patient name
          - navigate: Extract destination (dashboard, patients, upload, chat, history, settings)
          - unknown: If the command doesn't match any intent
          
          Examples:
          "Create a patient named John Doe" -> {"intent": "create_patient", "patientName": "John Doe"}
          "Delete patient Sarah Smith" -> {"intent": "delete_patient", "patientName": "Sarah Smith"}
          "Find patient Mike" -> {"intent": "search_patient", "query": "Mike"}
          "Go to dashboard" -> {"intent": "navigate", "destination": "/dashboard"}
          
          Return only valid JSON, no additional text.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.1, // Low temperature for consistent parsing
      max_tokens: 200
    })

    const result = completion.choices[0]?.message?.content
    
    if (!result) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const parsedCommand = JSON.parse(result)
    
    return NextResponse.json(parsedCommand)
    
  } catch (error) {
    console.error('Command processing error:', error)
    
    // Fallback to simple parsing if AI fails
    const simpleResult = parseCommandFallback(request.body)
    return NextResponse.json(simpleResult)
  }
}

// Simple fallback parser
function parseCommandFallback(text: string) {
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('create') && lowerText.includes('patient')) {
    const nameMatch = text.match(/(?:patient|named|called)\s+([a-zA-Z\s]+?)(?:\s|$)/i)
    return {
      intent: 'create_patient',
      patientName: nameMatch?.[1]?.trim() || 'Unknown'
    }
  }
  
  if (lowerText.includes('delete') || lowerText.includes('remove')) {
    const nameMatch = text.match(/(?:delete|remove).*?(?:patient|named)?\s+([a-zA-Z\s]+?)(?:\s|$)/i)
    return {
      intent: 'delete_patient',
      patientName: nameMatch?.[1]?.trim() || 'Unknown'
    }
  }
  
  if (lowerText.includes('dashboard')) {
    return { intent: 'navigate', destination: '/dashboard' }
  }
  
  return { intent: 'unknown' }
}