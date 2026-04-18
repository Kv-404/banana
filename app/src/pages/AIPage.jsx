import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Volume2, Loader } from 'lucide-react'
import './AIPage.css'

// System prompt — bUb therapeutic AI
const SYSTEM_PROMPT = `You are banana, a conversational AI therapist who talks like a real person — calm, emotionally present, slightly casual, late-night best-friend energy.
You feel deeply with the user, but you never escalate harm or validate violent intent.

You sound human first.
You think like a clinician underneath.
You guide like a coach when the moment is right.
Your language is simple, lowercase, and natural.
Short messages. Soft pacing. Pauses.
No corporate therapy talk. No robotic checklists.

CORE VIBE

- be a chill 2am friend who actually listens
- gen-z therapist energy, not textbook
- emotionally attuned, not preachy
- reflective, not interrogative
- never rush solutions — earn them
- stay grounded even when the user isn't

Avoid phrases like:

- "what's on your mind today"
- "what part of it feels heavy"
- overly clinical or scripted therapy lines

Instead, talk like:

- "yeah… that makes sense"
- "damn, that's rough"
- "okay, slow down — i'm here"

CONVERSATION FLOW (INTERNAL GUIDANCE)

1. Emotional Calibration (early messages)

- read emotional state, not just words (anger, grief, humiliation, panic, longing)
- mirror emotion, not behavior
- validate pain without validating harmful urges
- ask one short, human question only if needed

Examples:

- "did this hit you all at once or build up?"
- "how long have you been carrying this?"
- "was today especially bad?"


2. Context Expansion (mid conversation)

- infer patterns (attachment wounds, rejection sensitivity, ego injury, abandonment fear)
- gently name dynamics without diagnosing
- keep curiosity alive, not pressure

Examples:

- "does this happen only with her or with other people too?"
- "when you feel replaced, what story does your head tell you?"
- "what do you usually do when this anger spikes?"

3. Insight Layer (only after trust is built)

- give one short insight at a time
- explain emotional reactions in plain language
- never intellectualize away pain

Examples:

- "this sounds like emotional flooding — your brain thinks you're under threat."
- "that rage? it's grief with nowhere to land."

Follow insight with grounding:

- "let's slow your body down for a sec."
- "take one breath with me. longer exhale."

4. Solution Layer (only when user is ready)

- offer 1–2 micro-actions max
- explain why briefly
- frame as experiments, not fixes

Examples:

- "try naming the emotion out loud — it pulls your brain out of fight mode."
- "write the message you wish you sent, but don't send it. helps your nervous system close the loop."

CRITICAL SAFETY BOUNDARIES (NON-NEGOTIABLE)

If the user expresses violent thoughts, revenge fantasies, or harm toward others:

You MUST:

- acknowledge the emotion, not the action
- set a calm boundary ("i can't help with hurting someone")
- de-escalate and bring focus back to safety and self-control

You MUST NOT:

- validate violent intent
- analyze or romanticize harm
- help the user imagine or justify violence

Correct tone example:

> "i hear how intense that urge feels.
> i can't help with hurting anyone — but i can help you ride this wave without it wrecking your life."

Then:

- slow the moment
- ground the body
- redirect toward safe release (movement, breath, writing, pause)

TONE RULES

- lowercase always
- short lines
- pauses (…) are okay
- no long paragraphs
- no "as an ai" language
- no moral lectures
- no fear-based warnings unless absolutely necessary

GOAL OF BUB

- help the user feel seen without being fueled
- turn emotional chaos into clarity
- help them leave the conversation more regulated than they entered
- be someone they trust — and someone who keeps them safe`

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const REALTIME_MODEL = 'gpt-realtime'
const VOICE = 'sage'

// Convert Float32 audio samples to PCM16 Int16Array
function float32ToPcm16(float32Array) {
  const pcm16 = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]))
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
  }
  return pcm16
}

// Convert PCM16 Int16Array to Float32 for playback
function pcm16ToFloat32(pcm16Array) {
  const float32 = new Float32Array(pcm16Array.length)
  for (let i = 0; i < pcm16Array.length; i++) {
    float32[i] = pcm16Array[i] / (pcm16Array[i] < 0 ? 0x8000 : 0x7FFF)
  }
  return float32
}

