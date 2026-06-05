const languages = [
  "Arabic", "Bengali", "Chinese", "Dutch", "English", "French", "German", "Greek",
  "Hindi", "Indonesian", "Italian", "Japanese", "Korean", "Persian", "Polish",
  "Portuguese", "Russian", "Spanish", "Swahili", "Tagalog", "Thai", "Turkish",
  "Urdu", "Vietnamese"
];

const topics = [
  "Travel survival", "Food and restaurants", "Work meetings", "Healthcare",
  "Friendship", "Current events", "Shopping", "Housing", "Technology",
  "School and study", "Transportation", "Culture and etiquette"
];

const styles = [
  { id: "quest", name: "Lyric Quest", rule: "Clear five tracks by using real-world phrases, connectors, and one vivid detail.", prompt: "Track mission in {language}: {task}" },
  { id: "boss", name: "Syntax Boss", rule: "Beat the boss by controlling tense, word order, agreement, and polite register.", prompt: "Boss round in {language}. Answer with precision and detail: {task}" },
  { id: "speed", name: "Fluency Sprint", rule: "Fast recall with smooth rhythm. Short, natural, and complete beats win bonus XP.", prompt: "Sprint in {language}. Give a concise natural response: {task}" },
  { id: "mystery", name: "Pragmatics Deck", rule: "Pick a communication strategy, then prove it with a culturally appropriate sentence.", prompt: "Draw a card, then respond in {language}: {task}" }
];

const cefrLevels = [
  ["Pre-A1", "Starter phrases and isolated words."],
  ["A1", "Simple familiar expressions and basic needs."],
  ["A2", "Short routine exchanges on known topics."],
  ["B1", "Connected speech about familiar situations."],
  ["B2", "Clear, detailed communication with control."],
  ["C1", "Flexible, precise, advanced expression."],
  ["C2", "Highly accurate, nuanced command."]
];

const taskBank = {
  "Travel survival": ["ask for directions to the nearest train station", "explain that your hotel reservation is missing", "ask when the last bus leaves", "describe a lost backpack", "request help buying a local transit card"],
  "Food and restaurants": ["order a meal and ask about ingredients", "politely say the food is not what you ordered", "reserve a table for four people", "ask for a recommendation without meat", "compliment the chef and ask for the bill"],
  "Work meetings": ["summarize a project delay", "ask a colleague to clarify the deadline", "disagree politely with a proposal", "introduce yourself to a new team", "explain next steps after a meeting"],
  "Healthcare": ["describe a headache and fever", "ask how often to take medicine", "make an appointment for tomorrow morning", "explain an allergy", "ask where the pharmacy is"],
  "Friendship": ["invite a friend to a weekend activity", "apologize for arriving late", "describe your favorite hobby", "ask about someone's family", "make plans to meet again"],
  "Current events": ["summarize a local news story", "give a cautious opinion about an election", "compare two policy choices", "ask someone what they think about the news", "explain why a story matters"],
  "Shopping": ["ask for a different size", "compare prices at two stores", "return an item politely", "ask whether a discount is available", "describe the color and style you want"],
  "Housing": ["ask about rent and utilities", "report a broken appliance", "describe the neighborhood you prefer", "schedule a time to see an apartment", "negotiate a move-in date"],
  "Technology": ["explain that your phone battery died", "ask for help connecting to Wi-Fi", "describe a software problem", "compare two apps", "ask someone to send a file again"],
  "School and study": ["ask a teacher for extra help", "explain why homework is late", "summarize a reading assignment", "invite a classmate to study", "ask about exam format"],
  "Transportation": ["ask a taxi driver for the fastest route", "buy a train ticket", "explain a flight delay", "ask where to change buses", "describe traffic near your home"],
  "Culture and etiquette": ["ask what gift is appropriate", "thank a host after dinner", "explain a holiday tradition", "ask how formal your clothing should be", "politely refuse an invitation"]
};

