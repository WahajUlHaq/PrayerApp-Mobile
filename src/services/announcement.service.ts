class AnnouncementService {
  private isInitialized = false;
  private isDisplaying = false;

  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('✅ Announcement Service Initialized (text-only)');
  }

  calculateDisplayDuration(text: string): number {
    // Calculate duration based on text length
    // Average reading speed: 200-250 words per minute
    // We'll use 3 seconds per sentence minimum, plus time based on length
    const wordCount = text.split(/\s+/).length;
    const readingTimeMs = (wordCount / 200) * 60 * 1000; // milliseconds
    const minimumTime = 5000; // 5 seconds minimum
    const maximumTime = 30000; // 30 seconds maximum
    
    const duration = Math.max(minimumTime, Math.min(readingTimeMs, maximumTime));
    console.log(`📝 Text: ${wordCount} words, display duration: ${duration}ms`);
    return duration;
  }

  getDisplayingStatus(): boolean {
    return this.isDisplaying;
  }

  setDisplaying(displaying: boolean) {
    this.isDisplaying = displaying;
  }

  cleanup() {
    this.isInitialized = false;
    this.isDisplaying = false;
    console.log('🧹 Announcement Service Cleaned Up');
  }
}

export const announcementService = new AnnouncementService();
