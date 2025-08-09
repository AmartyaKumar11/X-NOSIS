"use client"

import { useState, useEffect, useRef } from 'react'

interface VoiceCommand {
  pattern: RegExp
  action: string
  handler: (matches: RegExpMatchArray) => void
}

interface UseVoiceControlProps {
  onCreatePatient?: (data: any) => void
  onEditPatient?: (id: string, data: any) => void
  onDeletePatient?: (id: string) => void
  onNavigate?: (path: string) => void
  onSearch?: (query: string) => void
  onUploadDocument?: (patientName: string, directoryName: string) => void
  onCommandProcessed?: () => void
}

export function useVoiceControl({
  onCreatePatient,
  onEditPatient,
  onDeletePatient,
  onNavigate,
  onSearch,
  onUploadDocument,
  onCommandProcessed
}: UseVoiceControlProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptRef = useRef('')

  // Extract name from various patterns
  const extractPatientName = (text: string): string | null => {
    const namePatterns = [
      /(?:patient|user|person)(?:\s+(?:named|called))?\s+([a-zA-Z\s]+?)(?:\s+(?:born|with|and|$))/i,
      /(?:named|called)\s+([a-zA-Z\s]+?)(?:\s+(?:born|with|and|$))/i,
      /(?:create|make|add)(?:\s+a)?(?:\s+new)?\s+(?:patient|user|person)\s+([a-zA-Z\s]+?)(?:\s+(?:born|with|and|$))/i,
      /([a-zA-Z\s]+?)(?:\s+(?:born|with|and|as a patient|$))/i
    ]
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        const name = match[1].trim()
        // Filter out common words that aren't names
        const excludeWords = ['patient', 'user', 'person', 'new', 'create', 'make', 'add', 'directory', 'folder']
        if (!excludeWords.some(word => name.toLowerCase() === word)) {
          return name
        }
      }
    }
    return null
  }

  // Extract date from various patterns
  const extractDateOfBirth = (text: string): string | null => {
    const datePatterns = [
      /born (?:on )?(.+?)(?:\s+(?:phone|email|with|and|$))/i,
      /(?:date of birth|dob|birthday)(?:\s+is)?\s+(.+?)(?:\s+(?:phone|email|with|and|$))/i,
      /([0-9]{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-zA-Z]*\s+[0-9]{4})/i,
      /([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i
    ]
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return parseDateString(match[1].trim())
      }
    }
    return null
  }

  // Voice commands patterns - More flexible (ORDER MATTERS!)
  const commands: VoiceCommand[] = [
    // Simple test command
    {
      pattern: /^test$/i,
      action: 'TEST',
      handler: (matches) => {
        console.log('🎉 TEST COMMAND WORKED!')
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('Test command worked!')
          speechSynthesis.speak(utterance)
        }
      }
    },

    // Delete word test
    {
      pattern: /delete/i,
      action: 'DELETE_WORD_TEST',
      handler: (matches) => {
        console.log('🗑️ DELETE WORD DETECTED!', matches)
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('Delete word detected!')
          speechSynthesis.speak(utterance)
        }
      }
    },

    // Patient Creation with name extraction - MOST SPECIFIC FIRST
    {
      pattern: /(?:create|make|add)(?:\s+a)?(?:\s+new)?\s+(?:patient|user|person)(?:\s+(?:named|called))?\s+([a-zA-Z\s]+?)(?:\s+born|\s+with|\s*$)/i,
      action: 'CREATE_PATIENT_WITH_NAME',
      handler: (matches) => {
        console.log('🎯 CREATE_PATIENT_WITH_NAME matches:', matches)
        let name = matches[1]?.trim()
        
        // Clean up the name - remove common words that might get captured
        if (name) {
          name = name.replace(/^(named|called)\s+/i, '').trim()
          name = name.replace(/\s+(born|with|and).*$/i, '').trim()
        }
        
        console.log('Cleaned name:', name)
        console.log('onCreatePatient function exists:', !!onCreatePatient)
        
        if (name && onCreatePatient) {
          console.log('🎉 CALLING onCreatePatient with:', name)
          onCreatePatient({
            name,
            date_of_birth: null,
            metadata: {
              phone: '',
              email: '',
              gender: '',
              blood_type: '',
              allergies: '',
              emergency_contact: ''
            }
          })
        } else {
          console.log('❌ Missing name or onCreatePatient function')
        }
      }
    },

    // Very simple patient creation
    {
      pattern: /create patient (.+)/i,
      action: 'CREATE_PATIENT_SIMPLE',
      handler: (matches) => {
        console.log('Simple create patient matches:', matches)
        let name = matches[1]?.trim()
        
        // Clean up the name
        if (name) {
          name = name.replace(/^(named|called)\s+/i, '').trim()
          name = name.replace(/\s+(born|with|and).*$/i, '').trim()
        }
        
        console.log('Cleaned name:', name)
        console.log('onCreatePatient function:', onCreatePatient)
        
        if (name && onCreatePatient) {
          console.log('🎉 CALLING onCreatePatient with:', name)
          onCreatePatient({
            name,
            date_of_birth: null,
            metadata: {
              phone: '',
              email: '',
              gender: '',
              blood_type: '',
              allergies: '',
              emergency_contact: ''
            }
          })
        } else {
          console.log('❌ Missing name or onCreatePatient function')
        }
      }
    },

    // Flexible Patient Search
    {
      pattern: /(?:can you |please |)(?:search|find|look for|show me|where is)(?:\s+(?:patient|user|person))?(?:\s+(?:named|called))?\s+([a-zA-Z\s]+)/i,
      action: 'SEARCH_PATIENT_FLEXIBLE',
      handler: (matches) => {
        const query = matches[1]?.trim()
        console.log('Search query:', query)
        if (query && onSearch) {
          onSearch(query)
        }
      }
    },

    // Simple Delete Pattern - Test First
    {
      pattern: /delete (.+)/i,
      action: 'DELETE_SIMPLE',
      handler: (matches) => {
        console.log('🗑️ Simple delete matches:', matches)
        let patientName = matches[1]?.trim()
        
        // Clean up the name
        if (patientName) {
          patientName = patientName.replace(/^(patient|user|person)\s+/i, '').trim()
          patientName = patientName.replace(/^(named|called)\s+/i, '').trim()
          patientName = patientName.replace(/\s+(from|in|the|record|records|system|database).*$/i, '').trim()
        }
        
        console.log('🗑️ Cleaned patient name:', patientName)
        if (patientName && onDeletePatient) {
          onDeletePatient(patientName)
        }
      }
    },

    // Flexible Patient Deletion
    {
      pattern: /(?:can you |please |)(?:delete|remove|get rid of)(?:\s+(?:the\s+)?(?:patient|user|person))?(?:\s+(?:named|called))?\s+([a-zA-Z\s]+?)(?:\s+(?:from|in)(?:\s+(?:the\s+)?(?:record|records|system|database))?)?/i,
      action: 'DELETE_PATIENT_FLEXIBLE',
      handler: (matches) => {
        console.log('🗑️ Flexible delete matches:', matches)
        let patientName = matches[1]?.trim()
        
        // Clean up the name - remove common words
        if (patientName) {
          patientName = patientName.replace(/^(named|called)\s+/i, '').trim()
          patientName = patientName.replace(/\s+(from|in|the|record|records|system|database).*$/i, '').trim()
        }
        
        console.log('🗑️ Cleaned patient name:', patientName)
        if (patientName && onDeletePatient) {
          onDeletePatient(patientName)
        }
      }
    },

    // Flexible Navigation
    {
      pattern: /(?:can you |please |)(?:go to|navigate to|open|show me|take me to)(?:\s+the)?\s+(dashboard|patients|upload|chat|history|settings|patient list|patient page)/i,
      action: 'NAVIGATE_FLEXIBLE',
      handler: (matches) => {
        let destination = matches[1]?.toLowerCase()
        
        // Handle alternative names
        if (destination === 'patient list' || destination === 'patient page') {
          destination = 'patients'
        }
        
        console.log('Navigate to:', destination)
        if (destination && onNavigate) {
          onNavigate(`/${destination}`)
        }
      }
    },

    // Flexible Document Upload
    {
      pattern: /(?:can you |please |)(?:upload|add)(?:\s+a)?(?:\s+(?:document|file))?\s+(?:for|to)(?:\s+(?:patient|user))?\s+([a-zA-Z\s]+?)(?:\s+(?:in|to|into))?(?:\s+(?:the|their))?\s+([a-zA-Z\s]+?)(?:\s+(?:directory|folder))?/i,
      action: 'UPLOAD_DOCUMENT_FLEXIBLE',
      handler: (matches) => {
        const patientName = matches[1]?.trim()
        const directoryName = matches[2]?.trim()
        console.log('Upload document:', { patientName, directoryName })
        if (patientName && directoryName && onUploadDocument) {
          onUploadDocument(patientName, directoryName)
        }
      }
    },

    // General help/fallback
    {
      pattern: /(?:help|what can you do|commands|options)/i,
      action: 'HELP',
      handler: () => {
        console.log('Help requested')
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('You can create patients, search for patients, navigate to different pages, or upload documents. Try saying "create a patient named John" or "go to dashboard".')
          speechSynthesis.speak(utterance)
        }
      }
    },

    // Quick actions - MOVED TO END so it doesn't interfere
    {
      pattern: /^(?:create|new)$/i,
      action: 'QUICK_CREATE',
      handler: () => {
        console.log('Voice command: Quick create action')
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('What would you like to create? Try saying "create patient" followed by a name.')
          speechSynthesis.speak(utterance)
        }
      }
    }
  ]

  // Parse date strings like "6th August 2023" or "06/08/2023"
  const parseDateString = (dateStr: string): string | null => {
    try {
      // Handle ordinal dates like "6th August 2023"
      const ordinalPattern = /([0-9]{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-zA-Z]*\s+([0-9]{4})/i
      const ordinalMatch = dateStr.match(ordinalPattern)
      
      if (ordinalMatch) {
        const day = ordinalMatch[1].padStart(2, '0')
        const monthMap: { [key: string]: string } = {
          'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
          'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
          'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        }
        const month = monthMap[ordinalMatch[2].toLowerCase().substring(0, 3)]
        const year = ordinalMatch[3]
        
        if (month) {
          return `${year}-${month}-${day}`
        }
      }

      // Handle numeric dates like "06/08/2023" or "06-08-2023"
      const numericPattern = /([0-9]{1,2})[\/\-]([0-9]{1,2})[\/\-]([0-9]{4})/
      const numericMatch = dateStr.match(numericPattern)
      
      if (numericMatch) {
        const day = numericMatch[1].padStart(2, '0')
        const month = numericMatch[2].padStart(2, '0')
        const year = numericMatch[3]
        return `${year}-${month}-${day}`
      }

      return null
    } catch (error) {
      console.error('Error parsing date:', error)
      return null
    }
  }

  // Process voice command
  const processCommand = (text: string) => {
    const lowerText = text.toLowerCase().trim()
    console.log('=== PROCESSING COMMAND ===')
    console.log('Original text:', text)
    console.log('Processed text:', lowerText)
    console.log('Available handlers:', { onCreatePatient: !!onCreatePatient, onSearch: !!onSearch, onNavigate: !!onNavigate })
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      console.log(`Testing pattern ${i + 1} (${command.action}):`, command.pattern)
      
      const matches = lowerText.match(command.pattern)
      if (matches) {
        console.log(`✅ MATCH FOUND for ${command.action}:`, matches)
        console.log('Calling handler...')
        
        try {
          command.handler(matches)
          console.log('Handler executed successfully')
        } catch (error) {
          console.error('Handler error:', error)
        }
        
        // Call the callback to close dialog
        if (onCommandProcessed) {
          setTimeout(() => {
            onCommandProcessed()
          }, 1000) // Small delay to show feedback
        }
        
        return true
      } else {
        console.log(`❌ No match for pattern ${i + 1}`)
      }
    }
    
    console.log('❌ NO COMMANDS MATCHED')
    console.log('=== END PROCESSING ===')
    
    // Still close dialog even if no command matched
    if (onCommandProcessed) {
      setTimeout(() => {
        onCommandProcessed()
      }, 1000)
    }
    
    return false
  }

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (SpeechRecognition) {
        setIsSupported(true)
        const recognition = new SpeechRecognition()
        
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        
        recognition.onstart = () => {
          setIsListening(true)
        }
        
        recognition.onend = () => {
          setIsListening(false)
          // Clear silence timer when recognition ends
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }
        }
        
        recognition.onresult = (event) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }
          
          // Update transcript with interim results for real-time display
          const currentTranscript = finalTranscript || interimTranscript
          if (currentTranscript) {
            setTranscript(currentTranscript)
            lastTranscriptRef.current = currentTranscript
            
            // Reset silence timer when speech is detected
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current)
            }
            
            // Set new silence timer (3 seconds)
            silenceTimerRef.current = setTimeout(() => {
              if (finalTranscript || lastTranscriptRef.current) {
                const commandText = finalTranscript || lastTranscriptRef.current
                processCommand(commandText)
                // Don't call stopListening here, let processCommand handle the callback
              }
            }, 3000)
          }
        }
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }
        
        recognitionRef.current = recognition
      } else {
        setIsSupported(false)
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
    
    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    
    // Reset transcript
    setTranscript('')
    lastTranscriptRef.current = ''
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    toggleListening
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}