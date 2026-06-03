/**
 * gymGenerator.js
 * Generates randomized study challenges for any level.
 */

const OpenAI = require('openai');

const openaiApiKey = process.env.OPENAI_API_KEY;
const hasApiKey = openaiApiKey && openaiApiKey !== 'your_key_here';

let openai = null;
if (hasApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

/**
 * Generates a mock challenge when OpenAI is not available
 */
function getMockChallenge(levelTitle, topics = [], challengeType) {
  const finalTopics = topics.length > 0 ? topics : ['Core Theory', 'Advanced Applications', 'Best Practices'];
  
  if (challengeType === 'flashcards') {
    return {
      type: 'flashcards',
      title: `Flashcards: ${levelTitle}`,
      items: finalTopics.map((topic, index) => ({
        id: `fc-${index}`,
        question: `What is the primary significance of ${topic} in this context?`,
        answer: `${topic} is essential for establishing core performance boundaries, reducing debugging cycle times, and ensuring system design scalability. Review this to master the concept!`
      }))
    };
  }

  if (challengeType === 'code') {
    return {
      type: 'code',
      title: `Code Debugger: ${levelTitle}`,
      instructions: `Complete the function below to correctly demonstrate logic for ${finalTopics[0] || 'the level topic'}. Fix any syntax or semantic issues.`,
      starterCode: `function executeChallenge(input) {\n  // TODO: Implement solution for ${finalTopics[0] || 'concept'}\n  let result = null;\n  \n  return result;\n}`,
      testCases: [
        { id: 't1', input: 'test_run', expected: 'test_run_success' }
      ]
    };
  }

  if (challengeType === 'fill') {
    const text = `In computer science, ________ represents the core concept of ${finalTopics[0]}. When implementing it, developers must pay close attention to ________ to avoid common performance bottlenecks.`;
    return {
      type: 'fill',
      title: `Fill in the Blanks: ${levelTitle}`,
      text: text,
      blanksCount: 2,
      answers: ['abstraction', 'latency']
    };
  }

  // Default matching pairs
  const left = finalTopics.slice(0, 4);
  const right = left.map(t => `${t} (Applied context & details)`);
  
  return {
    type: 'matching',
    title: `Matching pairs: ${levelTitle}`,
    leftItems: left.map((val, idx) => ({ id: `l-${idx}`, text: val })),
    rightItems: right.map((val, idx) => ({ id: `r-${idx}`, text: val })),
    pairs: left.reduce((acc, _, idx) => {
      acc[`l-${idx}`] = `r-${idx}`;
      return acc;
    }, {})
  };
}

/**
 * Generate a challenge using OpenAI or mock fallback
 * @param {Object} level - Level context { title, description, topics }
 * @param {String} type - 'flashcards' | 'code' | 'fill' | 'matching'
 */
async function generateGymChallenge(level, type) {
  const allowedTypes = ['flashcards', 'code', 'fill', 'matching'];
  const challengeType = allowedTypes.includes(type) 
    ? type 
    : allowedTypes[Math.floor(Math.random() * allowedTypes.length)];

  if (!hasApiKey || !openai) {
    return getMockChallenge(level.title, level.topics, challengeType);
  }

  try {
    const prompt = `You are a curriculum designer generating practice challenges for a gamified learning app called STEPUP.
Level title: ${level.title}
Level description: ${level.description}
Topics to test: ${(level.topics || []).join(', ')}

Please generate a challenge of type: ${challengeType}.

For 'flashcards', return JSON format:
{
  "type": "flashcards",
  "title": "...",
  "items": [
    { "id": "fc-1", "question": "...", "answer": "..." },
    ...
  ] // Generate 4-5 cards
}

For 'code', return JSON format:
{
  "type": "code",
  "title": "...",
  "instructions": "...",
  "starterCode": "...",
  "testCases": [
    { "id": "t1", "input": "...", "expected": "..." }
  ]
}

For 'fill', return JSON format (replace exact words in the text with '________' to represent blanks):
{
  "type": "fill",
  "title": "...",
  "text": "...", // The paragraph containing blanks represented by '________'
  "blanksCount": 2,
  "answers": ["...", "..."] // Array of correct words in order
}

For 'matching', return JSON format:
{
  "type": "matching",
  "title": "...",
  "leftItems": [ { "id": "l-1", "text": "..." } ], // 4 items
  "rightItems": [ { "id": "r-1", "text": "..." } ], // 4 corresponding matches (shuffle these in display later, but return matching ids in pairs)
  "pairs": { "l-1": "r-1", "l-2": "r-2", "l-3": "r-3", "l-4": "r-4" }
}

Ensure all text is formatted nicely and ready to parse.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const data = JSON.parse(response.choices[0].message.content.trim());
    return data;
  } catch (err) {
    console.error('[gymGenerator] OpenAI generation failed, falling back to mock:', err.message);
    return getMockChallenge(level.title, level.topics, challengeType);
  }
}

module.exports = { generateGymChallenge };