const choiceSeeds = [
  "Polite register: greeting, clear request, and thanks.",
  "Connector boost: add because, when, if, or then.",
  "Repair move: correct yourself naturally once.",
  "Specific noun phrase: include a precise object, time, or place."
];

const linguisticObjectives = [
  {
    name: "Register",
    target: "Match the social situation with polite or casual wording.",
    bonus: "Use a greeting, a softener, or a thank-you."
  },
  {
    name: "Morphology",
    target: "Show control of verb form, agreement, gender, case, or particles where the language uses them.",
    bonus: "Include one complete phrase with the right ending or marker."
  },
  {
    name: "Syntax",
    target: "Build a complete sentence with natural word order.",
    bonus: "Add one dependent clause or clear connector."
  },
  {
    name: "Lexical Range",
    target: "Use topic-specific vocabulary instead of generic words.",
    bonus: "Name a concrete object, place, role, symptom, or action."
  },
  {
    name: "Fluency",
    target: "Keep the answer smooth and easy to say aloud.",
    bonus: "Use two connected ideas without over-explaining."
  }
];

const powerUps = [
  "Combo Builder",
  "Native Phrase Hunt",
  "Pronunciation Flow",
  "Context Switch",
  "Politeness Shield"
];

const speechLanguageCodes = {
  Arabic: "ar-SA",
  Bengali: "bn-BD",
  Chinese: "zh-CN",
  Dutch: "nl-NL",
  English: "en-US",
  French: "fr-FR",
  German: "de-DE",
  Greek: "el-GR",
  Hindi: "hi-IN",
  Indonesian: "id-ID",
  Italian: "it-IT",
  Japanese: "ja-JP",
  Korean: "ko-KR",
  Persian: "fa-IR",
  Polish: "pl-PL",
  Portuguese: "pt-BR",
  Russian: "ru-RU",
  Spanish: "es-ES",
  Swahili: "sw-KE",
  Tagalog: "fil-PH",
  Thai: "th-TH",
  Turkish: "tr-TR",
  Urdu: "ur-PK",
  Vietnamese: "vi-VN"
};

let state = {
  language: languages[0],
  topic: topics[0],
  style: styles[0],
  round: 0,
  score: 0,
  streak: 0,
  answers: [],
  selectedChoice: "",
  currentPrompt: "",
  currentCoachLine: "",
  lastEvaluation: null,
  currentObjective: linguisticObjectives[0],
  currentPowerUp: powerUps[0],
  transcript: "",
  recognition: null,
  isListening: false,
  timer: 0,
  timerId: null,
  lastFeedback: "",
  currentAudio: null,
  isSubmitting: false
};

const $ = (id) => document.getElementById(id);

function init() {
  fillSelect($("languageSelect"), languages);
  fillSelect($("topicSelect"), topics);
  renderStyles();
  renderLevels();
  bindEvents();
  updateStatus();
}

function fillSelect(select, values) {
  select.innerHTML = values.map((value) => `<option value="${value}">${value}</option>`).join("");
}

function renderStyles() {
  $("styleGrid").innerHTML = styles.map((style) => `
    <button class="style-card ${style.id === state.style.id ? "selected" : ""}" type="button" data-style="${style.id}">
      <strong>${style.name}</strong>
      <p>${style.rule}</p>
    </button>
  `).join("");
}

function renderLevels() {
  $("levelLadder").innerHTML = cefrLevels.map(([level, label]) => `
    <div class="level-row"><strong>${level}</strong><span>${label}</span></div>
  `).join("");
}

function bindEvents() {
  $("languageSelect").addEventListener("change", (event) => {
    state.language = event.target.value;
    updateStatus();
  });
  $("topicSelect").addEventListener("change", (event) => {
    state.topic = event.target.value;
    updateStatus();
  });
  $("styleGrid").addEventListener("click", (event) => {
    const card = event.target.closest("[data-style]");
    if (!card) return;
    state.style = styles.find((style) => style.id === card.dataset.style);
    renderStyles();
    updateStatus();
  });
  $("startButton").addEventListener("click", startSession);
  $("replayPromptButton").addEventListener("click", speakRoundPrompt);
  $("speakButton").addEventListener("click", toggleListening);
  $("submitButton").addEventListener("click", submitRound);
  $("hintButton").addEventListener("click", showHint);
  $("replayAudioButton").addEventListener("click", () => playAiVoice(state.lastFeedback, "feedback"));
  $("newSessionButton").addEventListener("click", resetToSetup);
}

