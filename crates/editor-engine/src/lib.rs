use wasm_bindgen::prelude::*;
use std::collections::HashMap;

// --- Data Structures ---

#[wasm_bindgen]
pub struct Analysis {
    pub words: usize,
    pub chars: usize,
    pub lines: usize,
    pub reading_time: f64,
}

#[derive(Default)]
struct TrieNode {
    children: HashMap<char, TrieNode>,
    emoji: Option<String>,
}

#[wasm_bindgen]
pub struct GhostEngine {
    content: String,
    history: Vec<String>,
    emoji_trie: TrieNode,
}

// Ensure the impl block is also marked for wasm_bindgen
#[wasm_bindgen]
impl GhostEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> GhostEngine {
        let mut engine = GhostEngine {
            content: String::new(),
            history: Vec::new(),
            emoji_trie: TrieNode::default(),
        };
        engine.seed_emojis();
        engine
    }

    pub fn update_content(&mut self, new_text: &str) {
        if new_text != self.content {
            if self.history.len() > 50 {
                self.history.remove(0);
            }
            // Fixed the typo: self instead of selg
            self.history.push(self.content.clone());
            self.content = new_text.to_string();
        }
    }

    pub fn undo(&mut self) -> String {
        if let Some(previous) = self.history.pop() {
            self.content = previous.clone();
            previous
        } else {
            self.content.clone()
        }
    }

    fn seed_emojis(&mut self) {
        let emojis = vec![
            ("ghost", "👻"),
            ("fire", "🔥"),
            ("heart", "❤️"),
            ("rocket", "🚀"),
            ("smile", "😊"),
            ("check", "✅"),
        ];

        for (key, val) in emojis {
            let mut node = &mut self.emoji_trie;
            for c in key.chars() {
                node = node.children.entry(c).or_insert_with(TrieNode::default);
            }
            node.emoji = Some(val.to_string());
        }
    }

    pub fn suggest_emoji(&self, prefix: &str) -> Option<String> {
        let mut node = &self.emoji_trie;
        for c in prefix.chars() {
            if let Some(next_node) = node.children.get(&c) {
                node = next_node;
            } else {
                return None;
            }
        }
        node.emoji.clone()
    }

    pub fn analyze(&self) -> Analysis {
        let words = self.content.split_whitespace().count();
        let chars = self.content.chars().count();
        let lines = self.content.lines().count();
        let reading_time = words as f64 / 200.0;

        Analysis { words, chars, lines, reading_time }
    }
}
