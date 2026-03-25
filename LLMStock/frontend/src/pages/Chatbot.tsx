import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Send, 
  Mic, 
  Bot, 
  User, 
  Sparkles, 
  MicOff,
  ChevronRight,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/utils';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  intent?: string;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hello! I'm your AI stock assistant. How can I help you today?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const playAudio = (base64Audio: string) => {
    if (isMuted) return;
    const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
    audio.play();
  };

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await api.post('/chat/', { message });
      return response.data;
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        text: data.response, 
        isBot: true,
        intent: data.intent
      }]);
      if (data.audio) {
        playAudio(data.audio);
      }
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const finalInput = typeof textToSend === 'string' ? textToSend : input;
    if (!finalInput.trim() || mutation.isPending) return;

    const userMsg = { id: Date.now().toString(), text: finalInput, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    mutation.mutate(finalInput);
    setInput('');
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      // Auto-send after voice recognition
      handleSend(transcript);
    };

    recognition.start();
  };

  const quickActions = [
    "What's the price of RELIANCE.NS?",
    "Analyze my portfolio",
    "Show top US stocks",
    "How is AAPL performing?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">MORPHEUS · AI Assistant</h2>
            <div className="flex items-center text-emerald-500 text-xs font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Online & Ready
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-500 transition-all shadow-sm"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              "flex w-full",
              msg.isBot ? "justify-start" : "justify-end"
            )}
          >
            <div className={cn(
              "flex max-w-[80%] space-x-3",
              msg.isBot ? "flex-row" : "flex-row-reverse space-x-reverse"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.isBot ? "bg-primary-100 dark:bg-primary-900 text-primary-600" : "bg-accent-100 dark:bg-accent-900 text-accent-600"
              )}>
                {msg.isBot ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl shadow-sm",
                msg.isBot 
                  ? "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none" 
                  : "bg-primary-600 text-white rounded-tr-none"
              )}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                {msg.intent && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center text-[10px] uppercase tracking-widest font-bold opacity-60">
                    <Sparkles size={10} className="mr-1" />
                    {msg.intent}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {mutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none flex space-x-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap gap-2 mb-4">
          {quickActions.map((action) => (
            <button
              key={action}
              onClick={() => {
                setInput(action);
                handleSend(action);
              }}
              className="text-xs px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-400 hover:border-primary-500 hover:text-primary-500 transition-all flex items-center group shadow-sm"
            >
              {action}
              <ChevronRight size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center space-x-3">
          <button
            type="button"
            onClick={startListening}
            className={cn(
              "p-3 rounded-2xl transition-all shadow-lg",
              isListening ? "bg-red-500 text-white animate-pulse" : "bg-white dark:bg-slate-800 text-slate-400 hover:text-primary-500 shadow-slate-200/50 dark:shadow-none"
            )}
          >
            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about stocks..."
              className="w-full pl-4 pr-12 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none shadow-lg shadow-slate-200/50 dark:shadow-none dark:text-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || mutation.isPending}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/30"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
