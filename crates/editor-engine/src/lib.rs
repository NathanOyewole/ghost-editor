use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Analysis {
    pub words: usize,
    pub chars: usize,
    pub lines: usize,
    pub reading_time: f64,
}

#[wasm_bindgen]
pub fn analyze_text(input: &str) -> Analysis {
    let words = input.split_whitespace().count();
    // Added the dot here: input.chars()
    let chars = input.chars().count();
    let lines = input.lines().count();

    let reading_time = words as f64 / 200.0; // Assuming average reading speed of 200 words per minute

    Analysis { words, chars, lines, reading_time }
}
