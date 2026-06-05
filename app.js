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
  {
    id: "quest",
    name: "Quest Map",
    rule: "Complete five checkpoints by answering with useful, topic-specific sentences.",
    prompt: "You reached a checkpoint. Respond naturally in {language}: {task}"
  },
  {
    id: "boss",
    name: "Boss Battle",
    rule: "Defeat the boss with longer answers, corrections, and confident grammar.",
    prompt: "The boss challenges your precision. Answer in {language} with detail: {task}"
  },
  {
    id: "speed",
    name: "Speed Run",
    rule: "Short timer, fast recall, bonus XP for direct answers.",
    prompt: "Move fast. Give a concise {language} response: {task}"
  },
  {
    id: "mystery",
    name: "Mystery Cards",
    rule: "Pick the strongest option, then write one sentence explaining or expanding it.",
    prompt: "Choose the best card, then add one {language} sentence for: {task}"
  }
];

const ilrLevels = [
  { level: "0+", label: "Memorized words and survival fragments.", min: 0 },
  { level: "1", label: "Simple formulaic exchanges on familiar needs.", min: 18 },
  { level: "1+", label: "Can combine simple sentences with hesitation.", min: 32 },
  { level: "2", label: "Handles routine social and work tasks.", min: 46 },
  { level: "2+", label: "Sustains narration with emerging accuracy.", min: 60 },
  { level: "3", label: "Participates effectively in most conversations.", min: 72 },
  { level: "3+", label: "Strong control with occasional unevenness.", min: 82 },
  { level: "4", label: "Advanced, precise, and culturally flexible.", min: 90 },
  { level: "4+", label: "Near-native breadth with rare lapses.", min: 96 },
  { level: "5", label: "Educated native-equivalent command.", min: 99 }
];

const taskBank = {
  "Travel survival": [
    "ask for directions to the nearest train station",
    "explain that your hotel reservation is missing",
    "ask when the last bus leaves",
    "describe a lost backpack",
    "request help buying a local transit card"
  ],
  "Food and restaurants": [
    "order a meal and ask about ingredients",
    "politely say the food is not what you ordered",
    "reserve a table for four people",
    "ask for a recommendation without meat",
    "compliment the chef and ask for the bill"
  ],
  "Work meetings": [
    "summarize a project delay",
    "ask a colleague to clarify the deadline",
    "disagree politely with a proposal",
    "introduce yourself to a new team",
    "explain next steps after a meeting"
  ],
  "Healthcare": [
    "describe a headache and fever",
    "ask how often to take medicine",
    "make an appointment for tomorrow morning",
    "explain an allergy",
    "ask where the pharmacy is"
  ],
  "Friendship": [
    "invite a friend to a weekend activity",
    "apologize for arriving late",
    "describe your favorite hobby",
    "ask about someone's family",
    "make plans to meet again"
  ],
  "Current events": [
    "summarize a local news story",
    "give a cautious opinion about an election",
    "compare two policy choices",
    "ask someone what they think about the news",
    "explain why a story matters"
  ],
  "Shopping": [
    "ask for a different size",
    "compare prices at two stores",
    "return an item politely",
    "ask whether a discount is available",
    "describe the color and style you want"
  ],
  "Housing": [
    "ask about rent and utilities",
    "report a broken appliance",
    "describe the neighborhood you prefer",
    "schedule a time to see an apartment",
    "negotiate a move-in date"
  ],
  "Technology": [
    "explain that your phone battery died",
    "ask for help connecting to Wi-Fi",
    "describe a software problem",
    "compare two apps",
    "ask someone to send a file again"
  ],
  "School and study": [
    "ask a teacher for extra help",
    "explain why homework is late",
    "summarize a reading assignment",
    "invite a classmate to study",
    "ask about exam format"
  ],
  "Transportation": [
    "ask a taxi driver for the fastest route",
    "buy a train ticket",
    "explain a flight delay",
    "ask where to change buses",
    "describe traffic near your home"
  ],
  "Culture and etiquette": [
    "ask what gift is appropriate",
    "thank a host after dinner",
    "explain a holiday tradition",
    "ask how formal your clothing should be",
    "politely refuse an invitation"
  ]
};

const choiceSeeds = [
  "Use a greeting, a clear request, and a thank-you.",
  "Use only one word.",
  "Avoid the topic and change subject.",
  "Give a long answer in English."
];

