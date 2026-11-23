import { Message, Attachment } from '../types/chat';

interface StreamOptions {
  prompt: string;
  history: Message[];
  attachments?: Attachment[];
  model: string;
  extendedThinking?: boolean;
  webSearch?: boolean;
  onChunk: (chunk: string) => void;
  onReasoning?: (reasoning: string) => void;
  signal?: AbortSignal;
}

export async function streamMockResponse(options: StreamOptions): Promise<{ content: string; reasoning?: string }> {
  const { prompt, attachments = [], extendedThinking, webSearch, onChunk, onReasoning, signal } = options;

  let reasoningText = '';
  if (extendedThinking) {
    reasoningText = `Thought Process:
1. Deconstruct request: "${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}"
2. Evaluate domain context (${attachments.length} attachment(s) present)
3. ${webSearch ? 'Tool: Synthesizing live web data and verified citations' : 'Deductive reasoning and comprehensive answer formulation'}
4. Format output with clean typography, code snippets, and structured explanations.`;

    if (onReasoning) {
      const rWords = reasoningText.split(' ');
      for (let i = 0; i < rWords.length; i++) {
        if (signal?.aborted) throw new Error('Generation stopped by user');
        onReasoning(rWords.slice(0, i + 1).join(' '));
        await new Promise((r) => setTimeout(r, 20));
      }
    }
  }

  const responseText = generateSmartResponse(prompt, attachments, webSearch);

  const tokens = responseText.split(/(?<=\s)|(?=\n)/);
  let accumulated = '';

  for (const token of tokens) {
    if (signal?.aborted) {
      throw new Error('Generation stopped by user');
    }
    accumulated += token;
    onChunk(accumulated);
    const delay = token.includes('\n') ? 35 : Math.floor(Math.random() * 15) + 10;
    await new Promise((r) => setTimeout(r, delay));
  }

  return {
    content: accumulated,
    reasoning: extendedThinking ? reasoningText : undefined,
  };
}

function generateSmartResponse(prompt: string, attachments: Attachment[], webSearch?: boolean): string {
  const lower = prompt.toLowerCase().trim();

  const hasImage = attachments.some((a) => a.type === 'image');
  const hasAudio = attachments.some((a) => a.type === 'audio');

  let mediaPrefix = '';
  if (hasImage && hasAudio) {
    mediaPrefix = `*I have analyzed both the attached image and audio note.* \n\n`;
  } else if (hasImage) {
    mediaPrefix = `*I have inspected the attached image closely.* \n\n`;
  } else if (hasAudio) {
    mediaPrefix = `*I have listened to your audio recording.* \n\n`;
  }

  if (webSearch) {
    mediaPrefix += `🔍 *Live search results integrated into response.* \n\n`;
  }

  // Python Loops & Coding
  if (lower.includes('loop') && lower.includes('python')) {
    return `${mediaPrefix}In Python, loops allow you to execute a block of code repeatedly. The two foundational loop constructs are the \`for\` loop (for iterating over sequences) and the \`while\` loop (for conditional repetition).

### 1. The \`for\` Loop

The \`for\` loop is ideal when you have an iterable collection (such as a list, string, dictionary, or \`range\` object):

\`\`\`python
# Iterating over a list
fruits = ["apple", "persimmon", "fig", "clementine"]
for fruit in fruits:
    print(f"Selecting: {fruit}")

# Using range() with start, stop, and step
for i in range(1, 10, 2):
    print(f"Odd number: {i}")

# Using enumerate() to get both index and element
for index, fruit in enumerate(fruits, start=1):
    print(f"{index}. {fruit.capitalize()}")
\`\`\`

### 2. The \`while\` Loop

A \`while\` loop runs as long as a specified condition remains \`True\`:

\`\`\`python
counter = 5
while counter > 0:
    print(f"Countdown: {counter}")
    counter -= 1
print("Launch!")
\`\`\`

### 3. Idiomatic Python: List Comprehensions

\`\`\`python
numbers = [1, 2, 3, 4, 5, 6]
squares = [n ** 2 for n in numbers if n % 2 != 0]
print(f"Odd squares: {squares}")  # [1, 9, 25]
\`\`\`

You can run this directly using the **Run** button above!`;
  }

  // Greetings & Identity
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('who are you') || lower.includes('your name')) {
    return `${mediaPrefix}Hello! I am **NOVA**, a production AI assistant designed with a calm, thoughtful, and deeply capable perspective.

I can help you across a wide range of tasks:
- **General Knowledge & Answers**: Explaining science, history, philosophy, writing, and daily tasks
- **Programming & Software Engineering**: Writing, running, and debugging code in Python, JavaScript, and HTML
- **Multimodal Understanding**: Inspecting uploaded images, documents (PDF, DOCX, XLSX), and voice notes
- **Web Search**: Finding live information with structured citations
- **Artifacts**: Creating documents, diagrams, and live interactive apps

What would you like to explore today?`;
  }

  // Grounding & Wellness
  if (lower.includes('grounding') || lower.includes('5-4-3-2-1') || lower.includes('stress') || lower.includes('anxiety') || lower.includes('calm')) {
    return `${mediaPrefix}Here is a guided walkthrough of the **5-4-3-2-1 sensory grounding technique**, an evidence-backed method to bring your nervous system back into the present moment:

### The 5-4-3-2-1 Grounding Method

Take a slow, gentle breath in through your nose, hold for a moment, and release softly through your mouth. Look around your immediate surroundings:

1. **5 Things You Can See**: Look for small details—the grain of wood on a desk, a patch of sunlight, or the texture of a fabric.
2. **4 Things You Can Touch**: Notice physical contact—your feet resting on the floor, the cool surface of a phone, or the warmth of your hands.
3. **3 Things You Can Hear**: Tune in to background layers—a distant hum of traffic, the whisper of air conditioning, or rustling leaves.
4. **2 Things You Can Smell**: A hint of fresh coffee, paper, or clean air.
5. **1 Thing You Can Taste**: A sip of cool water, mint, or the lingering taste of tea.

Take another slow, grounding breath. You are safe in this present moment. Let me know if you would like gentle conversation or guidance.`;
  }

  // Capital / Geography inquiries
  if (lower.includes('capital of') || lower.includes('france') || lower.includes('paris')) {
    return `${mediaPrefix}The capital of France is **Paris**.

It is renowned worldwide as a global center for art, fashion, gastronomy, and culture:
1. **Landmarks**: The Eiffel Tower, the Louvre Museum (home of the Mona Lisa), Notre-Dame Cathedral, and the Arc de Triomphe.
2. **History**: Situated along the Seine River, it has been a major European hub of philosophy, diplomacy, and science since the Middle Ages.
3. **Culture**: Celebrated for its café culture, literary heritage, and architectural elegance.`;
  }

  // Mathematics / Science / General Question handler
  return `${mediaPrefix}Regarding your inquiry:

"${prompt}"

Here is a structured explanation:

### Core Concepts & Direct Answer
When analyzing this topic, the primary factor to consider is the underlying principle and how it connects to practical applications. 

1. **Key Fundamentals**: Establishing clear definitions and the direct context of the question.
2. **Practical Examples**: In real-world scenarios, this is observed through systematic patterns and measurable outcomes.
3. **Key Takeaways**: Keeping things modular, verifying edge cases, and applying best practices ensures optimal results.

If you would like me to delve deeper into specific aspects, write code to demonstrate this, or explore practical examples, please let me know!`;
}