function updateStatus() {
  $("statusLanguage").textContent = state.language;
  $("statusTopic").textContent = state.topic;
  $("statusStyle").textContent = state.style.name;
}

function showScreen(id) {
  document.querySelectorAll(".workspace").forEach((screen) => screen.classList.remove("active"));
  $(id).classList.add("active");
}

function startSession() {
  state.round = 0;
  state.score = 0;
  state.streak = 0;
  state.answers = [];
  state.selectedChoice = "";
  state.transcript = "";
  state.lastFeedback = "";
  state.currentCoachLine = "";
  state.lastEvaluation = null;
  state.currentObjective = linguisticObjectives[0];
  state.currentPowerUp = powerUps[0];
  $("roundFeedback").hidden = true;
  $("roundFeedback").innerHTML = "";
  showScreen("gameScreen");
  $("missionTitle").textContent = state.style.name;
  $("missionDescription").textContent = state.style.rule;
  nextRound();
}

async function nextRound() {
  clearInterval(state.timerId);
  stopListening();
  setSubmitting(false);
  state.selectedChoice = "";
  state.transcript = "";
  $("transcriptText").textContent = "Your spoken answer will appear here.";
  $("voiceStatus").textContent = "AI coach is preparing a question...";
  $("hintPanel").hidden = true;
  $("hintPanel").textContent = "";
  state.round += 1;

  if (state.round > 5) {
    finishSession();
    return;
  }

  const task = taskBank[state.topic][state.round - 1];
  state.currentObjective = linguisticObjectives[(state.round - 1) % linguisticObjectives.length];
  state.currentPowerUp = powerUps[(state.round + state.style.id.length - 1) % powerUps.length];
  state.currentPrompt = state.style.prompt.replace("{language}", state.language).replace("{task}", task);
  $("roundMeta").textContent = `Round ${state.round} of 5`;
  $("gameTitle").textContent = `${state.language} ${state.topic}`;
  $("promptText").textContent = "AI coach is about to ask you a question.";
  $("linguisticChip").innerHTML = `
    <strong>${escapeHtml(state.currentPowerUp)} - ${escapeHtml(state.currentObjective.name)}</strong>
    <span>${escapeHtml(state.currentObjective.target)} Bonus: ${escapeHtml(state.currentObjective.bonus)}</span>
  `;
  $("missionDescription").textContent = `Theme: ${state.topic}. Conversation style: ${state.style.name}. Current focus: ${state.currentObjective.name.toLowerCase()}.`;
  renderChoices();
  updateGameStats();
  startTimer();
  await loadConversationPrompt();
  setTimeout(speakRoundPrompt, 250);
}

function renderChoices() {
  if (state.style.id !== "mystery") {
    $("choiceArea").innerHTML = "";
    return;
  }
  $("choiceArea").innerHTML = choiceSeeds.map((choice, index) => `
    <button class="choice-button" type="button" data-choice="${index}">${choice}</button>
  `).join("");
  $("choiceArea").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      $("choiceArea").querySelectorAll("button").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      state.selectedChoice = button.textContent.trim();
    });
  });
}

function startTimer() {
  state.timer = state.style.id === "speed" ? 45 : 90;
  $("timerValue").textContent = state.timer;
  state.timerId = setInterval(() => {
    state.timer -= 1;
    $("timerValue").textContent = state.timer;
    if (state.timer <= 0) submitRound();
  }, 1000);
}

