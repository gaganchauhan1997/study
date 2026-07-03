/**
 * AI Service - handles API calls to Gemini and Groq using user's own API keys (BYOK)
 */

export async function callGemini(apiKey: string, messages: { role: string; content: string }[], systemPrompt?: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const formattedContents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents: formattedContents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  };

  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} - ${err}`);
  }

  const data = await res.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from Gemini");
  return text;
}

export async function callGroq(apiKey: string, messages: { role: string; content: string }[], systemPrompt?: string) {
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const formattedMessages = [];
  if (systemPrompt) {
    formattedMessages.push({ role: "system", content: systemPrompt });
  }
  for (const m of messages) {
    formattedMessages.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${res.status} - ${err}`);
  }

  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No response from Groq");
  return text;
}

export async function validateGeminiKey(apiKey: string) {
  try {
    await callGemini(apiKey, [{ role: "user", content: "Say 'valid' and nothing else." }]);
    return true;
  } catch {
    return false;
  }
}

export async function validateGroqKey(apiKey: string) {
  try {
    await callGroq(apiKey, [{ role: "user", content: "Say 'valid' and nothing else." }]);
    return true;
  } catch {
    return false;
  }
}

const TUTOR_SYSTEM_PROMPT = `You are an expert tutor who teaches concepts step-by-step. Your approach:
1. Break complex topics into simple, digestible steps
2. Use analogies and real-world examples
3. Ask follow-up questions to check understanding
4. Never just give answers - guide students to discover them
5. Use Socratic questioning to deepen understanding
6. Adapt explanations based on student responses
7. Be encouraging and supportive
8. When solving problems, explain your reasoning at each step`;

export async function tutorChat(
  apiKey: string,
  provider: "gemini" | "groq",
  messages: { role: string; content: string }[]
) {
  if (provider === "gemini") {
    return callGemini(apiKey, messages, TUTOR_SYSTEM_PROMPT);
  }
  return callGroq(apiKey, messages, TUTOR_SYSTEM_PROMPT);
}

export async function generateFlashcards(
  apiKey: string,
  provider: "gemini" | "groq",
  topic: string,
  count: number = 10
) {
  const prompt = `Generate ${count} flashcards for the topic: "${topic}".
Return ONLY a JSON array in this exact format (no markdown, no explanation):
[
  {"front": "question or term", "back": "answer or definition"},
  ...
]`;

  let response: string;
  if (provider === "gemini") {
    response = await callGemini(apiKey, [{ role: "user", content: prompt }]);
  } else {
    response = await callGroq(apiKey, [{ role: "user", content: prompt }]);
  }

  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Failed to parse flashcard JSON");
  }
}

export async function generateQuiz(
  apiKey: string,
  provider: "gemini" | "groq",
  topic: string,
  questionCount: number = 5
) {
  const prompt = `Generate a quiz with ${questionCount} multiple-choice questions about: "${topic}".
Return ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "title": "Quiz title",
  "questions": [
    {
      "question": "Question text",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    },
    ...
  ]
}`;

  let response: string;
  if (provider === "gemini") {
    response = await callGemini(apiKey, [{ role: "user", content: prompt }]);
  } else {
    response = await callGroq(apiKey, [{ role: "user", content: prompt }]);
  }

  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Failed to parse quiz JSON");
  }
}
