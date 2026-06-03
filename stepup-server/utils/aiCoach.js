const OpenAI = require('openai');

const openaiApiKey = process.env.OPENAI_API_KEY;
const hasApiKey = openaiApiKey && openaiApiKey !== 'your_key_here';

let openai = null;
if (hasApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

/**
 * Fallback mock response when OpenAI is not configured
 */
function getMockCoachResponse(messages, levelContext) {
  const lastUserMsg = messages.filter(m => m.role === 'user').pop();
  const userText = lastUserMsg?.content?.toLowerCase() || '';

  let reply = '';
  let suggestedActions = ['Show me an example', 'Give me a practice problem', 'Explain simpler', 'What should I learn next'];

  if (userText.includes('stuck') || userText.includes('don\'t understand') || userText.includes('help')) {
    reply = `No worries! 😊 Let me break down **${levelContext?.title || 'this topic'}** into smaller pieces for you.\n\n` +
      `Start with the core concept: think of it like building blocks. Each piece depends on the one before it.\n\n` +
      `Try this approach:\n1. Re-read the description slowly\n2. Write down what you *do* understand\n3. Ask me about the specific part you're unsure about\n\nWhat part is tripping you up? 🤔`;
    suggestedActions = ['Give me a concrete example', 'Break it down step by step', 'What are the key concepts?', 'Give me a hint'];
  } else if (userText.includes('example')) {
    reply = `Great idea! Examples make everything click! 💡\n\nFor **${levelContext?.title || 'this topic'}**, here's a real-world analogy:\n\n` +
      `Think of it like organizing a library 📚 — you need a system, a structure, and a way to find things quickly. The same principles apply here.\n\n` +
      `Want me to walk through a step-by-step example from scratch?`;
    suggestedActions = ['Yes, step by step please', 'Show me code', 'Give me another example', 'Practice problem now'];
  } else if (userText.includes('practice') || userText.includes('problem')) {
    reply = `Let's test your knowledge! 🎯\n\n**Mini Challenge for ${levelContext?.title || 'this level'}:**\n\n` +
      `Try to explain back to me (in your own words) what the main concept is and when you would use it in a real project.\n\n` +
      `Don't worry about being perfect — the goal is to identify any gaps. Give it a shot! 💪`;
    suggestedActions = ['Check my answer', 'Give me a harder problem', 'I need a hint', 'Skip to next topic'];
  } else if (userText.includes('next') || userText.includes('after')) {
    reply = `Once you master **${levelContext?.title || 'this level'}**, here's what comes next! 🗺️\n\n` +
      `Your roadmap is designed to build on each concept progressively. The next level will introduce a new challenge that directly uses what you're learning now.\n\n` +
      `Focus on completing this level first — each proof type you complete makes you stronger. You've got this! 🚀`;
    suggestedActions = ['Tell me what the next level covers', 'I\'m ready to take the quiz', 'Review this level again', 'Help me finish faster'];
  } else {
    reply = `Great question! 🌟 For **${levelContext?.title || 'this topic'}**, the key insight is:\n\n` +
      `Understanding the *why* before the *how* makes everything easier. Think about what problem this concept solves in the real world.\n\n` +
      `Topics covered here: ${(levelContext?.topics || ['Core concepts', 'Practical application']).join(', ')}.\n\n` +
      `What specifically would you like to explore? I'm here to help! 😊`;
  }

  return { reply, suggestedActions };
}

/**
 * chatWithCoach — Main ARIA coach function
 * @param {Array} messages - Full conversation history [{role, content}]
 * @param {Object} levelContext - { title, description, roadmapTitle, topics, proofType }
 * @param {Object} userContext - { name, xpTotal, streakCount }
 * @returns {{ reply: string, suggestedActions: string[] }}
 */
async function chatWithCoach(messages, levelContext, userContext) {
  const systemPrompt = `You are ARIA, the AI coach inside STEPUP app.
You are friendly, encouraging, and highly knowledgeable.
You help users understand topics they are learning.

Current user context:
- Name: ${userContext?.name || 'Learner'}
- Current Level: ${levelContext?.title || 'Unknown Level'}
- Topic: ${levelContext?.description || 'General study'}
- Roadmap: ${levelContext?.roadmapTitle || 'Your Roadmap'}
- Subtopics to cover: ${(levelContext?.topics || []).join(', ') || 'See level description'}
- Proof type required: ${levelContext?.proofType || 'quiz'}
- XP Streak: ${userContext?.streakCount || 0} days

Your rules:
1. Always be encouraging, never discouraging
2. Give concrete examples when explaining concepts
3. If user is stuck, break topic into smaller pieces
4. Suggest practice problems when relevant
5. Keep responses concise but complete (under 250 words)
6. Use emojis occasionally to feel friendly and engaging
7. If user asks unrelated questions, gently redirect to their current level
8. Remember context from earlier in this conversation
9. When appropriate, suggest the next action the user should take
10. Format responses with markdown for clarity (bold, lists, etc.)

After your response, also think about 4 suggested follow-up actions the user might want.
Return your response as JSON: { "reply": "...", "suggestedActions": ["...", "...", "...", "..."] }`;

  if (!hasApiKey || !openai) {
    return getMockCoachResponse(messages, levelContext);
  }

  try {
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: apiMessages,
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0].message.content.trim());

    return {
      reply: parsed.reply || 'I had trouble forming a response. Please try again! 😊',
      suggestedActions: Array.isArray(parsed.suggestedActions)
        ? parsed.suggestedActions.slice(0, 4)
        : ['Show me an example', 'Give me a practice problem', 'Explain simpler', 'What should I learn next']
    };
  } catch (err) {
    console.error('[aiCoach] GPT-4o chat failed:', err.message);
    return getMockCoachResponse(messages, levelContext);
  }
}

module.exports = { chatWithCoach };