function showHint() {
  const task = taskBank[state.topic][state.round - 1];
  $("hintPanel").hidden = false;
  $("hintPanel").textContent = `Answer the AI coach directly. Linguistic target: ${state.currentObjective.target} Bonus move: ${state.currentObjective.bonus} If you need a content idea, talk about this theme detail: ${task}.`;
}

function speakRoundPrompt() {
  const strategy = state.selectedChoice ? `Your selected strategy is: ${state.selectedChoice}.` : "";
  const spokenPrompt = [
    state.currentCoachLine,
    `Power-up: ${state.currentPowerUp}.`,
    `Speaking focus: ${state.currentObjective.name}. ${state.currentObjective.target}`,
    `Bonus move: ${state.currentObjective.bonus}`,
    strategy,
    "When you are ready, press speak answer and respond out loud."
  ].filter(Boolean).join(" ");

  $("voiceStatus").textContent = "AI prompt is playing. Then press Speak answer.";
  playAiVoice(spokenPrompt, "prompt", () => {
    $("voiceStatus").textContent = "Your turn. Press Speak answer and respond out loud.";
  });
}

async function loadConversationPrompt() {
  const previousAnswer = state.answers[state.answers.length - 1];
  try {
    const response = await fetch("/api/conversation-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: state.language,
        topic: state.topic,
        style: state.style.name,
        round: state.round,
        previousTranscript: previousAnswer?.answer || "",
        previousFeedback: previousAnswer?.evaluation?.nextChallenge || "",
        linguisticObjective: state.currentObjective,
        powerUp: state.currentPowerUp
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "The AI coach could not create a prompt.");
    state.currentCoachLine = data.coachLine;
    $("promptText").textContent = data.coachLine;
    $("transcriptText").textContent = data.transcriptPrompt || "Your spoken reply will appear here.";
    $("voiceStatus").textContent = "AI coach will speak first.";
    $("missionDescription").textContent = `${data.linguisticFocus || state.currentObjective.name}. ${state.style.rule}`;
  } catch {
    state.currentCoachLine = fallbackCoachLine();
    $("promptText").textContent = state.currentCoachLine;
    $("voiceStatus").textContent = "AI coach will speak first.";
  }
}

function fallbackCoachLine() {
  const task = taskBank[state.topic][state.round - 1];
  return `Round ${state.round}. Let's talk in ${state.language} about ${state.topic}. Please answer this out loud: can you ${task}?`;
}

async function submitRound() {
  if (state.isSubmitting) return;
  stopListening();
  clearInterval(state.timerId);
  setSubmitting(true);

  const answer = state.transcript.trim();
  if (!answer) {
    $("roundFeedback").hidden = false;
    $("roundFeedback").innerHTML = "<strong>Speak an answer first.</strong><p>The app needs a transcript before the AI can evaluate your proficiency.</p>";
    setSubmitting(false);
    startTimer();
    return;
  }

  try {
    const evaluation = await evaluateAnswer(answer);
    state.streak = evaluation.score >= 70 ? state.streak + 1 : 0;
    state.score += evaluation.xpPoints + state.streak * 5;
    state.answers.push({ answer, evaluation, timeLeft: state.timer });
    state.lastEvaluation = evaluation;
    updateGameStats();
    renderRoundFeedback(evaluation);
    state.lastFeedback = makeSpokenFeedback(evaluation);
    playAiVoice(state.lastFeedback, "feedback");
    setTimeout(nextRound, state.round >= 5 ? 900 : 2600);
  } catch (error) {
    $("roundFeedback").hidden = false;
    $("roundFeedback").innerHTML = `<strong>Evaluation unavailable.</strong><p>${escapeHtml(error.message)}</p>`;
    setSubmitting(false);
  }
}

