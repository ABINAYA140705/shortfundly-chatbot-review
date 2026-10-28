import React, { useState, useRef, useEffect } from 'react';
import { Task, User } from '../types';
import { api } from '../services/api';
import { speechService } from '../services/speech';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Volume2,
  VolumeX,
  Loader2,
  HelpCircle,
  Code,
  CheckCircle,
} from 'lucide-react';

interface ChatAssistantProps {
  intern: User;
  task: Task;
  initialTopic?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  usedModel?: string;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  intern,
  task,
  initialTopic,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: `Hi ${intern.name}! I am your InternPilot AI Assistant for **"${task.title}"**. Feel free to ask me questions about your modules, implementation tips, testing strategy, or review preparation!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      usedModel: 'gemini-3.8-flash',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialTopic) {
      handleSend(initialTopic);
    }
  }, [initialTopic]);

  const quickPrompts = [
    `How do I get started with ${task.modules[0]?.title || 'Module 1'}?`,
    'What files and format should I submit?',
    'How will my work be evaluated by the AI?',
    'What should I prepare for my upcoming review meeting?',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await api.askTaskChatbot({
        internId: intern.id,
        taskId: task.id,
        question: text,
        history,
      });

      const assistantMsg: Message = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        usedModel: response.usedModel,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Sorry ${intern.name}, I encountered an issue connecting to the AI assistant. Please check your connection or review the module specifications above.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakAnswer = (msg: Message) => {
    if (speakingMessageId === msg.id) {
      speechService.stop();
      setSpeakingMessageId(null);
      return;
    }

    setSpeakingMessageId(msg.id);
    speechService.speak(
      msg.content,
      () => setSpeakingMessageId(msg.id),
      () => setSpeakingMessageId(null),
      () => setSpeakingMessageId(null)
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[600px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Task AI Chat Assistant</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                Interactive
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Grounded in "{task.title.slice(0, 36)}..."
            </p>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          Ask questions &bull; Listen to answers
        </span>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/30">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-indigo-600 text-white shadow-xs'
              }`}
            >
              {msg.role === 'user' ? (
                <UserIcon className="w-3.5 h-3.5" />
              ) : (
                <Bot className="w-3.5 h-3.5" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed space-y-1.5 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-xs'
                  : 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-tl-xs'
              }`}
            >
              <div className="whitespace-pre-line">{msg.content}</div>

              {/* Message Footer: Timestamp, Model, Spoken Audio */}
              <div
                className={`flex items-center justify-between gap-3 text-[10px] pt-1 border-t ${
                  msg.role === 'user'
                    ? 'border-blue-500/40 text-blue-100'
                    : 'border-slate-100 text-slate-400'
                }`}
              >
                <span>{msg.timestamp}</span>

                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2">
                    {msg.usedModel && (
                      <span className="text-[10px] text-indigo-600 font-medium">
                        {msg.usedModel === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Demo AI'}
                      </span>
                    )}

                    <button
                      onClick={() => handleSpeakAnswer(msg)}
                      className="flex items-center gap-1 hover:text-blue-600 text-slate-500 transition-colors cursor-pointer"
                      title={speakingMessageId === msg.id ? 'Stop speaking' : 'Listen to answer'}
                    >
                      {speakingMessageId === msg.id ? (
                        <>
                          <VolumeX className="w-3 h-3 text-amber-600" />
                          <span className="text-amber-600">Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-2.5 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Analyzing task requirements and drafting guidance...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-semibold text-slate-400 shrink-0">Quick prompts:</span>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="text-[11px] text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-slate-200/80">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={`Ask a question about ${task.title}...`}
            className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
