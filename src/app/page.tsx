"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Cpu, Zap, Activity, Clock, RotateCcw, Search, FileJson, FileText } from 'lucide-react';
import init, { GhostEngine } from '../../pkg/editor_engine';

export default function GhostEditor() {
  const [text, setText] = useState("");
  const [stats, setStats] = useState({ words: 0, chars: 0, lines: 0, readingTime: 0 });
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [wasmReady, setWasmReady] = useState(false);
  const [vimMode, setVimMode] = useState("INSERT");

  const engineRef = useRef<GhostEngine | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateStats = (newText: string) => {
    const wordCount = newText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const lineCount = newText.split("\n").length;
    const readingTime = Math.ceil(wordCount / 200);
    setStats({ words: wordCount, chars: newText.length, lines: lineCount, readingTime });
  };

  const handleTextChange = (value: string) => {
    setText(value);
    updateStats(value);
  };

  const handleVimAction = (action: string | undefined) => {
    const el = textareaRef.current;
    if (!el || !action) return;

    const start = el.selectionStart;
    
    const lastNewlineBefore = text.lastIndexOf("\n", start - 1);
    const lineStart = lastNewlineBefore === -1 ? 0 : lastNewlineBefore + 1;
    const currentColumn = start - lineStart;

    if (action === "MOVE_LEFT") el.setSelectionRange(start - 1, start - 1);
    if (action === "MOVE_RIGHT") el.setSelectionRange(start + 1, start + 1);

    if (action === "MOVE_DOWN") {
      const nextNewline = text.indexOf("\n", start);
      if (nextNewline !== -1) {
        const nextLineEnd = text.indexOf("\n", nextNewline + 1);
        const nextLineLength = (nextLineEnd === -1 ? text.length : nextLineEnd) - (nextNewline + 1);
        const targetPos = nextNewline + 1 + Math.min(currentColumn, nextLineLength);
        el.setSelectionRange(targetPos, targetPos);
      }
    }

    if (action === "MOVE_UP") {
      if (lineStart > 0) {
        const prevLineStart = text.lastIndexOf("\n", lineStart - 2) + 1;
        const prevLineLength = (lineStart - 1) - prevLineStart;
        const targetPos = prevLineStart + Math.min(currentColumn, prevLineLength);
        el.setSelectionRange(targetPos, targetPos);
      }
    }

    if (action === "DELETE_CHAR") {
      const newText = text.slice(0, start) + text.slice(start + 1);
      setText(newText);
      updateStats(newText);
      setTimeout(() => el.setSelectionRange(start, start), 0);
    }
  };

  useEffect(() => {
    init().then(() => {
      engineRef.current = new GhostEngine();
      setWasmReady(true);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;

      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsMenuOpen(prev => !prev);
        return;
      }

      if (isMenuOpen) {
        if (e.key === 'Escape') setIsMenuOpen(false);
        return;
      }

      const action = engineRef.current.handle_key(e.key, e.ctrlKey || e.metaKey);
      if (action === "MODE_NORMAL") {
        setVimMode("NORMAL");
        return;
      }
      if (action === "MODE_INSERT") {
        setVimMode("INSERT");
        return;
      }

      if (vimMode === "NORMAL") {
        if (["h", "j", "k", "l", "x", "i"].includes(e.key)) {
          e.preventDefault();
          handleVimAction(action);
          return;
        }
      }

      if (e.key === ' ' && suggestion && vimMode === "INSERT") {
        const words = text.split(/\s/);
        const lastWord = words[words.length - 1];
        if (lastWord.startsWith(":")) {
          e.preventDefault();
          words[words.length - 1] = suggestion;
          const newText = words.join(" ") + " ";
          setText(newText);
          updateStats(newText);
          setSuggestion(null);
          return;
        }
      }

      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const prev = engineRef.current.undo();
        setText(prev);
        updateStats(prev);
      }
    };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [text, suggestion, vimMode, isMenuOpen, handleVimAction]);

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-300 selection:bg-purple-500/30 font-sans overflow-hidden">
      <nav className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-medium text-white">
          <div className="w-6 h-6 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-md shadow-lg shadow-purple-500/20" />
          Ghost Editor <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 uppercase tracking-tighter ml-1">{vimMode}</span>
        </div>
        <div className="flex gap-4 items-center text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <Cpu size={14} className={wasmReady ? "text-green-400" : "text-zinc-600"} /> 
            {wasmReady ? "WASM_LIVE" : "WASM_BOOTING"}
          </span>
          <span className="text-zinc-700">|</span>
          <span className="flex items-center gap-1.5 cursor-pointer hover:text-white" onClick={() => setIsMenuOpen(true)}>
            <Command size={14} /> ⌘K Menu
          </span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto mt-12 px-6 relative">
        <AnimatePresence>
          {suggestion && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-12 left-6 bg-zinc-900 border border-purple-500/40 px-4 py-2 rounded-xl flex items-center gap-3 z-20 shadow-xl shadow-purple-500/10 text-white">
              <span className="text-2xl">{suggestion}</span>
              <kbd className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 border border-white/5 uppercase">Space to insert</kbd>
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          ref={textareaRef}
          autoFocus
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Esc for Normal mode, 'i' to type..."
          className={`w-full h-[65vh] bg-transparent text-xl leading-relaxed outline-none resize-none text-white font-light transition-all duration-300 ${
            vimMode === 'NORMAL' ? 'caret-transparent cursor-default' : 'caret-purple-500'
          }`}
        />
      </div>

      <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-40 overflow-x-auto whitespace-nowrap">
        <div className="flex flex-col items-start min-w-[70px]">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Vim Mode</span>
          <span className={`text-[10px] font-mono mt-1 px-2 py-0.5 rounded-md border ${
            vimMode === 'NORMAL' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
          }`}>
            {vimMode}
          </span>
        </div>
        
        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex flex-col items-start min-w-[60px]">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Words</span>
          <span className="text-white font-mono text-lg">{stats.words}</span>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex flex-col items-start">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Read Time</span>
          <span className="text-white font-mono flex items-center gap-2 text-lg">
            <Clock size={14} className="text-blue-400" />
            {stats.readingTime.toFixed(1)}m
          </span>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <button onClick={() => { const p = engineRef.current?.undo(); if(p !== undefined) setText(p); }} className="flex flex-col items-center text-zinc-500 hover:text-white transition-all group">
          <span className="text-[10px] uppercase tracking-widest font-bold group-hover:text-purple-400">Undo</span>
          <RotateCcw size={18} className="mt-1" />
        </button>

        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex flex-col items-start">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Engine</span>
          <span className="text-orange-400 text-[10px] font-mono flex items-center gap-1.5 mt-1 bg-orange-400/10 px-2 py-0.5 rounded-full border border-orange-400/20">
            <Zap size={10} fill="currentColor" /> RUST_WASM
          </span>
        </div>
      </footer>

      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/80 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-[550px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/5">
                <Search size={18} className="text-purple-500" />
                <input autoFocus className="bg-transparent outline-none w-full text-white placeholder:text-zinc-600" placeholder="Run a command..." />
              </div>
              <div className="p-2 max-h-[400px] overflow-y-auto">
                <div className="group p-3 hover:bg-purple-500/10 rounded-xl cursor-pointer flex justify-between items-center transition-colors">
                  <div className="flex items-center gap-3">
                    <FileJson size={16} className="text-zinc-500 group-hover:text-purple-400" />
                    <span>Format with Prettier</span>
                  </div>
                  <kbd className="text-xs text-zinc-600 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">⌥⇧F</kbd>
                </div>
                <div className="group p-3 hover:bg-purple-500/10 rounded-xl cursor-pointer flex justify-between items-center transition-colors" onClick={() => { if(engineRef.current) { const res = engineRef.current.analyze(); alert(`Ghost Analysis:\nWords: ${res.words}\nLines: ${res.lines}`); }}}>
                  <div className="flex items-center gap-3">
                    <Activity size={16} className="text-zinc-500 group-hover:text-purple-400" />
                    <span>Analyze Complexity (Rust)</span>
                  </div>
                  <kbd className="text-xs text-zinc-600 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">⌘R</kbd>
                </div>
                <div className="group p-3 hover:bg-purple-500/10 rounded-xl cursor-pointer flex justify-between items-center transition-colors" onClick={() => { setVimMode("NORMAL"); setIsMenuOpen(false); }}>
                  <div className="flex items-center gap-3">
                    <Zap size={16} className="text-zinc-500 group-hover:text-purple-400" />
                    <span>Switch to Normal Mode</span>
                  </div>
                  <kbd className="text-xs text-zinc-600 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">Esc</kbd>
                </div>
                <div className="group p-3 hover:bg-purple-500/10 rounded-xl cursor-pointer flex justify-between items-center transition-colors opacity-50">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-zinc-500 group-hover:text-purple-400" />
                    <span>Export as Markdown</span>
                  </div>
                  <span className="text-[10px] text-purple-400 font-bold bg-purple-400/10 px-1.5 rounded">SOON</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
