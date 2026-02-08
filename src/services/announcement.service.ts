import Tts from 'react-native-tts';
import TTSVolumeModule from './tts-volume.native';
import Sound from 'react-native-sound';
import { Platform } from 'react-native';

class AnnouncementService {
  private isInitialized = false;
  private isSpeaking = false;
  private currentSound: Sound | null = null;
  private isPlayingAudio = false;
  private playbackLock = false; // Prevent multiple simultaneous playbacks

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize audio system for high-quality playback
      Sound.setCategory('Playback', true); // Exclusive playback, no mixing
      Sound.setMode('Default');
      console.log('🔊 Audio system initialized');
      
      // Set device volume to maximum for announcements
      try {
        await TTSVolumeModule.setMaxVolume();
        console.log('🔊 Volume set to maximum');
      } catch (volumeError) {
        console.log('⚠️ Could not set max volume:', volumeError);
      }

      // Get available voices and select the best quality English MALE voice
      const voices = await Tts.voices();
      console.log('📋 Available voices:', voices.map((v: any) => `${v.name} (${v.language}) [Quality: ${v.quality}]`).join(', '));
      
      // Priority order for best MALE voice quality:
      // 1. Male Google voices
      // 2. Male Enhanced/Premium/Neural voices
      // 3. Any male voice
      // 4. Any English voice (fallback)
      
      const googleMaleVoice = voices.find((v: any) => 
        v.name.toLowerCase().includes('google') && 
        v.language.startsWith('en-') &&
        (v.name.toLowerCase().includes('male') || 
         v.name.toLowerCase().includes('man') ||
         v.name.toLowerCase().includes('-d') || // Male identifier
         v.name.toLowerCase().includes('-b'))   // Male identifier
      );
      
      const enhancedMaleVoice = voices.find((v: any) => 
        (v.name.toLowerCase().includes('enhanced') || 
         v.name.toLowerCase().includes('premium') ||
         v.name.toLowerCase().includes('neural') ||
         v.name.toLowerCase().includes('wavenet')) &&
        v.language.startsWith('en-') &&
        (v.name.toLowerCase().includes('male') || 
         v.name.toLowerCase().includes('man') ||
         v.name.toLowerCase().includes('-d') ||
         v.name.toLowerCase().includes('-b')) &&
        !v.name.toLowerCase().includes('compact') &&
        !v.name.toLowerCase().includes('female')
      );
      
      const anyMaleVoice = voices.find((v: any) => 
        v.language.startsWith('en-') &&
        (v.name.toLowerCase().includes('male') || 
         v.name.toLowerCase().includes('man') ||
         v.name.toLowerCase().includes('-d') ||
         v.name.toLowerCase().includes('-b')) &&
        !v.name.toLowerCase().includes('female')
      );
      
      const standardVoice = voices.find((v: any) => 
        (v.language === 'en-US' || v.language === 'en-GB') &&
        !v.name.toLowerCase().includes('compact') &&
        !v.name.toLowerCase().includes('female')
      );
      
      const selectedVoice = googleMaleVoice || enhancedMaleVoice || anyMaleVoice || standardVoice;
      
      if (selectedVoice) {
        await Tts.setDefaultVoice(selectedVoice.id);
        console.log('🗣️ Selected MALE voice:', selectedVoice.name, selectedVoice.language);
      } else {
        console.log('⚠️ No male voice found, using system default');
      }

      // Initialize TTS with optimized settings
      await Tts.setDefaultLanguage('en-US');
      await Tts.setDefaultRate(0.25); // Very slow for maximum clarity
      await Tts.setDefaultPitch(0.85); // Lower pitch for deeper male voice
      
      // Set volume to maximum
      try {
        await Tts.setDucking(false); // Don't reduce volume when other audio plays
      } catch (e) {
        console.log('⚠️ Ducking not supported');
      }

      // Set up event listeners
      Tts.addEventListener('tts-start', () => {
        console.log('🔊 TTS Started');
        this.isSpeaking = true;
      });

      Tts.addEventListener('tts-finish', () => {
        console.log('🔇 TTS Finished');
        this.isSpeaking = false;
      });

      Tts.addEventListener('tts-cancel', () => {
        console.log('🔇 TTS Cancelled');
        this.isSpeaking = false;
      });