let state = {
  language: languages[0],
  topic: topics[0],
  style: styles[0],
  round: 0,
  score: 0,
  streak: 0,
  answers: [],
  selectedChoice: "",
  timer: 0,
  timerId: null,
  lastFeedback: ""
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
  $("levelLadder").innerHTML = ilrLevels.map((item) => `
    <div class="level-row">
      <strong>${item.level}</strong>
      <span>${item.label}</span>
    </div>
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
  $("submitButton").addEventListener("click", submitRound);
  $("hintButton").addEventListener("click", showHint);
  $("replayAudioButton").addEventListener("click", () => speak(state.lastFeedback));
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
  showScreen("gameScreen");
  $("missionTitle").textContent = state.style.name;
  $("missionDescription").textContent = state.style.rule;
  nextRound();
}

function nextRound() {
  clearInterval(state.timerId);
  state.selectedChoice = "";
  $("responseInput").value = "";
  $("hintPanel").hidden = true;
  $("hintPanel").textContent = "";
  state.round += 1;

  if (state.round > 5) {
    finishSession();
    return;
  }

  const task = taskBank[state.topic][state.round - 1];
  $("roundMeta").textContent = `Round ${state.round} of 5`;
  $("gameTitle").textContent = `${state.language} ${state.topic}`;
  $("promptText").textContent = state.style.prompt
    .replace("{language}", state.language)
    .replace("{task}", task);
  renderChoices();
  updateGameStats();
  startTimer();
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
  $("hintPanel").textContent = `Try including who, what, and one specific detail. For this round, make sure your answer clearly addresses: ${task}.`;
}

function submitRound() {
  clearInterval(state.timerId);
  const answer = $("responseInput").value.trim();
  const words = answer.split(/\s+/).filter(Boolean);
  const hasChoiceBonus = state.style.id !== "mystery" || state.selectedChoice === choiceSeeds[0];
  const lengthScore = Math.min(words.length * 2, 34);
  const detailScore = scoreDetails(answer);
  const modeBonus = state.style.id === "boss" && words.length > 16 ? 8 : state.style.id === "speed" && state.timer > 12 ? 8 : 4;
  const roundScore = answer ? Math.max(8, lengthScore + detailScore + modeBonus + (hasChoiceBonus ? 8 : 0)) : 0;

  state.streak = roundScore >= 45 ? state.streak + 1 : 0;
  state.score += roundScore + state.streak * 3;
  state.answers.push({ answer, roundScore, words: words.length, timeLeft: state.timer });
  updateGameStats();
  setTimeout(nextRound, 450);
}

function scoreDetails(answer) {
  const punctuation = /[,.!?;:]/.test(answer) ? 6 : 0;
  const connective = /\b(and|but|because|so|when|if|also|then|with|without)\b/i.test(answer) ? 8 : 0;
  const courtesy = /\b(please|thank|thanks|sorry|excuse|hello|hi)\b/i.test(answer) ? 5 : 0;
  const nonAscii = /[^\x00-\x7F]/.test(answer) ? 6 : 0;
  return punctuation + connective + courtesy + nonAscii;
}

function updateGameStats() {
  $("scoreValue").textContent = state.score;
  $("streakValue").textContent = state.streak;
  $("progressFill").style.width = `${Math.min((state.round - 1) / 5 * 100, 100)}%`;
}

function finishSession() {
  clearInterval(state.timerId);
  $("progressFill").style.width = "100%";
  const percent = Math.min(100, Math.round(state.score / 3.25));
  const level = [...ilrLevels].reverse().find((item) => percent >= item.min) || ilrLevels[0];
  const avgWords = Math.round(state.answers.reduce((sum, item) => sum + item.words, 0) / Math.max(state.answers.length, 1));
  const bestRound = Math.max(...state.answers.map((item) => item.roundScore), 0);
  const feedback = makeFeedback(level, percent, avgWords, bestRound);

  state.lastFeedback = feedback;
  $("levelBadge").textContent = `ILR ${level.level}`;
  $("feedbackSummary").textContent = feedback;
  $("metricGrid").innerHTML = [
    ["XP", state.score],
    ["Accuracy", `${percent}%`],
    ["Avg. words", avgWords],
    ["Best round", bestRound]
  ].map(([label, value]) => `
    <div class="metric">
      <strong>${value}</strong>
      <small>${label}</small>
    </div>
  `).join("");

  showScreen("feedbackScreen");
  setTimeout(() => speak(feedback), 300);
}

function makeFeedback(level, percent, avgWords, bestRound) {
  const nextLevel = ilrLevels.find((item) => item.min > percent);
  const nextText = nextLevel ? `To push toward ILR ${nextLevel.level}, add more connected sentences, clearer time markers, and one self-correction when needed.` : "You are performing at the top of this scale, so focus on nuance, register, idiom, and cultural precision.";
  return `AI coach feedback for ${state.language}, ${state.topic}, ${state.style.name}. Your estimated proficiency is ILR ${level.level}: ${level.label} You scored ${percent} percent with an average of ${avgWords} words per answer and a best round score of ${bestRound}. ${nextText}`;
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.94;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function resetToSetup() {
  clearInterval(state.timerId);
  window.speechSynthesis?.cancel();
  showScreen("setupScreen");
}

init();
