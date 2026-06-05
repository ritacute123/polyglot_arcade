import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3000;

loadEnvFile(path.join(__dirname, ".env"));

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "POST" && url.pathname === "/api/evaluate") {
      const body = await readJsonBody(req);
      const evaluation = await evaluateAnswer(body);
      return sendJson(res, 200, evaluation);
    }

    if (req.method === "POST" && url.pathname === "/api/conversation-prompt") {
      const body = await readJsonBody(req);
      const prompt = await createConversationPrompt(body);
      return sendJson(res, 200, prompt);
    }

    if (req.method === "POST" && url.pathname === "/api/speech") {
      const body = await readJsonBody(req);
      const audio = await createSpeech(body);
      res.writeHead(200, {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store"
      });
      return res.end(audio);
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    const pathname = url.pathname === "/" ? "/quiz.html" : url.pathname;
    const filePath = safeJoin(__dirname, decodeURIComponent(pathname));

    if (!filePath) {
      return sendText(res, 403, "Forbidden");
    }

    fs.readFile(filePath, (error, data) => {
      if (error) return sendText(res, 404, "Not found");
      const type = contentTypes[path.extname(filePath)] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type });
      res.end(req.method === "HEAD" ? undefined : data);
    });
  } catch (error) {
    console.error(error);
    sendJson(res, error.statusCode || 500, {
      error: error.statusCode ? error.message : "Server error. Check the terminal logs."
    });
  }
});

server.listen(port, () => {
  console.log(`Polyglot Arcade running at http://localhost:${port}`);
});

async function createConversationPrompt(body) {
  const { language, topic, style, round, previousTranscript, previousFeedback, linguisticObjective, powerUp } = body || {};

  if (!language || !topic || !style || !round) {
    const error = new Error("Missing language, topic, style, or round.");
    error.statusCode = 400;
    throw error;
  }

  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is not configured on the server.");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.65,
      messages: [
        {
          role: "system",
          content: [
            "You are a lively voice-first language coach.",
            "Create one short spoken conversation turn for a learner.",
            "The coach should ask the user one natural question in the target language.",
            "Also include a brief English mission cue so beginners understand what to do.",
            "Return strict JSON with keys: coachLine, transcriptPrompt, linguisticFocus.",
            "coachLine is what text-to-speech will read aloud. Keep it under 55 words.",
            "transcriptPrompt is a short visible label for the transcript area.",
            "linguisticFocus names the speaking skill being practiced."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            targetLanguage: language,
            theme: topic,
            conversationStyle: style,
            round,
            previousTranscript,
            previousFeedback,
            linguisticObjective,
            powerUp
          })
        }
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("OpenAI prompt error:", data);
    const error = new Error("OpenAI conversation prompt failed. Check your API key and server logs.");
    error.statusCode = 500;
    throw error;
  }

  const raw = data.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);
  return {
    coachLine: String(parsed.coachLine || fallbackCoachLine(language, topic, round)),
    transcriptPrompt: String(parsed.transcriptPrompt || "Your spoken reply will appear here."),
    linguisticFocus: String(parsed.linguisticFocus || "Spoken interaction")
  };
}

async function evaluateAnswer(body) {
  const { language, topic, style, prompt, answer, round, totalRounds, selectedChoice, linguisticObjective, powerUp } = body || {};

  if (!language || !topic || !style || !prompt || typeof answer !== "string") {
    const error = new Error("Missing language, topic, style, prompt, or answer.");
    error.statusCode = 400;
    throw error;
  }

  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is not configured on the server.");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: [
            "You are an expert language proficiency evaluator and playful learning coach.",
            "Evaluate only the learner answer for the requested target language.",
            "The learner answer is a browser speech-recognition transcript of what the user said aloud.",
            "Be fair about obvious transcription artifacts, but still evaluate communicative speaking proficiency.",
            "Use applied linguistics criteria: register, morphology, syntax, lexical range, pragmatics, and fluency.",
            "If the answer is in the wrong language, lower the score and explain the issue kindly.",
            "Return strict JSON with these keys: cefrLevel, score, grammarFeedback, vocabularyFeedback, fluencyFeedback, correctedVersion, xpPoints, badgeSuggestion, nextChallenge.",
            "cefrLevel must be one of Pre-A1, A1, A2, B1, B2, C1, C2.",
            "score must be an integer from 0 to 100. xpPoints must be an integer from 0 to 250.",
            "Feedback should be concise, specific, encouraging, and useful for the next attempt."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            targetLanguage: language,
            topic,
            gamificationStyle: style,
            round,
            totalRounds,
            prompt,
            selectedChoice,
            linguisticObjective,
            powerUp,
            learnerAnswer: answer
          })
        }
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("OpenAI API error:", data);
    const error = new Error("OpenAI evaluation failed. Check your API key and server logs.");
    error.statusCode = 500;
    throw error;
  }

  const raw = data.choices?.[0]?.message?.content || "{}";
  return normalizeEvaluation(JSON.parse(raw));
}

async function createSpeech(body) {
  const { text, voice = "coral", instructions } = body || {};

  if (!text || typeof text !== "string") {
    const error = new Error("Missing text for speech.");
    error.statusCode = 400;
    throw error;
  }

  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is not configured on the server.");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice,
      input: text.slice(0, 4000),
      response_format: "mp3",
      instructions: instructions || "Speak like a warm, energetic language coach. Natural pacing, expressive intonation, clear pronunciation, and no robotic tone."
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("OpenAI speech error:", errorBody);
    const error = new Error("OpenAI speech generation failed. Check your API key and server logs.");
    error.statusCode = 500;
    throw error;
  }

  return Buffer.from(await response.arrayBuffer());
}

function normalizeEvaluation(data) {
  const score = clampInteger(data.score, 0, 100, 0);
  const xpPoints = clampInteger(data.xpPoints, 0, 250, Math.round(score * 1.6));

  return {
    cefrLevel: String(data.cefrLevel || "Pre-A1"),
    score,
    grammarFeedback: String(data.grammarFeedback || "Add a complete sentence with clearer structure."),
    vocabularyFeedback: String(data.vocabularyFeedback || "Use more topic-specific words."),
    fluencyFeedback: String(data.fluencyFeedback || "Connect ideas smoothly and naturally."),
    correctedVersion: String(data.correctedVersion || ""),
    xpPoints,
    badgeSuggestion: String(data.badgeSuggestion || "Practice Sprinter"),
    nextChallenge: String(data.nextChallenge || "Try the same task again with two connected sentences.")
  };
}

function fallbackCoachLine(language, topic, round) {
  return `Round ${round}. Let's have a short conversation in ${language} about ${topic}. Please answer out loud with one or two natural sentences.`;
}

function clampInteger(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const envText = fs.readFileSync(filePath, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    process.env[key] = process.env[key] || value;
  }
}

function safeJoin(root, requestPath) {
  const filePath = path.normalize(path.join(root, requestPath));
  return filePath.startsWith(root) ? filePath : null;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(data.error?.startsWith("Missing") ? 400 : statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(data));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

// Local run instructions:
// 1. Open a terminal in this outputs folder.
// 2. Run: node server.js
// 3. Open: http://localhost:3000
// Keep OPENAI_API_KEY in .env only. Never paste it into browser JavaScript or HTML.