      this.isInitialized = true;
      console.log('✅ Announcement Service Initialized');
    } catch (error) {
      console.error('❌ Failed to initialize TTS:', error);
    }
  }

  private processTextForSpeech(text: string): string {
    // Clean the text - replace line breaks with pauses
    let processed = text.replace(/\n+/g, '. ').replace(/\s+/g, ' ').trim();
    
    // Convert numbers to individual digits for better pronunciation
    // Match any sequence of digits
    processed = processed.replace(/\b(\d+)\b/g, (match) => {
      // Split number into individual digits with spaces
      return match.split('').join(' ');
    });
    
    // Add significant pauses after periods for better pacing
    processed = processed.replace(/\.\s+/g, '. ..... ');
    
    // Add slight pauses after commas
    processed = processed.replace(/,\s+/g, ', .. ');
    
    console.log('📝 Processed text:', processed);
    return processed;
  }

  async announce(text: string): Promise<number> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // CRITICAL: Check if already playing
      if (this.playbackLock) {
        console.log('⚠️ Already playing, rejecting duplicate TTS request');
        throw new Error('Announcement already in progress');
      }

      // Acquire lock
      this.playbackLock = true;
      console.log('🔒 TTS lock acquired');

      // Ensure volume is at maximum before each announcement
      try {
        await TTSVolumeModule.setMaxVolume();
      } catch (volumeError) {
        console.log('⚠️ Could not set max volume:', volumeError);
      }

      // Stop any ongoing speech to prevent repeats
      if (this.isSpeaking) {
        console.log('⚠️ Already speaking, stopping previous announcement');
        await Tts.stop();
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Process text for better speech
      const processedText = this.processTextForSpeech(text);
      
      console.log('📢 Announcing:', processedText);
      
      // Speak the announcement (this returns immediately)
      Tts.speak(processedText);
      
      // Calculate duration based on speech rate (0.25 - very slow)
      // At 0.25 rate: roughly 80 words per minute (very slow and clear)
      const wordCount = processedText.split(' ').length;
      const durationMs = Math.max((wordCount / 80) * 60 * 1000, 8000); // Minimum 8 seconds
      
      console.log(`⏱️ Estimated duration: ${durationMs}ms for ${wordCount} words`);
      
      // Release lock after duration
      setTimeout(() => {
        this.playbackLock = false;
        console.log('🔓 TTS lock released');
      }, durationMs);
      
      return durationMs;
    } catch (error) {
      console.error('❌ Failed to announce:', error);
      this.playbackLock = false; // Release lock on error
      return 8000; // Return default duration on error
    }
  }

  async stop() {
    try {
      if (this.isSpeaking) {
        await Tts.stop();
        this.isSpeaking = false;
      }
    } catch (error) {
      console.error('❌ Failed to stop TTS:', error);
    }
  }

  getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }

  async listAvailableVoices(): Promise<any[]> {
    try {
      const voices = await Tts.voices();
      console.log('🎙️ All Available Voices:');
      voices.forEach((v: any, index: number) => {
        const gender = v.name.toLowerCase().includes('male') ? '👨 MALE' : 
                      v.name.toLowerCase().includes('female') ? '👩 Female' : '❓';
        console.log(`${index + 1}. ${gender} - ${v.name} (${v.language}) - ID: ${v.id}`);
      });
      
      console.log('\n🎙️ Male Voices Only:');
      const maleVoices = voices.filter((v: any) => 
        v.name.toLowerCase().includes('male') || 
        v.name.toLowerCase().includes('man') ||
        v.name.toLowerCase().includes('-d') ||
        v.name.toLowerCase().includes('-b')
      );
      maleVoices.forEach((v: any, index: number) => {
        console.log(`${index + 1}. 👨 ${v.name} (${v.language})`);
      });
      
      return voices;
    } catch (error) {
      console.error('❌ Failed to list voices:', error);
      return [];
    }
  }

  async setVoiceByName(voiceName: string): Promise<boolean> {
    try {
      const voices = await Tts.voices();
      const voice = voices.find((v: any) => 
        v.name.toLowerCase().includes(voiceName.toLowerCase())
      );
      
      if (voice) {
        await Tts.setDefaultVoice(voice.id);
        console.log('✅ Voice set to:', voice.name);
        return true;
      } else {
        console.log('❌ Voice not found:', voiceName);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to set voice:', error);
      return false;
    }
  }

  async playAudioFromUrl(audioUrl: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        // CRITICAL: Check if already playing
        if (this.playbackLock) {
          console.log('⚠️ Already playing audio, rejecting duplicate request');
          reject(new Error('Audio already playing'));
          return;
        }

        // Acquire lock immediately
        this.playbackLock = true;
        console.log('🔒 Playback lock acquired');

        // Stop ALL ongoing audio or TTS with cleanup
        await this.stopAll();
        
        // Wait for complete cleanup
        await new Promise(resolve => setTimeout(resolve, 300));

        // Set volume to maximum
        try {
          await TTSVolumeModule.setMaxVolume();
          console.log('🔊 Volume set to maximum');
        } catch (e) {
          console.log('⚠️ Could not set volume:', e);
        }

        console.log('🎵 Loading audio from:', audioUrl);

        // Enable playback in silence mode and set to maximum quality
        Sound.setCategory('Playback', true); // true = mixWithOthers: false (exclusive)
        Sound.setMode('Default');

        // Create new sound instance
        const sound = new Sound(audioUrl, '', (error) => {
          if (error) {
            console.error('❌ Failed to load audio:', error);
            this.playbackLock = false; // Release lock on error
            reject(error);
            return;
          }

          console.log('✅ Audio loaded successfully');
          const duration = sound.getDuration();
          console.log(`⏱️ Duration: ${duration} seconds`);

          // Validate audio loaded properly
          if (duration <= 0) {
            console.error('❌ Invalid audio duration');
            sound.release();
            this.playbackLock = false;
            reject(new Error('Invalid audio file'));
            return;
          }

          this.currentSound = sound;
          this.isPlayingAudio = true;

          // Set volume to maximum (1.0)
          sound.setVolume(1.0);

          // Set number of loops to 0 (play once only)
          sound.setNumberOfLoops(0);

          console.log('▶️ Starting audio playback...');

          // Play the audio
          sound.play((success) => {
            console.log('🎵 Playback callback triggered, success:', success);
            
            this.isPlayingAudio = false;
            this.playbackLock = false; // Release lock when done
            
            if (success) {
              console.log('✅ Audio playback completed successfully');
            } else {
              console.error('❌ Audio playback failed or was interrupted');
            }

            // Release the audio player resource
            sound.release();
            this.currentSound = null;
            console.log('🗑️ Audio resource released');
          });

          // Return the duration in milliseconds with extra buffer
          const durationMs = Math.max(duration * 1000 + 500, 5000);
          console.log(`⏱️ Returning duration: ${durationMs}ms`);
          resolve(durationMs);
        });

      } catch (error) {
        console.error('❌ Error in playAudioFromUrl:', error);
        this.playbackLock = false; // Release lock on error
        this.isPlayingAudio = false;
        reject(error);
      }
    });
  }

  async stopAll() {
    console.log('🛑 Stopping all playback...');
    
    // Stop TTS
    if (this.isSpeaking) {
      try {
        await Tts.stop();
        this.isSpeaking = false;
        console.log('✅ TTS stopped');
      } catch (e) {
        console.log('⚠️ Error stopping TTS:', e);
      }
    }

    // Stop audio playback
    if (this.currentSound) {
      try {
        // Stop and release current sound
        this.currentSound.stop(() => {
          if (this.currentSound) {
            this.currentSound.release();
            console.log('✅ Audio stopped and released');
          }
        });
        this.currentSound = null;
        this.isPlayingAudio = false;
      } catch (e) {
        console.log('⚠️ Error stopping audio:', e);
        // Force cleanup
        this.currentSound = null;
        this.isPlayingAudio = false;
      }
    }

    // Don't release lock here - let the calling function handle it
    console.log('✅ All playback stopped');
  }

  getPlayingStatus(): boolean {
    return this.isSpeaking || this.isPlayingAudio || this.playbackLock;
  }

  cleanup() {
    try {
      // Stop all playback
      this.stopAll();
      
      // Force release lock
      this.playbackLock = false;
      
      // Remove TTS event listeners
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
      
      this.isInitialized = false;
      this.isSpeaking = false;
      this.isPlayingAudio = false;
      console.log('🧹 Announcement Service Cleaned Up');
    } catch (error) {
      console.error('❌ Failed to cleanup:', error);
    }
  }
}

export const announcementService = new AnnouncementService();
