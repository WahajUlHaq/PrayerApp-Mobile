# Announcement System Documentation

## Overview

The Prayer App supports two types of announcements:
1. **Mobile TTS** - Uses device's text-to-speech engine
2. **Server Audio** - Plays pre-recorded audio files from server (e.g., ElevenLabs AI voice)

---

## Socket Event: `client:announce`

### Data Format

#### Option 1: Use Mobile TTS

```json
{
  "_id": "65f1234567890abcdef12345",
  "text": "Please turn off your mobile phones. Parking is available in lot B123.",
  "useMobileTTS": true,
  "message": "Announcement from admin",
  "timestamp": "2026-02-08T10:30:00.000Z",
  "elevenLabsError": "Request failed with status code 401"
}
```

**When to use:**
- Server's text-to-speech service (e.g., ElevenLabs) failed
- Admin prefers to use device's local TTS
- Network bandwidth concerns

**Features:**
- ✅ Automatic male voice selection
- ✅ Very slow speed (0.25 rate) for clarity
- ✅ Numbers read as individual digits
- ✅ Maximum volume control
- ✅ No network dependency after initial text delivery

---

#### Option 2: Use Server Audio File

```json
{
  "_id": "65f1234567890abcdef12345",
  "text": "Please turn off your mobile phones. Parking is available in lot B123.",
  "audioUrl": "http://192.168.18.7:5000/api/announcements/audio/announcement-1738976543210.mp3",
  "useMobileTTS": false,
  "message": "Announcement from admin",
  "timestamp": "2026-02-08T10:30:00.000Z"
}
```

**When to use:**
- High-quality AI voice available (ElevenLabs, Google Cloud TTS, etc.)
- Professional voice quality required
- Consistent voice across all devices

**Features:**
- ✅ Professional AI-generated voice
- ✅ Natural intonation and emotion
- ✅ Consistent quality across devices
- ✅ Maximum volume control
- ✅ Automatic audio playback

---

## API Endpoint

### Get Audio File

```http
GET /api/announcements/audio/:filename
```

**Response:**
- Content-Type: `audio/mpeg`
- Body: MP3 audio file

**Example:**
```
GET /api/announcements/audio/announcement-1738976543210.mp3
```

---

## Client Response

The mobile app sends a confirmation back to the server via `client:announced` event:

### Success Response

```json
{
  "clientId": "abc123xyz",
  "status": "received",
  "usedTTS": true,
  "timestamp": "2026-02-08T10:30:05.000Z"
}
```

### Error Response

```json
{
  "clientId": "abc123xyz",
  "status": "error",
  "error": "Failed to load audio file",
  "timestamp": "2026-02-08T10:30:05.000Z"
}
```

---

## Implementation Details

### Mobile TTS Configuration

- **Engine**: Device's default TTS (prioritizes Google TTS if available)
- **Voice**: Male voice automatically selected
- **Speed**: 0.25 (very slow, ~80 words/min)
- **Pitch**: 0.85 (lower for natural male voice)
- **Volume**: Maximum (automatically set)

### Audio Playback

- **Library**: react-native-sound
- **Format**: MP3
- **Volume**: Maximum (automatically set)
- **Category**: Playback (works in silent mode on iOS)

### On-Screen Display

Both announcement types display the text on screen with:
- Full-screen blur overlay
- Large, centered text
- "ANNOUNCEMENT" header
- Stays visible until audio/speech completes

---

## Testing

### Test Mobile TTS

Send socket event:
```javascript
socket.emit('client:announce', {
  _id: 'test-001',
  text: 'Test announcement for mobile TTS. Number 123 will be read as one two three.',
  useMobileTTS: true,
  message: 'Test',
  timestamp: new Date().toISOString()
});
```

### Test Audio Playback

Send socket event:
```javascript
socket.emit('client:announce', {
  _id: 'test-002',
  text: 'Test announcement with audio file',
  audioUrl: 'http://your-server.com/api/announcements/audio/test.mp3',
  useMobileTTS: false,
  message: 'Test',
  timestamp: new Date().toISOString()
});
```

---

## Error Handling

The app handles errors gracefully:

1. **No text available** (useMobileTTS = true, but no text)
   - Returns error to server
   - No announcement displayed

2. **Audio load failure** (useMobileTTS = false, but audioUrl fails)
   - Returns error to server with details
   - No announcement displayed

3. **Invalid data format**
   - Returns error to server
   - Logs warning in console

4. **Duplicate announcements**
   - Ignores duplicate requests while one is active
   - Logs warning in console

---

## Voice Quality Tips

For best mobile TTS quality:

1. **Install Google Text-to-Speech**
   - Play Store > "Google Text-to-Speech"
   - Download high-quality voice packs

2. **Android Settings**
   - Settings > Languages & Input > Text-to-speech
   - Select Google TTS as preferred engine
   - Test voice quality

3. **Check Available Voices**
   - App logs all available voices on startup
   - Look for: "🗣️ Selected MALE voice: [name]"

---

## Files Modified/Created

1. `src/services/announcement.service.ts` - Main announcement logic
2. `src/services/tts-volume.native.ts` - Native volume control interface
3. `android/app/src/main/java/com/prayermobileapp/TTSVolumeModule.kt` - Android volume control
4. `android/app/src/main/java/com/prayermobileapp/TTSVolumePackage.kt` - Native module package
5. `src/types/announcement.types.ts` - TypeScript interfaces
6. `src/screens/frame/Frame.tsx` - Socket handler integration

---

## Dependencies

- `react-native-tts: ^4.1.1` - Text-to-speech
- `react-native-sound: ^0.13.0` - Audio playback
- `socket.io-client: 4.8.1` - Real-time communication
