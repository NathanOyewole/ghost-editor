"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Cpu, Zap, Activity, Clock, RotateCcw } from 'lucide-react';
// Make sure this path matches your generated WASM package
import init, { GhostEngine } from '../../pkg/editor_engine';

export default function GhostEditor() {
  const [text, setText] = useState("");
  const [stats, setStats] = useState({ words: 0, chars: 0, lines: 0, readingTime: 0 });
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [wasmReady, setWasmReady] = useState(false);

  // Persistent reference to our Rust logic
  const engineRef = useRef<GhostEngine | null>(null);

  // Initialize Rust Engine and Event Listeners
  useEffect(() => {
    init().then(() => {
      engineRef.current = new GhostEngine();
      setWasmReady(true);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Emoji Injection (Triggered by Space)
      // Note: We check current state via closure or use a fresh ref if needed, 
      // but standard event listener with direct state access works for basic toggles.
      if (e.key === ' ' && suggestion) {
        const lastWord = text.split(/\s/).pop() || "";
        if (lastWord.startsWith(":")) {
          e.preventDefault();
          const words = text.split(" ");
          words[words.length - 1] = suggestion;
          const newText = words.join(" ") + " ";
          setText(newText);
          updateStats(newText);
          setSuggestion(null);
          return;
        }
      }

      // 2. ⌘K Menu
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsMenuOpen(prev => !prev);
      }

      // 3. ⌘Z Undo (Custom Rust History)
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && engineRef.current) {
        e.preventDefault();
        const previousText = engineRef.current.undo();
        setText(previousText);
        // Stats update is called inside updateStats
        const res = engineRef.current.analyze();
        setStats({ 
          words: res.words, 
          chars: res.chars, 
          lines: res.lines,
          readingTime: res.reading_time 
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text, suggestion]); // Re-bind when text/suggestion changes to keep closure fresh

  const updateStats = (val: string) => {
    if (engineRef.current) {
      engineRef.current.update_content(val);
      const res = engineRef.current.analyze();
      setStats({ 
        words: res.words, 
        chars: res.chars, 
        lines: res.lines,
        readingTime: res.reading_time 
      });
    }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    updateStats(val);

    // Emoji Autocomplete Logic
    const lastWord = val.split(/\s/).pop() || "";
    if (lastWord.startsWith(":") && lastWord.length > 1) {
      const query = lastWord.slice(1);
      const emoji = engineRef.current?.suggest_emoji(query);
      setSuggestion(emoji || null);
    } else {
      setSuggestion(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-300 selection:bg-purple-500/30">
      {/* Top Nav */}
      <nav className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2 font-medium text-white">
          <div className="w-6 h-6 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-md shadow-lg shadow-purple-500/20" />
          Ghost Editor <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">BETA</span>
        </div>
        <div className="flex gap-4 items-center text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <Cpu size={14} className={wasmReady ? "text-green-400" : "text-zinc-600"} /> 
            {wasmReady ? "WASM_ENGINE_LIVE" : "WASM_LOADING"}
          </span>
          <span className="text-zinc-700">|</span>
          <span className="flex items-center gap-1.5"><Command size={14} /> ⌘K for Menu</span>
        </div>
      </nav>

      {/* Editor Area */}
      <div className="max-w-4xl mx-auto mt-12 px-6 relative">
        {/* Emoji Suggestion Popover */}
        <AnimatePresence>
          {suggestion && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute -top-12 left-6 bg-zinc-900 border border-purple-500/30 px-4 py-2 rounded-xl shadow-xl shadow-purple-500/10 flex items-center gap-3 z-20"
            >
              <span className="text-xs font-medium text-zinc-400">Suggest:</span>
              <span className="text-2xl">{suggestion}</span>
              <kbd className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 border border-white/5">SPACE</kbd>
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          autoFocus
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Start writing something legendary..."
          className="w-full h-[60vh] bg-transparent text-xl leading-relaxed outline-none resize-none placeholder:text-zinc-800 text-white font-light"
        />
      </div>

      {/* Floating Stats */}
      <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-start min-w-[60px]">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Words</span>
          <motion.span 
            key={stats.words}
            initial={{ y: 2, opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-white font-mono text-lg"
          >
            {stats.words}
          </motion.span>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex flex-col items-start min-w-[80px]">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">History</span>
          <button 
            onClick={() => {
              const prev = engineRef.current?.undo();
              if (prev !== undefined) setText(prev);
            }}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors mt-1"
          >
            <RotateCcw size={14} /> <span className="text-xs font-mono">Undo</span>
          </button>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex flex-col items-start min-w-[80px]">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Read Time</span>
          <span className="text-white font-mono flex items-center gap-1.5 text-lg">
            <Clock size={14} className="text-blue-400" />
            {stats.readingTime.toFixed(1)}m
          </span>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex flex-col items-start">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Engine</span>
          <span className="text-orange-400 text-xs font-mono flex items-center gap-1.5 mt-1 bg-orange-400/10 px-2 py-0.5 rounded-full">
            <Zap size={12} fill="currentColor" /> RUST_WASM
          </span>
        </div>
      </footer>

      {/* Cmd+K Command Palette */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="w-[500px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <Activity size={18} className="text-purple-500" />
                <input className="bg-transparent outline-none w-full text-white" placeholder="What do you need, bro?" />
              </div>
              <div className="p-2 text-sm">
                <div className="p-3 hover:bg-white/5 rounded-xl cursor-pointer flex justify-between">
                  <span>Format with Prettier</span>
                  <span className="text-zinc-600">⌥⇧F</span>
                </div>
                <div className="p-3 hover:bg-white/5 rounded-xl cursor-pointer flex justify-between"
                  onClick={() => {
                    if(engineRef.current) {
                      const res = engineRef.current.analyze();
                      alert(`Words: ${res.words}, Chars: ${res.chars}`);
                    }
                  }}
                >
                  <span>Analyze Complexity (Rust)</span>
                  <span className="text-zinc-600">⌘R</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
