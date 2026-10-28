import { Task } from '../types';

export interface SpeechController {
  isPlaying: boolean;
  isPaused: boolean;
  play: (text: string, onEnd?: () => void) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private rate: number = 1.0;
  private pitch: number = 1.0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize natural English voices
    const preferred = voices.find(
      v =>
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen') || v.name.includes('Zira')) &&
        v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferred) {
      this.selectedVoice = preferred;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices().filter(v => v.lang.startsWith('en'));
  }

  public setVoice(voice: SpeechSynthesisVoice) {
    this.selectedVoice = voice;
  }

  public setRate(rate: number) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
    if (this.currentUtterance) {
      this.currentUtterance.rate = this.rate;
    }
  }

  public setPitch(pitch: number) {
    this.pitch = Math.max(0.5, Math.min(1.5, pitch));
  }

  public isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (!this.synth) {
      if (onError) onError(new Error('Speech Synthesis not supported in this browser.'));
      return;
    }

    this.stop();

    // Clean markdown/symbols from spoken text
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#+\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('[Speech Synthesis Warning]:', e);
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return Boolean(this.synth && this.synth.speaking);
  }

  public isPaused(): boolean {
    return Boolean(this.synth && this.synth.paused);
  }

  /**
   * Generates a natural, spoken explanation script for the task:
   * Covers:
   * 1. Warm greeting and task objective
   * 2. Required modules with descriptions
   * 3. Expected deliverable output
   * 4. Deadline and review expectations
   */
  public generateSpokenScript(internName: string, task: Task): string {
    const modulesExplanation = task.modules
      .map((m, idx) => `Module ${idx + 1}: ${m.title}. ${m.description}`)
      .join('. ');

    return `Hello ${internName}! Welcome to your task briefing for: ${task.title}. ` +
      `Here is your task objective: ${task.objective}. ` +
      `To successfully finish this project, you need to complete the following ${task.modules.length} required modules: ` +
      `${modulesExplanation}. ` +
      `For your expected output: ${task.expected_output}. ` +
      `Your current deadline is set for ${task.deadline}. ` +
      `Be sure to upload your source code or archive before your review session. ` +
      `You can ask me questions anytime using the AI Task Chatbot below. Good luck!`;
  }
}

export const speechService = new SpeechService();