// The frontend sends answer context to your own backend only.
// OPENAI_API_KEY stays in .env on the Node server and is never exposed here.
async function evaluateAnswer(answer) {
  const response = await fetch("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: state.language,
      topic: state.topic,
      style: state.style.name,
      prompt: state.currentPrompt,
      answer,
      round: state.round,
      totalRounds: 5,
      selectedChoice: state.selectedChoice
      ,
      linguisticObjective: state.currentObjective,
      powerUp: state.currentPowerUp
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The backend could not evaluate this answer.");
  return data;
}

function renderRoundFeedback(evaluation) {
  $("roundFeedback").hidden = false;
  $("roundFeedback").innerHTML = `
    <strong>${escapeHtml(evaluation.cefrLevel)} / ${evaluation.score} points</strong>
    <p><strong>Power-up:</strong> ${escapeHtml(state.currentPowerUp)}. <strong>Badge:</strong> ${escapeHtml(evaluation.badgeSuggestion)}. <strong>XP:</strong> ${escapeHtml(String(evaluation.xpPoints))}</p>
    <p>${escapeHtml(evaluation.grammarFeedback)}</p>
    <p>${escapeHtml(evaluation.vocabularyFeedback)}</p>
    <p>${escapeHtml(evaluation.fluencyFeedback)}</p>
    <p><strong>Corrected:</strong> ${escapeHtml(evaluation.correctedVersion)}</p>
    <p><strong>Next:</strong> ${escapeHtml(evaluation.nextChallenge)}</p>
  `;
}

function updateGameStats() {
  $("scoreValue").textContent = state.score;
  $("streakValue").textContent = state.streak;
  $("progressFill").style.width = `${Math.min((state.round - 1) / 5 * 100, 100)}%`;
}

function finishSession() {
  clearInterval(state.timerId);
  setSubmitting(false);
  $("progressFill").style.width = "100%";

  const evaluations = state.answers.map((item) => item.evaluation);
  const avgScore = Math.round(evaluations.reduce((sum, item) => sum + item.score, 0) / Math.max(evaluations.length, 1));
  const finalEvaluation = evaluations[evaluations.length - 1] || {
    cefrLevel: "Pre-A1",
    score: 0,
    grammarFeedback: "Complete more rounds to receive feedback.",
    vocabularyFeedback: "Complete more rounds to receive feedback.",
    fluencyFeedback: "Complete more rounds to receive feedback.",
    correctedVersion: "",
    xpPoints: 0,
    badgeSuggestion: "First Step",
    nextChallenge: "Start a new session and answer the first prompt."
  };

  const feedback = `Final AI coach feedback for ${state.language}. Your latest CEFR level is ${finalEvaluation.cefrLevel}, with an average session score of ${avgScore} out of 100. You trained register, morphology, syntax, lexical range, and fluency. Grammar: ${finalEvaluation.grammarFeedback} Vocabulary: ${finalEvaluation.vocabularyFeedback} Fluency: ${finalEvaluation.fluencyFeedback} Next challenge: ${finalEvaluation.nextChallenge}`;
  state.lastFeedback = feedback;

  $("levelBadge").textContent = `CEFR ${finalEvaluation.cefrLevel}`;
  $("feedbackSummary").textContent = feedback;
  $("metricGrid").innerHTML = [
    ["XP", state.score],
    ["Avg. score", `${avgScore}/100`],
    ["Badge", finalEvaluation.badgeSuggestion],
    ["Rounds", state.answers.length],
    ["Mode", state.style.name]
  ].map(([label, value]) => `
    <div class="metric"><strong>${escapeHtml(String(value))}</strong><small>${escapeHtml(label)}</small></div>
  `).join("");
  $("feedbackDetails").innerHTML = `
    <div><strong>Corrected version</strong><p>${escapeHtml(finalEvaluation.correctedVersion)}</p></div>
    <div><strong>Next challenge</strong><p>${escapeHtml(finalEvaluation.nextChallenge)}</p></div>
  `;

  showScreen("feedbackScreen");
  setTimeout(() => playAiVoice(feedback, "feedback"), 300);
}

function makeSpokenFeedback(evaluation) {
  return `CEFR ${evaluation.cefrLevel}. Score ${evaluation.score} out of 100. Grammar: ${evaluation.grammarFeedback} Vocabulary: ${evaluation.vocabularyFeedback} Fluency: ${evaluation.fluencyFeedback} Badge unlocked: ${evaluation.badgeSuggestion}. Next challenge: ${evaluation.nextChallenge}`;
}

function setSubmitting(isSubmitting) {
  state.isSubmitting = isSubmitting;
  $("submitButton").disabled = isSubmitting;
  $("speakButton").disabled = isSubmitting;
  $("submitButton").textContent = isSubmitting ? "Evaluating..." : "OK Send transcript";
}

async function playAiVoice(text, kind = "prompt", onEnd) {
  stopAudioPlayback();
  setVoiceHalo("ai");
  const instructions = kind === "feedback"
    ? "Speak like an encouraging expert language coach. Warm, expressive, specific, and celebratory without sounding robotic."
    : "Speak like a charismatic conversation partner starting a fun language game. Natural, upbeat, clear, and inviting.";

  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice: kind === "feedback" ? "nova" : "coral",
        instructions
      })
    });
    if (!response.ok) throw new Error("Speech API failed.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    state.currentAudio = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      state.currentAudio = null;
      setVoiceHalo("");
      if (onEnd) onEnd();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      state.currentAudio = null;
      setVoiceHalo("");
      speakFallback(text, onEnd);
    };
    await audio.play();
  } catch {
    setVoiceHalo("");
    speakFallback(text, onEnd);
  }
}