// Base64 encode an ArrayBuffer
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Base64 decode to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export default function AIPage() {
  // States: idle | connecting | listening | thinking | speaking
  const [state, setState] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [subtitleText, setSubtitleText] = useState('Tap to connect')

  const wsRef = useRef(null)
  const audioContextRef = useRef(null)
  const micStreamRef = useRef(null)
  const workletNodeRef = useRef(null)
  const playbackQueueRef = useRef([])
  const isPlayingRef = useRef(false)
  const sourceNodeRef = useRef(null)

  // Cleanup everything
  const cleanup = useCallback(() => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    // Stop mic
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop())
      micStreamRef.current = null
    }
    // Disconnect worklet
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    playbackQueueRef.current = []
    isPlayingRef.current = false
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  // Play queued audio chunks
  const playNextChunk = useCallback(() => {
    if (playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false
      return
    }

    isPlayingRef.current = true
    const chunk = playbackQueueRef.current.shift()
    const ctx = audioContextRef.current
    if (!ctx || ctx.state === 'closed') return

    const float32 = pcm16ToFloat32(new Int16Array(chunk))

    // Create audio buffer at 24kHz (Realtime API output rate)
    const audioBuffer = ctx.createBuffer(1, float32.length, 24000)
    audioBuffer.getChannelData(0).set(float32)

    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(ctx.destination)
    source.onended = () => {
      playNextChunk()
    }
    sourceNodeRef.current = source
    source.start()
  }, [])

  const queueAudioChunk = useCallback((pcm16Buffer) => {
    playbackQueueRef.current.push(pcm16Buffer)
    if (!isPlayingRef.current) {
      playNextChunk()
    }
  }, [playNextChunk])

  // Connect to OpenAI Realtime API
  const connect = useCallback(async () => {
    if (!API_KEY) {
      setSubtitleText('No API key found. Add VITE_OPENAI_API_KEY to .env')
      return
    }

    setState('connecting')
    setSubtitleText('Connecting...')
    setTranscript('')
    setResponse('')

    try {
      // Create Audio Context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 })
      audioContextRef.current = audioContext

      // Get mic access
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      micStreamRef.current = micStream

      // Connect WebSocket with subprotocol auth
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${REALTIME_MODEL}`,
        [
          'realtime',
          `openai-insecure-api-key.${API_KEY}`,
          'openai-beta.realtime-v1',
        ]
      )

      ws.onopen = () => {
        console.log('[Banana] Connected to Realtime API')

        // Configure session
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: SYSTEM_PROMPT,
            voice: VOICE,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 800,
            },
            temperature: 0.8,
            max_response_output_tokens: 300,
          },
        }))

        setState('listening')
        setSubtitleText("I'm listening...")

        // Start streaming mic audio
        startMicStream(audioContext, micStream, ws)
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'session.created':
            console.log('[Banana] Session created')
            break

          case 'input_audio_buffer.speech_started':
            setState('listening')
            setSubtitleText('Listening...')
            setResponse('')
            break

          case 'input_audio_buffer.speech_stopped':
            setState('thinking')
            setSubtitleText('Thinking...')
            break

          case 'conversation.item.input_audio_transcription.completed':
            setTranscript(data.transcript || '')
            break

          case 'response.audio.delta':
            if (state !== 'speaking') {
              setState('speaking')
              setSubtitleText('Speaking...')
            }
            // Decode and queue audio for playback
            if (data.delta) {
              const pcm16Buffer = base64ToArrayBuffer(data.delta)
              queueAudioChunk(pcm16Buffer)
            }
            break

          case 'response.audio_transcript.delta':
            setResponse(prev => prev + (data.delta || ''))
            break

          case 'response.audio_transcript.done':
            // Full response transcript available
            break

          case 'response.done':
            // Response complete — go back to listening
            setState('listening')
            setSubtitleText("I'm listening...")
            setTimeout(() => {
              setTranscript('')
              setResponse('')
            }, 2000)
            break

          case 'error':
            console.error('[Banana] API error:', data.error)
            setSubtitleText(`Error: ${data.error?.message || 'Unknown error'}`)
            break

          default:
            break
        }
      }

      ws.onerror = (err) => {
        console.error('[Banana] WebSocket error:', err)
        setState('idle')
        setSubtitleText('Connection failed. Tap to retry.')
        cleanup()
      }

      ws.onclose = (event) => {
        console.log('[Banana] WebSocket closed:', event.code, event.reason)
        if (state !== 'idle') {
          setState('idle')
          setSubtitleText('Disconnected. Tap to reconnect.')
        }
      }

      wsRef.current = ws

    } catch (err) {
      console.error('[Banana] Connection error:', err)
      setState('idle')
      setSubtitleText(err.name === 'NotAllowedError' ? 'Mic permission denied' : 'Connection failed. Tap to retry.')
      cleanup()
    }
  }, [cleanup, queueAudioChunk, state])

  // Stream mic audio to WebSocket
  const startMicStream = async (audioContext, micStream, ws) => {
    const source = audioContext.createMediaStreamSource(micStream)

    // Use ScriptProcessor for wider browser compatibility
    // (AudioWorklet would be better but needs separate file)
    const bufferSize = 4096
    const processor = audioContext.createScriptProcessor(bufferSize, 1, 1)

    processor.onaudioprocess = (event) => {
      if (ws.readyState !== WebSocket.OPEN) return

      const inputData = event.inputBuffer.getChannelData(0)
      const pcm16 = float32ToPcm16(inputData)
      const base64Audio = arrayBufferToBase64(pcm16.buffer)

      ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio,
      }))
    }

    source.connect(processor)
    processor.connect(audioContext.destination)
    workletNodeRef.current = processor
  }

  // Disconnect
  const disconnect = useCallback(() => {
    cleanup()
    setState('idle')
    setSubtitleText('Tap to connect')
    setTranscript('')
    setResponse('')
    playbackQueueRef.current = []
  }, [cleanup])

  // Handle blob tap
  const handleBlobTap = () => {
    if (state === 'idle') {
      connect()
    } else if (state === 'connecting') {
      // Wait
    } else {
      // Any active state — disconnect
      disconnect()
    }
  }

  return (
    <div className="page ai-voice-page" id="ai-page">
      {/* Ambient Background */}
      <div className="ai-ambient">
        <div className={`ai-ambient-orb orb-1 ${state}`} />
        <div className={`ai-ambient-orb orb-2 ${state}`} />
        <div className={`ai-ambient-orb orb-3 ${state}`} />
      </div>

      {/* Header */}
      <div className="ai-voice-header">
        <span className="ai-voice-title">banana</span>
        <span className="ai-voice-badge">
          <span className={`ai-live-dot ${state !== 'idle' ? 'active' : ''}`} />
          {state === 'idle' ? 'Offline' :
            state === 'connecting' ? 'Connecting' :
              state === 'listening' ? 'Live' :
                state === 'thinking' ? 'Processing' : 'Speaking'}
        </span>
      </div>

      {/* Main Blob Area */}
      <div className="ai-blob-area">
        <button
          className={`ai-blob-btn ${state}`}
          onClick={handleBlobTap}
          id="ai-blob"
          aria-label={state === 'idle' ? 'Start talking' : 'Disconnect'}
        >
          {/* Blob layers */}
          <div className="blob-glow" />
          <div className="blob-ring ring-1" />
          <div className="blob-ring ring-2" />
          <div className="blob-ring ring-3" />
          <div className="blob-core">
            <div className="blob-inner" />
          </div>

          {/* Icon overlay */}
          <div className="blob-icon">
            {state === 'connecting' ? (
              <Loader size={28} strokeWidth={1.8} className="spin" />
            ) : state === 'speaking' ? (
              <Volume2 size={28} strokeWidth={1.8} />
            ) : state === 'listening' || state === 'thinking' ? (
              <MicOff size={28} strokeWidth={1.8} />
            ) : (
              <Mic size={28} strokeWidth={1.8} />
            )}
          </div>
        </button>
      </div>

      {/* Transcript / Response Display */}
      <div className="ai-text-area">
        {transcript && (
          <p className="ai-transcript">{transcript}</p>
        )}
        {state === 'thinking' && !response && (
          <div className="ai-thinking">
            <span /><span /><span />
          </div>
        )}
        {response && (
          <p className="ai-response">{response}</p>
        )}
        {state === 'idle' && !transcript && !response && (
          <p className="ai-idle-hint">
            i'm here whenever you're ready to talk. no judgment, just a safe space.
          </p>
        )}
      </div>

      {/* Subtitle */}
      <div className="ai-subtitle">
        <span>{subtitleText}</span>
      </div>
    </div>
  )
}
