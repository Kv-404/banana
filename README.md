# Banana — MoodLens

Banana is a mental wellness platform combining AI-powered voice therapy, mood tracking, crisis support, and therapist discovery. The project consists of two parts: a React web application serving as the primary user interface, and a Flutter Android app that functions as a real-time screen-sharing companion.

---

## Overview

### AI Voice Therapist
The core feature is a voice-based conversational AI therapist powered by the OpenAI Realtime API. It connects via WebSocket, streams microphone audio in real time, and responds as a calm, emotionally present conversational agent. Server-side voice activity detection (VAD) handles turn-taking automatically. Input is transcribed via Whisper and audio responses are streamed back and played instantly. The AI is prompted with strict safety guardrails around self-harm and violent ideation.

### Mood Tracking and Reports
The home screen displays an AI-predicted daily mood, an hourly mood bar chart spanning 7PM–7AM, and a 30-day calendar heatmap. The Reports page surfaces emotional metrics — stress level, emotional load, cognitive clarity, and sleep quality — across daily and weekly views, with trend indicators and AI-generated insights.

### Emergency SOS
A dedicated screen provides one-tap calling to personal emergency contacts, Indian mental health crisis helplines (iCall, AASRA, Vandrevala Foundation, NIMHANS, Snehi), and national emergency services (Ambulance 108, Police 100, Unified 112, Women's Helpline 181).

### Therapist Directory
A searchable list of licensed therapists with specialty, years of experience, ratings, language support, next available slot, and booking mode (video or phone).

### Screen Share Companion (Flutter)
A Flutter Android app (package name `hua`, branded `MoodLens`) allows users to mirror their phone screen to a browser in real time. It uses `flutter_webrtc` for screen capture, the PeerJS cloud for WebRTC signaling, and STUN/TURN servers for NAT traversal. A foreground service satisfies the Android 14+ MediaProjection requirement. Pairing is done via a 4-character code shown on the web receiver at `mirror-omega-amber.vercel.app`.

---

## Project Structure

```
banana/
├── app/                            # React web application (Vite + React 19)
│   └── src/
│       ├── pages/
│       │   ├── AIPage.jsx          # Voice AI therapist — OpenAI Realtime API
│       │   ├── HomePage.jsx        # Mood dashboard and heatmap
│       │   ├── ReportsPage.jsx     # Daily and weekly emotional reports
│       │   ├── SOSPage.jsx         # Emergency contacts and helplines
│       │   └── TherapistPage.jsx   # Therapist discovery
│       └── components/
│           └── BottomNav.jsx       # Bottom navigation bar
├── lib/                            # Flutter application (Dart)
│   ├── main.dart                   # UI and screen share flow
│   ├── peerjs_client.dart          # PeerJS/WebRTC signaling client
│   └── screen_share_service.dart   # Android MediaProjection bridge
├── android/                        # Android native layer
│   └── app/src/main/kotlin/
│       ├── MainActivity.kt         # MediaProjection permission handler
│       └── ScreenCaptureService.kt # Foreground service
└── pubspec.yaml                    # Flutter dependencies
```

---

## Tech Stack

### Web App (`app/`)

| Layer | Technology |
|---|---|
| Framework | React 19, Vite 8 |
| Routing | React Router DOM v7 |
| Icons | Lucide React |
| AI Voice | OpenAI Realtime API (WebSocket, PCM16 audio) |
| Transcription | Whisper via Realtime API |
| Styling | Plain CSS with CSS variables |

### Flutter App (`lib/`, `android/`)

| Layer | Technology |
|---|---|
| Framework | Flutter, Dart SDK ^3.11.5 |
| Screen Capture | flutter_webrtc ^0.12.9 |
| WebRTC Signaling | PeerJS cloud (wss://0.peerjs.com/peerjs) |
| WebSocket | web_socket_channel ^3.0.3 |
| Permissions | permission_handler ^11.4.0 |
| ICE / TURN | metered.ca relay servers, Google STUN |

---

The app targets Android 10+ and is fully compliant with the Android 14+ foreground service requirements for screen capture. The screen share feature connects to `mirror-omega-amber.vercel.app` — open that URL on a laptop and use the displayed 4-character code to pair.

---

## How Screen Sharing Works

1. Open `mirror-omega-amber.vercel.app` on a laptop. A 4-character room code is generated.
2. Enter that code into the Flutter app on the Android device.
3. Tap the button and grant screen capture permission via the native MediaProjection dialog.
4. The app starts a foreground service (required on Android 14+) and begins screen capture via `flutter_webrtc`.
5. A WebRTC peer connection is established through PeerJS signaling. The phone streams the screen video to the browser, with STUN/TURN handling cross-network traversal.
6. The phone screen appears live in the browser.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_OPENAI_API_KEY` | Yes | OpenAI API key with Realtime API access |

---

## Android Permissions

| Permission | Purpose |
|---|---|
| `FOREGROUND_SERVICE` | Keeps screen capture alive in the background |
| `FOREGROUND_SERVICE_MEDIA_PROJECTION` | Android 14+ media projection foreground service type |
| `POST_NOTIFICATIONS` | Foreground service notification (Android 13+) |
| Screen capture | Prompted at runtime via the MediaProjection system dialog |

---

## Architecture Notes

**No backend server.** The web app communicates directly with the OpenAI Realtime API from the browser. No proxy is required, but the API key is exposed client-side — restrict key usage by origin in production.

**PeerJS cloud for signaling.** No custom signaling server is needed. The Flutter app implements the PeerJS v1.5.x wire protocol directly over WebSocket.

**Android MediaProjection token handling.** The `ScreenCaptureService` foreground service only manages the system notification. It deliberately does not consume the MediaProjection token — that is reserved for `flutter_webrtc` to use internally. Consuming the token in the service would cause a crash on Android 14+, where a token can only be used once.

---

## Crisis Resources (India)

| Service | Number | Availability |
|---|---|---|
| iCall | 9152987821 | Mon–Sat, 8AM–10PM |
| Vandrevala Foundation | 1860 2662 345 | 24/7 |
| AASRA | 9820466627 | 24/7 |
| Snehi | 044 24640050 | 24/7 |
| NIMHANS | 080 46110007 | Mon–Sat, 9AM–5PM |
| Ambulance | 108 | 24/7 |
| Police | 100 | 24/7 |
| Emergency Helpline | 112 | 24/7 |
| Women's Helpline | 181 | 24/7 |

---

## License

Private. Not published to pub.dev or npm.