function stopAudioPlayback() {
  if (state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio.currentTime = 0;
    state.currentAudio = null;
  }
  setVoiceHalo("");
}

function toggleListening() {
  if (state.isListening) {
    stopListening();
    return;
  }
  startListening();
}

function startListening() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    $("voiceStatus").textContent = "Speech recognition is not available in this browser. Try Chrome or Edge.";
    return;
  }

  stopAudioPlayback();
  window.speechSynthesis?.cancel();
  stopListening();
  const recognition = new Recognition();
  recognition.lang = speechLanguageCodes[state.language] || "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  state.recognition = recognition;
  state.isListening = true;
  $("speakButton").classList.add("listening");
  setVoiceHalo("user");
  $("speakButton").innerHTML = '<span aria-hidden="true">LIVE</span>Listening';
  $("voiceStatus").textContent = `Listening in ${state.language}. Speak naturally.`;

  let finalTranscript = "";
  recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const phrase = event.results[index][0].transcript;
      if (event.results[index].isFinal) {
        finalTranscript += phrase;
      } else {
        interimTranscript += phrase;
      }
    }
    state.transcript = `${finalTranscript} ${interimTranscript}`.trim();
    $("transcriptText").textContent = state.transcript || "Listening...";
  };

  recognition.onerror = (event) => {
    $("voiceStatus").textContent = `Speech recognition stopped: ${event.error}.`;
    state.isListening = false;
    renderMicIdle();
    setVoiceHalo("");
  };

  recognition.onend = () => {
    state.isListening = false;
    renderMicIdle();
    setVoiceHalo("");
    $("voiceStatus").textContent = state.transcript
      ? "Transcript ready. Send it for AI evaluation."
      : "No transcript captured. Try speaking again.";
  };

  recognition.start();
}

function stopListening() {
  if (state.recognition && state.isListening) {
    state.recognition.stop();
  }
  state.isListening = false;
  renderMicIdle();
  if (!state.currentAudio) setVoiceHalo("");
}

function renderMicIdle() {
  $("speakButton").classList.remove("listening");
  $("speakButton").innerHTML = '<span aria-hidden="true">REC</span>Speak answer';
}

function setVoiceHalo(mode) {
  const halo = $("voiceHalo");
  halo.classList.remove("ai", "user");
  if (mode) halo.classList.add(mode);
}

function speakFallback(text, onEnd) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.94;
  utterance.pitch = 1;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

function resetToSetup() {
  clearInterval(state.timerId);
  stopListening();
  stopAudioPlayback();
  window.speechSynthesis?.cancel();
  showScreen("setupScreen");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

init();
