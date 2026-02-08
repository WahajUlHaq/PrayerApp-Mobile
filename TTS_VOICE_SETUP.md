# TTS Voice Quality Improvement Guide

## Current Implementation

The app now:
- ✅ Prioritizes Google TTS voices (highest quality)
- ✅ Falls back to enhanced/premium/neural voices
- ✅ Set to very slow speed (0.25 rate) for clarity
- ✅ Lower pitch (0.95) for natural male voice
- ✅ Longer pauses between sentences
- ✅ Maximum volume control

## How to Get Better Voice Quality

### Option 1: Install Google Text-to-Speech (Recommended)

1. Open **Google Play Store** on your Android device
2. Search for **"Google Text-to-Speech"**
3. Install/Update the app
4. Go to **Settings > System > Languages & Input > Text-to-speech output**
5. Select **Google Text-to-Speech Engine** as preferred engine
6. Tap the gear icon next to it
7. Download **"English (United States)"** voice data if not already installed
8. Look for **"Install voice data"** and download high-quality voices

### Option 2: Adjust Android TTS Settings

1. Go to **Settings > Accessibility > Text-to-Speech**
2. Or **Settings > System > Languages & Input > Text-to-speech output**
3. Select your TTS engine (prefer Google)
4. Download additional voice packs if available
5. Test the voice using the "Listen to an example" button

### Option 3: Install Third-Party TTS Engines

High-quality alternatives:
- **Samsung TTS** (on Samsung devices)
- **Cerence TTS** (high quality, may require purchase)
- **Acapela TTS** (professional quality)
- **IVONA Text-to-Speech** (Amazon's engine)

### Voice Testing

When the app starts, check the logs (Logcat) to see all available voices:
```
📋 Available voices: Google en-US, Samsung TTS en-US, ...
🗣️ Selected voice: [voice name]
```

### Manual Voice Selection (Developer)

You can manually test voices by calling:
```typescript
// List all voices
await announcementService.listAvailableVoices();

// Set specific voice by name
await announcementService.setVoiceByName('google'); // or 'enhanced', 'neural', etc.
```

## Troubleshooting

**Voice still sounds robotic?**
- Make sure Google TTS is installed and set as default
- Download high-quality voice data (not compact versions)
- Check device's TTS settings and test the voice there first

**Volume too low?**
- The app automatically sets media volume to maximum
- Check device's master volume
- Ensure "Do Not Disturb" mode is off

**Speech too fast/slow?**
- Current speed: 0.25 (very slow)
- Adjust in `announcement.service.ts` line ~43: `setDefaultRate(0.25)`
- Lower = slower, Higher = faster (range: 0.0 - 1.0)

## Default Voice Priority

The app selects voices in this order:
1. **Google voices** (e.g., "Google en-US-Wavenet-*")
2. **Enhanced/Premium/Neural voices**
3. **Standard US/UK English voices**
4. **System default**

The selected voice will be logged on app startup.
