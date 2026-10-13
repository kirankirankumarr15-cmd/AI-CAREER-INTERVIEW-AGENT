interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: {
    [index: number]: SpeechRecognitionResultItem;
  };
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

export class SpeechToTextEngine {
  private recognition: ISpeechRecognition | null = null;
  private isListening: boolean = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (this.onResultCallback) {
            this.onResultCallback(transcript);
          }
        };

        this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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
    } catch (e: unknown) {
      console.warn('Speech recognition start error:', e);
    }
  }

  public stop() {
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
      this.isListening = false;
    } catch (e: unknown) {
      console.warn('Speech recognition stop error:', e);
    }
  }

  public getActiveListeningState(): boolean {
    return this.isListening;
  }
}

export const sttEngine = new SpeechToTextEngine();
