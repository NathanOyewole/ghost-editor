"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Cpu, Zap, Activity, Clock } from 'lucide-react';
import init, { analyze_text } from '../../pkg/editor_engine';

export default function GhostEditor() {
  const [text, setText] = useState("");
  // Updated state to include readingTime
  const [stats, setStats] = useState({ words: 0, chars: 0, lines: 0, readingTime: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [wasmReady, setWasmReady] = useState(false);

  // Initialize Rust Engine
  useEffect(() => {
    init().then(() => setWasmReady(true));
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsMenuOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTextChange = (val: string) => {
    setText(val);
    if (wasmReady) {
      const result = analyze_text(val);
      setStats({ 
        words: result.words, 
        chars: result.chars, 
        lines: result.lines,
        readingTime: result.reading_time // Maps to the new field in your Rust struct
      });
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
            {wasmReady ? "WASM_READY" : "WASM_LOADING"}
          </span>
          <span className="text-zinc-700">|</span>
          <span className="flex items-center gap-1.5"><Command size={14} /> ⌘K for Menu</span>
        </div>
      </nav>

      {/* Editor Area */}
      <div className="max-w-4xl mx-auto mt-12 px-6">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Start writing something legendary..."
          className="w-full h-[60vh] bg-transparent text-xl leading-relaxed outline-none resize-none placeholder:text-zinc-800 text-white font-light"
        />
      </div>

      {/* Floating Stats (Updated with Reading Time & Animations) */}
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
                <div className="p-3 hover:bg-white/5 rounded-xl cursor-pointer flex justify-between">
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
