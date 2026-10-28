import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { speechService } from '../services/speech';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  FileText,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface VoiceExplanationPlayerProps {
  internName: string;
  task: Task;
  onVoiceTriggeredEmail?: () => void;
}

export const VoiceExplanationPlayer: React.FC<VoiceExplanationPlayerProps> = ({
  internName,
  task,
  onVoiceTriggeredEmail,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [emailDispatched, setEmailDispatched] = useState<boolean>(false);

  const speechScript = speechService.generateSpokenScript(internName, task);

  useEffect(() => {
    const available = speechService.getVoices();
    setVoices(available);
    if (available.length > 0 && !selectedVoiceName) {
      setSelectedVoiceName(available[0].name);
    }
  }, []);

  const handlePlay = () => {
    if (isPaused) {
      speechService.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    setIsPlaying(true);
    setIsPaused(false);

    // Trigger sending the First Email (deadline, scheduled date, meeting link) upon voice playback
    if (onVoiceTriggeredEmail) {
      onVoiceTriggeredEmail();
      setEmailDispatched(true);
    }

    speechService.speak(
      speechScript,
      () => {
        setIsPlaying(true);
        setIsPaused(false);
      },
      () => {
        setIsPlaying(false);
        setIsPaused(false);
      },
      err => {
        console.error(err);
        setIsPlaying(false);
        setIsPaused(false);
      }
    );
  };

  const handlePause = () => {
    speechService.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    speechService.stop();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleReplay = () => {
    handleStop();
    setTimeout(() => {
      handlePlay();
    }, 150);
  };

  const handleRateChange = (newRate: number) => {
    setSpeechRate(newRate);
    speechService.setRate(newRate);
  };

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoiceName(voiceName);
    const chosen = voices.find(v => v.name === voiceName);
    if (chosen) {
      speechService.setVoice(chosen);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Title & Soundwave status */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Sparkles className="w-3 h-3 text-blue-300" />
              AI Voice Briefing
            </span>
            <span className="text-xs text-slate-400">Natural Spoken Explanation</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Listen to Your Task Objective &amp; Requirements
          </h3>

          <p className="text-xs text-slate-300 line-clamp-2">
            InternPilot AI explains the purpose, required modules, expected output, and deadline in natural conversational English.
          </p>

          {/* Animated sound wave bars when playing */}
          {isPlaying && (
            <div className="flex items-center gap-1 pt-1">
              {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 60].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-blue-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.round(h * 0.22)}px`,
                    animationDuration: `${0.4 + (i % 4) * 0.15}s`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
              <span className="text-[11px] text-blue-300 ml-2 font-medium">Speaking Task Briefing...</span>
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          {/* Main Play / Pause Button */}
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/30 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isPaused ? 'Resume Voice' : 'Play Voice Briefing'}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/30 transition-all cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>Pause Voice</span>
            </button>
          )}

          {/* Replay */}
          <button
            onClick={handleReplay}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
            title="Restart from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
            title="Stop playback"
          >
            <VolumeX className="w-4 h-4" />
          </button>

          {/* Speed Toggle */}
          <div className="flex items-center bg-white/10 rounded-xl p-1 text-xs">
            {[0.8, 1.0, 1.25].map(rate => (
              <button
                key={rate}
                onClick={() => handleRateChange(rate)}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  speechRate === rate ? 'bg-blue-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* View Transcript Toggle */}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
              showTranscript ? 'bg-blue-500 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white'
            }`}
            title="Read spoken script text"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transcript Drawer */}
      {showTranscript && (
        <div className="mt-4 pt-4 border-t border-slate-700/60 bg-slate-950/40 rounded-xl p-4 text-xs text-slate-200 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-blue-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              Voice Script Transcript
            </span>
            {voices.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">Voice:</span>
                <select
                  value={selectedVoiceName}
                  onChange={e => handleVoiceChange(e.target.value)}
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-0.5 text-[11px] focus:outline-none"
                >
                  {voices.map(v => (
                    <option key={v.name} value={v.name}>
                      {v.name.slice(0, 24)} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p className="leading-relaxed whitespace-pre-line text-slate-300">{speechScript}</p>
        </div>
      )}
    </div>
  );
};
