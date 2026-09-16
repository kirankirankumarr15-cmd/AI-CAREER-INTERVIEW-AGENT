export class SpeechToTextEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (this.onResultCallback) {
            this.onResultCallback(transcript);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (this.onErrorCallback) {
            this.onErrorCallback(event.error);
          }
          this.isListening = false;
        };

        this.recognition.onend = () => {
          this.isListening = false;
        };
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public start(onResult: (text: string) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      if (onError) onError('Speech recognition is not supported in this browser. Please type your response.');
      return;
    }
    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.warn('Speech recognition start error:', e);
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Speech recognition stop error:', e);
      }
      this.isListening = false;
    }
  }
}

export const sttEngine = new SpeechToTextEngine();
