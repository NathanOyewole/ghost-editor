# 👻 Ghost Editor Changelog

## [1.1.0] - The "Vim & WASM" Power Update (2026-01-07)
### 🚀 Added
- **Stateful GhostEngine**: Rust core now manages editor state, history, and modes.
- **Vim Mode (Beta)**: Toggle between `INSERT` and `NORMAL` modes using `Esc` and `i`.
- **HJKL Movement**: Full keyboard navigation support in Normal mode.
- **Emoji Trie**: High-performance prefix-search for `:<emoji>` suggestions.
- **Emoji Injection**: Press `Space` to instantly swap shorthand for emojis.
- **Auto-Logs**: Integrated Release Drafter for automated version tracking.

### 🛠️ Technical Improvements
- **CI/CD Pipeline**: GitHub Actions now automatically builds Rust/WASM on every push.
- **History Stack**: Custom undo/redo logic moved from JS to Rust memory for reliability.
- **Cursor Logic**: Advanced coordinate math for vertical movement (j/k) in textarea.

### 🎨 UI/UX
- **Engine Status**: Added real-time WASM boot status and engine badge.
- **Command Palette**: Re-integrated ⌘K menu with Framer Motion animations.
- **Visual Feedback**: Caret hiding and mode-specific styling for a true Vim feel.
