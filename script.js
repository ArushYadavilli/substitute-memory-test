// ======== Configuration ========
 
let rtCurrentDelay = 0;
let rtHideTimer = null;
let digitAnswerTimer = null;
let finalResults = {};
let rtBest = 0;
let testsRemaining = {
 memory: true,
 stroop: true,
 digitspan: true,
 rt: true
};
 
// Digit Span Sequencing globals
let digitSpanSection, btnDigitSpan, digitDisplayEl, digitInputEl, digitSubmitBtn, digitTimerEl, digitScoreEl;
const DSS_START_LEN = 3;
const DSS_MAX_LEN = 9;
const DSS_TRIALS_PER_LEN = 2;
const DSS_DISPLAY_MS = 1000;
const DSS_GAP_MS = 600;
const DSS_INTER_TRIAL_MS = 1500;
let dssCurrentLen = DSS_START_LEN;
let dssTrialCount = 0;
let dssFailuresAtLen = 0;
let dssBest = 0;
let dssSequence = [];
let dssShowing = false;
let stroopCongruentScore = 0;
let stroopIncongruentScore = 0;
 
const STROOP_COLORS = ["red", "blue", "green", "yellow"];
let currentStroopCorrectColor = "";
let currentStroopType = "";
let stroopTimerId = null;
let stroopTimeLeft = 45;
 
const WORDSETS = [
 [
 ["cat", "ring"], ["sun", "jam"], ["bed", "rope"], ["fish", "bell"],
 ["tree", "mask"], ["star", "shoe"], ["book", "coal"], ["rain", "gold"],
 ["glass", "farm"], ["road", "leaf"], ["bread", "wave"], ["clock", "sand"],
 ],
 [
 ["ship", "barn"], ["salt", "glove"], ["stone", "card"], ["wind", "seat"],
 ["lamp", "knot"], ["foot", "surf"], ["milk", "twig"], ["ring", "cup"],
 ["seed", "mine"], ["bell", "sky"], ["leaf", "hook"], ["mask", "page"],
 ],
 [
 ["coal", "bed"], ["gate", "fish"], ["wave", "bread"], ["sand", "star"],
 ["chair", "rain"], ["hand", "glass"], ["card", "sun"], ["wheel", "book"],
 ["barn", "cat"], ["rope", "tree"], ["bird", "road"], ["jam", "ship"],
 ],
];
 
// Reaction Time globals
let rtSection, rtArea, rtBall, rtStartBtn, rtResultsEl, btnRT;
let rtStartTime = 0;
let rtResults = [];
let rtTrial = 0;
const RT_TRIALS = 20;
 
const STUDY_MS = 3000;
const ANSWER_TIME_LIMIT = 8000;
 
// ======== State ========
 
let weekNumber = null;
let wordsetIndex = 0;
let pairs = [];
let currentRound = 0;
let studyIdx = 0;
let currentOrder = [];
let participantIdInput;
let studyTimer = null;
let currentCueIndex = 0;
let currentCorrect = 0;
let answerTimer = null;
let roundOneScore = 0;
let roundTwoScore = 0;
let roundThreeScore = 0;
 
// ======== Elements ========
 
let phaseLabelEl;
let progressBarEl;
let setupSection;
let studySection;
let roundSection;
let summarySection;
let weekInput;
let startBtn;
let pairLeftEl;
let pairRightEl;
let roundTitleEl;
let roundListEl;
let submitRoundBtn;
let scoreR1El;
let scoreR2El;
let scoreR3El;
let studyTitleEl;
 
// ======== Instructions ========
 
const TEST_INSTRUCTIONS = {
 memory: {
 title: "Memory Test Instructions",
 body: "You will study 12 word pairs, each shown for 3 seconds. " +
 "Then you will be asked to recall the matching word for each cue. " +
 "This repeats for 3 rounds. You have 8 seconds per answer."
 },
 stroop: {
 title: "Stroop Task Instructions",
 body: "Words will appear in colored ink. Press the key matching the INK COLOR, " +
 "not the word itself. Keys: R = Red, B = Blue, G = Green, Y = Yellow. " +
 "You have 45 seconds per phase (congruent then incongruent)."
 },
 digitspan: {
 title: "Digit Span Sequencing Instructions",
 body: "A sequence of digits will appear one at a time. After the sequence ends, " +
 "type the digits back in ascending (smallest to largest) order. " +
 "Sequences get longer as you succeed. You have 5 seconds to respond."
 },
 rt: {
 title: "Reaction Time Instructions",
 body: "A pink ball will appear at random intervals inside a white box. " +
 "Press SPACE as quickly as possible when you see it. " +
 "There are 20 trials. Do not press before the ball appears."
 }
};
 
let pendingTestStart = null;
 
function showInstructions(testKey, startCallback) {
 const info = TEST_INSTRUCTIONS[testKey];
 document.getElementById("instructions-title").textContent = info.title;
 document.getElementById("instructions-body").textContent = info.body;
 pendingTestStart = startCallback;
 hideAllSections();
 document.getElementById("instructions-section").classList.add("active");
}
 
// ======== Utility Functions ========
 
function startDigitSpan() {
 testsRemaining.digitspan = true;
 dssCurrentLen = DSS_START_LEN;
 dssTrialCount = 0;
 dssFailuresAtLen = 0;
 dssBest = 0;
 showDigitSpanTrial();
}
 
function showDigitSpanTrial() {
 hideAllSections();
 digitSpanSection.classList.add("active");
 digitInputEl.value = "";
 digitInputEl.disabled = true;
 digitSubmitBtn.disabled = true;
 digitScoreEl.textContent = `Best: ${dssBest}`;
 dssSequence = generateSequence(dssCurrentLen);
 dssShowing = true;
 
 // Clear any leftover timer from previous trial
 if (digitAnswerTimer) clearTimeout(digitAnswerTimer);
 
 displaySequence(dssSequence).then(() => {
 dssShowing = false;
 digitInputEl.disabled = false;
 digitSubmitBtn.disabled = false;
 digitInputEl.focus();
 
 // Start 5-second response timer AFTER sequence finishes displaying
 digitAnswerTimer = setTimeout(() => {
 submitDigitSpan();
 }, 5000);
 });
}
 
function generateSequence(len) {
 const seq = [];
 for (let i = 0; i < len; i++) seq.push(Math.floor(Math.random() * 9) + 1);
 return seq;
}
 
async function displaySequence(seq) {
 digitSubmitBtn.disabled = true;
 digitDisplayEl.textContent = "";
 for (let i = 0; i < seq.length; i++) {
 digitDisplayEl.textContent = seq[i];
 await new Promise(r => setTimeout(r, DSS_DISPLAY_MS));
 digitDisplayEl.textContent = "";
 await new Promise(r => setTimeout(r, DSS_GAP_MS));
 }
 digitDisplayEl.textContent = "NOW";
 digitSubmitBtn.disabled = false;
}
 
function submitDigitSpan() {
 if (digitAnswerTimer) clearTimeout(digitAnswerTimer);
 if (dssShowing) return;
 
 const raw = digitInputEl.value.replace(/\s+/g, "");
 // Treat empty input as incorrect (don't return early)
 const user = raw ? raw.split("").map(Number).filter(n => !isNaN(n)) : [];
 const correct = [...dssSequence].sort((a, b) => a - b);
 
 if (user.length > 0 && arraysEqual(user, correct)) {
 dssBest = Math.max(dssBest, dssCurrentLen);
 dssTrialCount++;
 dssFailuresAtLen = 0;
 if (dssTrialCount >= DSS_TRIALS_PER_LEN) {
 dssCurrentLen++;
 dssTrialCount = 0;
 dssFailuresAtLen = 0;
 }
 } else {
 dssFailuresAtLen++;
 dssTrialCount++;
 if (dssTrialCount >= DSS_TRIALS_PER_LEN) {
 if (dssFailuresAtLen >= DSS_TRIALS_PER_LEN) {
 // Failed ALL trials at this length → end test
 endDigitSpan();
 return;
 }
 // Passed at least one trial — retry same length with fresh counters
 dssTrialCount = 0;
 dssFailuresAtLen = 0;
 }
 }
 
 if (dssCurrentLen > DSS_MAX_LEN) {
 endDigitSpan();
 return;
 }
 
 // Brief inter-trial pause so mobile users can prepare
 digitInputEl.disabled = true;
 digitSubmitBtn.disabled = true;
 digitDisplayEl.textContent = "Get ready…";
 setTimeout(() => showDigitSpanTrial(), DSS_INTER_TRIAL_MS);
}
 
function endDigitSpan() {
 testsRemaining.digitspan = false;
 hideAllSections();
 document.getElementById("test-complete").classList.add("active");
}
 
function arraysEqual(a, b) {
 if (a.length !== b.length) return false;
 for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
 return true;
}
 
function setPhase(name) {
 hideAllSections();
 const sectionMap = {
 setup: setupSection,
 study: studySection,
 round: roundSection,
 summary: summarySection,
 };
 const target = sectionMap[name];
 if (target) target.classList.add("active");
}
 
function clampProgress(pct) {
 progressBarEl.style.width = `${Math.max(0, Math.min(100, pct))}%`;
}
 
function selectWordset(weekNum) {
 const idx = ((weekNum % 3) + 3) % 3;
 const map = { 1: 0, 2: 1, 0: 2 };
 return map[idx];
}
 
function shuffle(arr) {
 const a = arr.slice();
 for (let i = a.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [a[i], a[j]] = [a[j], a[i]];
 }
 return a;
}
 
function normalize(s) {
 return (s || "").trim().toLowerCase();
}
 
function hideAllSections() {
 const ids = [
 "setup-section",
 "sleep-section",
 "study-section",
 "round-section",
 "summary-section",
 "test-select-section",
 "stroop-section",
 "digitspan-section",
 "rt-section",
 "instructions-section",
 "stroop-pause",
 "test-complete"
 ];
 ids.forEach(id => {
 const el = document.getElementById(id);
 if (el) el.classList.remove("active");
 });
}
 
function showTestSelection() {
 hideAllSections();
 testSelectSection.classList.add("active");
 styleTestButton(btnMemory, testsRemaining.memory, "Memory Test");
 styleTestButton(btnStroop, testsRemaining.stroop, "Stroop Task");
 styleTestButton(btnDigitSpan, testsRemaining.digitspan, "Digit Span Sequencing");
 styleTestButton(btnRT, testsRemaining.rt, "Reaction Time Test");
 if (!testsRemaining.memory && !testsRemaining.stroop &&
 !testsRemaining.digitspan && !testsRemaining.rt) {
 showSummary();
 }
}
 
function styleTestButton(btn, remaining, label) {
 btn.style.display = "block";
 if (remaining) {
 btn.disabled = false;
 btn.textContent = label;
 btn.style.opacity = "1";
 btn.style.cursor = "pointer";
 } else {
 btn.disabled = true;
 btn.textContent = "✓ " + label;
 btn.style.opacity = "0.5";
 btn.style.cursor = "default";
 }
}
 
// ======== Study Phase ========
 
function startStudy() {
 setPhase("study");
 studyIdx = 0;
 pairs = shuffle(pairs);
 clampProgress(0);
 renderStudyPair();
 studyTimer = setInterval(nextStudyPair, STUDY_MS);
 studyTitleEl.textContent = "Study the pairs — Round 1 of 3";
}
 
function renderStudyPair() {
 const [L, R] = pairs[studyIdx];
 pairLeftEl.textContent = L;
 pairRightEl.textContent = R;
 const pct = (studyIdx / pairs.length) * 100;
 clampProgress(pct);
}
 
function nextStudyPair() {
 studyIdx++;
 if (studyIdx >= pairs.length) {
 clearInterval(studyTimer);
 clampProgress(100);
 startRound(1);
 return;
 }
 renderStudyPair();
}
 
// ======== Round Phase ========
 
function startRound(n) {
 currentRound = n;
 currentCorrect = 0;
 setPhase("round");
 roundTitleEl.textContent = `Round ${n} of 3`;
 currentOrder = shuffle(pairs.map((_, i) => i));
 currentCueIndex = 0;
 showNextCue();
}
 
function submitToGoogleForms() {
 const formBaseURL = "https://docs.google.com/forms/d/e/1FAIpQLSfDYc6N1uShHFxDf99ClzNrMYOqKR5ok9p-jc1RWUCtegspuA/formResponse";
 const params = new URLSearchParams({
 "entry.1943144111": finalResults.participantId,
 "entry.1562095914": finalResults.weekNumber,
 "entry.1177523297": finalResults.memory.round1,
 "entry.840747436": finalResults.memory.round2,
 "entry.163873612": finalResults.memory.round3,
 "entry.1663343387": finalResults.stroop.congruent,
 "entry.530157698": finalResults.stroop.incongruent,
 "entry.269493374": finalResults.digitSpanSequencing,
 "entry.1406516205": finalResults.reactionTime
 });
 fetch(formBaseURL, {
 method: "POST",
 mode: "no-cors",
 body: params
 });
}
 
function showNextCue() {
 roundListEl.innerHTML = "";
 
 if (currentCueIndex >= currentOrder.length) {
 if (currentRound === 1) roundOneScore = currentCorrect;
 if (currentRound === 2) roundTwoScore = currentCorrect;
 if (currentRound === 3) roundThreeScore = currentCorrect;
 
 if (currentRound < 3) {
 startStudyAgainThenRound(currentRound + 1);
 } else {
 testsRemaining.memory = false;
 hideAllSections();
 document.getElementById("test-complete").classList.add("active");
 }
 return;
 }
 
 const idx = currentOrder[currentCueIndex];
 const cue = pairs[idx][0];
 const target = pairs[idx][1];
 
 const item = document.createElement("div");
 item.className = "round-item";
 
 const cueEl = document.createElement("div");
 cueEl.className = "cue";
 cueEl.textContent = cue;
 
 const inputEl = document.createElement("input");
 inputEl.type = "text";
 inputEl.placeholder = "Type the matching word";
 inputEl.autocomplete = "off";
 
 item.appendChild(cueEl);
 item.appendChild(inputEl);
 roundListEl.appendChild(item);
 
 inputEl.focus();
 
 // Fix 11: Enter key submits answer
 inputEl.addEventListener("keydown", (e) => {
 if (e.key === "Enter") { e.preventDefault(); submitRoundBtn.click(); }
 });
 
 if (answerTimer) clearTimeout(answerTimer);
 answerTimer = setTimeout(() => {
 currentCueIndex++;
 showNextCue();
 }, ANSWER_TIME_LIMIT);
 
 submitRoundBtn.onclick = () => {
 clearTimeout(answerTimer);
 const val = normalize(inputEl.value);
 if (val === normalize(target)) {
 currentCorrect++;
 }
 currentCueIndex++;
 showNextCue();
 };
}
 
function startStudyAgainThenRound(nextRoundNum) {
 studyTitleEl.textContent = `Study the pairs — Round ${nextRoundNum} of 3`;
 setPhase("study");
 studyIdx = 0;
 pairs = shuffle(pairs);
 clampProgress(0);
 renderStudyPair();
 
 if (studyTimer) clearInterval(studyTimer);
 studyTimer = setInterval(() => {
 studyIdx++;
 if (studyIdx >= pairs.length) {
 clearInterval(studyTimer);
 clampProgress(100);
 startRound(nextRoundNum);
 } else {
 renderStudyPair();
 }
 }, STUDY_MS);
}
 
// ======== Stroop Phase ========
 
let sleepData = { sleepTime: "", wakeTime: "", abnormal: "" };
 
// ---- Time input auto-formatting ----
function setupTimeInput(inputId) {
 const el = document.getElementById(inputId);
 if (!el) return;
 el.addEventListener("input", () => {
  let val = el.value.replace(/[^0-9aApPmM: ]/g, "");
  el.value = val;
 });
 el.addEventListener("blur", () => {
  const raw = el.value.trim();
  // Validate 12-hr format: H:MM AM/PM or HH:MM AM/PM
  const match = raw.match(/^(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM|am|pm)$/i);
  if (raw && !match) {
   el.style.borderColor = "var(--danger)";
  } else {
   el.style.borderColor = "";
   if (match) el.value = match[1] + ":" + match[2] + " " + match[3].toUpperCase();
  }
 });
}
 
function showSleepSurvey() {
 hideAllSections();
 document.getElementById("sleep-section").classList.add("active");
}
 
function validateSleepSurvey() {
 const sleepTime = document.getElementById("sleep-time").value.trim();
 const wakeTime = document.getElementById("wake-time").value.trim();
 const abnormal = document.getElementById("sleep-abnormal").value;
 const timeRe = /^(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM)$/i;
 if (!timeRe.test(sleepTime)) {
  alert("Please enter a valid sleep time (e.g., 11:30 PM).");
  return false;
 }
 if (!timeRe.test(wakeTime)) {
  alert("Please enter a valid wake time (e.g., 7:00 AM).");
  return false;
 }
 if (!abnormal) {
  alert("Please select whether your sleep schedule was abnormal.");
  return false;
 }
 sleepData = { sleepTime, wakeTime, abnormal };
 return true;
}
 
function startStroop(type) {
 currentStroopType = type;
 stroopTimeLeft = 45;
 currentStroopCorrectColor = "";
 
 stroopWordEl.textContent = "READY";
 stroopWordEl.style.color = "black";
 stroopScoreDisplayEl.textContent =
 "Correct: " + (type === "congruent" ? stroopCongruentScore : stroopIncongruentScore);
 stroopTimerEl.textContent = "Time left: 45s";
 
 hideAllSections();
 stroopSection.classList.add("active");
 
 if (stroopTimerId) clearInterval(stroopTimerId);
 stroopTimerId = setInterval(() => {
 stroopTimeLeft--;
 stroopTimerEl.textContent = "Time left: " + stroopTimeLeft + "s";
 if (stroopTimeLeft <= 0) {
 clearInterval(stroopTimerId);
 stroopTimerId = null;
 handleStroopEnd();
 }
 }, 1000);
 
 runStroopTrial();
}
 
function runStroopTrial() {
 const word = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
 let inkColor;
 if (currentStroopType === "congruent") {
 inkColor = word;
 } else {
 const others = STROOP_COLORS.filter(c => c !== word);
 inkColor = others[Math.floor(Math.random() * others.length)];
 }
 stroopWordEl.textContent = word.toUpperCase();
 stroopWordEl.style.color = inkColor;
 currentStroopCorrectColor = inkColor;
}
 
function handleStroopEnd() {
 if (currentStroopType === "congruent") {
 hideAllSections();
 document.getElementById("stroop-pause").classList.add("active");
 } else {
 testsRemaining.stroop = false;
 hideAllSections();
 document.getElementById("test-complete").classList.add("active");
 }
}
 
// ======== Reaction Time Phase ========
 
function startRT() {
 hideAllSections();
 rtSection.classList.add("active");
 rtResults = [];
 rtTrial = 0;
 rtResultsEl.textContent = "";
 nextRTTrial();
}
 
function nextRTTrial() {
 rtBall.style.display = "none";
 const counter = document.getElementById("rt-trial-counter");
 if (counter) counter.textContent = `Trial: ${rtTrial + 1} / ${RT_TRIALS}`;
 const preDelay = 3000 + Math.random() * 500;
 setTimeout(showRTBall, preDelay);
}
 
function showRTBall() {
 rtBall.style.left = "50%";
 rtBall.style.top = "50%";
 rtBall.style.transform = "translate(-50%, -50%)";
 rtBall.style.display = "block";
 rtStartTime = performance.now();
 
 if (rtHideTimer) clearTimeout(rtHideTimer);
 const hideDelay = 3000 + Math.random() * 500;
 
 rtHideTimer = setTimeout(() => {
 if (rtBall.style.display === "block") {
 rtBall.style.display = "none";
 rtTrial++;
 if (rtTrial < RT_TRIALS) {
 nextRTTrial();
 } else {
 finishRT();
 }
 }
 }, hideDelay);
}
 
function finishRT() {
 if (rtResults.length === 0) {
  rtBest = 0;
  rtResultsEl.innerHTML = `Average RT: N/A (no responses recorded)`;
 } else {
  let sum = rtResults.reduce((a, b) => a + b, 0);
  rtBest = Math.round(sum / rtResults.length);
  rtResultsEl.innerHTML = `Average RT: ${rtBest} ms`;
 }
 testsRemaining.rt = false;
 
 const rtSummaryEl = document.getElementById("score-rt");
 if (rtSummaryEl) {
  rtSummaryEl.textContent = rtBest > 0 ? rtBest + " ms" : "N/A";
 }
 
 hideAllSections();
 document.getElementById("test-complete").classList.add("active");
}
 
// ======== Summary Phase ========
 
function showSummary() {
 testsRemaining.memory = false;
 setPhase("summary");
 scoreR1El.textContent = `${roundOneScore}/12 (Week ${weekNumber})`;
 scoreR2El.textContent = `${roundTwoScore}/12 (Week ${weekNumber})`;
 scoreR3El.textContent = `${roundThreeScore}/12 (Week ${weekNumber})`;
 clampProgress(100);
 scoreStroopCongEl.textContent = stroopCongruentScore;
 scoreStroopIncongEl.textContent = stroopIncongruentScore;
 
 const participantId = document.getElementById("participant-id").value.trim();
 document.getElementById("score-rt").textContent = rtBest + " ms";
 
 finalResults = {
 participantId: participantId,
 weekNumber: weekNumber,
 sleep: sleepData,
 memory: {
 round1: roundOneScore,
 round2: roundTwoScore,
 round3: roundThreeScore
 },
 stroop: {
 congruent: stroopCongruentScore,
 incongruent: stroopIncongruentScore
 },
 digitSpanSequencing: dssBest,
 reactionTime: rtBest
 };
 
 // Lock this participant+week so they can't re-enter
 const lockKey = `testlock_${participantId}_week_${weekNumber}`;
 localStorage.setItem(lockKey, "completed");
 
 submitToGoogleForms();
}
 
// ======== Bootstrapping / Event Listeners ========
 
document.addEventListener("DOMContentLoaded", () => {
 // 1. Cache ALL DOM references FIRST
 studyTitleEl = document.getElementById("study-title");
 progressBarEl = document.getElementById("progress-bar");
 setupSection = document.getElementById("setup-section");
 studySection = document.getElementById("study-section");
 roundSection = document.getElementById("round-section");
 summarySection = document.getElementById("summary-section");
 testSelectSection = document.getElementById("test-select-section");
 stroopSection = document.getElementById("stroop-section");
 digitSpanSection = document.getElementById("digitspan-section");
 rtSection = document.getElementById("rt-section");
 weekInput = document.getElementById("week-input");
 participantIdInput = document.getElementById("participant-id");
 startBtn = document.getElementById("start-btn");
 pairLeftEl = document.getElementById("pair-left");
 pairRightEl = document.getElementById("pair-right");
 roundTitleEl = document.getElementById("round-title");
 roundListEl = document.getElementById("round-list");
 submitRoundBtn = document.getElementById("submit-round-btn");
 digitDisplayEl = document.getElementById("digitspan-display");
 digitInputEl = document.getElementById("digitspan-input");
 digitSubmitBtn = document.getElementById("digitspan-submit");
 digitTimerEl = document.getElementById("digitspan-timer");
 digitScoreEl = document.getElementById("digitspan-score");
 scoreDigitSpanEl = document.getElementById("score-digitspan");
 scoreR1El = document.getElementById("score-r1");
 scoreR2El = document.getElementById("score-r2");
 scoreR3El = document.getElementById("score-r3");
 btnMemory = document.getElementById("btn-memory");
 btnStroop = document.getElementById("btn-stroop");
 btnDigitSpan = document.getElementById("btn-digitspan");
 btnRT = document.getElementById("btn-rt");
 stroopWordEl = document.getElementById("stroop-word");
 stroopTimerEl = document.getElementById("stroop-timer");
 stroopScoreDisplayEl = document.getElementById("stroop-score-display");
 scoreStroopCongEl = document.getElementById("score-stroop-cong");
 scoreStroopIncongEl = document.getElementById("score-stroop-incong");
 rtBall = document.getElementById("rt-ball");
 rtArea = document.getElementById("rt-area");
 rtResultsEl = document.getElementById("rt-results");
 
 // 2. NOW safe to manipulate visibility
 hideAllSections();
 setupSection.classList.add("active");
 
 // ---- Sleep survey time inputs ----
 setupTimeInput("sleep-time");
 setupTimeInput("wake-time");
 
 // ---- Sleep survey submit ----
 document.getElementById("sleep-submit-btn").addEventListener("click", () => {
  if (validateSleepSurvey()) {
   showTestSelection();
  }
 });
 
 // ---- Start button ----
 startBtn.addEventListener("click", () => {
 const participantId = participantIdInput.value.trim();
 const val = parseInt(weekInput.value, 10);
 
 if (!/^\d+$/.test(participantId)) {
 alert("Participant ID must be numbers only");
 return;
 }
 if (!val || val < 1 || val > 3) {
 alert("Please enter a valid week number (1-3).");
 return;
 }
 
 const lockKey = `testlock_${participantId}_week_${val}`;
 const lockStatus = localStorage.getItem(lockKey);
 
 if (lockStatus === "completed") {
 alert("You have already completed all tests for this week. You cannot re-enter.");
 return;
 }
 if (lockStatus === "started") {
 const proceed = confirm(
 "It looks like you started this week's tests but didn't finish. " +
 "All tests will restart from the beginning. Continue?"
 );
 if (!proceed) return;
 }
 
 localStorage.setItem(lockKey, "started");
 weekNumber = val;
 wordsetIndex = selectWordset(weekNumber);
 pairs = WORDSETS[wordsetIndex].map(([L, R]) => [L, R]);
 showSleepSurvey();
 });
 
 // ---- Stroop keyboard handler ----
 document.addEventListener("keydown", (e) => {
 if (!stroopSection.classList.contains("active")) return;
 if (!currentStroopCorrectColor) return;
 
 const key = e.key.toLowerCase();
 let chosen = "";
 if (key === "r") chosen = "red";
 if (key === "b") chosen = "blue";
 if (key === "g") chosen = "green";
 if (key === "y") chosen = "yellow";
 if (!chosen) return;
 
 if (chosen === currentStroopCorrectColor) {
 if (currentStroopType === "congruent") stroopCongruentScore++;
 else stroopIncongruentScore++;
 stroopScoreDisplayEl.textContent =
 "Correct: " +
 (currentStroopType === "congruent"
 ? stroopCongruentScore
 : stroopIncongruentScore);
 }
 runStroopTrial();
 });
 
 // ---- Test hub buttons (using .onclick = to prevent duplicate listeners) ----
  document.querySelectorAll(".stroop-btn").forEach(btn => {
 btn.addEventListener("click", () => {
 if (!stroopSection.classList.contains("active")) return;
 if (!currentStroopCorrectColor) return;
 const chosen = btn.getAttribute("data-color");
 if (chosen === currentStroopCorrectColor) {
 if (currentStroopType === "congruent") stroopCongruentScore++;
 else stroopIncongruentScore++;
 stroopScoreDisplayEl.textContent =
 "Correct: " + (currentStroopType === "congruent"
 ? stroopCongruentScore : stroopIncongruentScore);
 }
 runStroopTrial();
 });
 });
 btnMemory.onclick = () => showInstructions("memory", startStudy);
 btnStroop.onclick = () => showInstructions("stroop", () => startStroop("congruent"));
 btnDigitSpan.onclick = () => showInstructions("digitspan", startDigitSpan);
 btnRT.onclick = () => showInstructions("rt", startRT);
 rtBall.addEventListener("click", () => {
 if (!rtSection.classList.contains("active")) return;
 if (rtBall.style.display !== "block") return;
 const rt = performance.now() - rtStartTime;
 rtResults.push(rt);
 rtBall.style.display = "none";
 if (rtHideTimer) clearTimeout(rtHideTimer);
 rtTrial++;
 if (rtTrial < RT_TRIALS) nextRTTrial();
 else finishRT();
 });
 
 // ---- Instructions "Begin Test" button ----
 document.getElementById("instructions-start-btn").onclick = () => {
 if (pendingTestStart) pendingTestStart();
 };
 
 // ---- Digit span submit ----
 digitSubmitBtn.addEventListener("click", submitDigitSpan);
 if (digitInputEl) {
 digitInputEl.addEventListener("keydown", (e) => {
 if (e.key === "Enter") submitDigitSpan();
 });
 }
 
 // ---- Stroop pause → incongruent ----
 document.getElementById("stroop-continue").addEventListener("click", () => {
 document.getElementById("stroop-pause").classList.remove("active");
 startStroop("incongruent");
 });
 
 // ---- RT Space key handler (Fix 10: with active check) ----
 document.addEventListener("keydown", (e) => {
 if (e.code === "Space" && !e.repeat) {
 if (!rtSection.classList.contains("active")) return;
 e.preventDefault();
 if (rtBall.style.display === "block") {
 const rt = performance.now() - rtStartTime;
 rtResults.push(rt);
 rtBall.style.display = "none";
 if (rtHideTimer) clearTimeout(rtHideTimer);
 rtTrial++;
 if (rtTrial < RT_TRIALS) {
 nextRTTrial();
 } else {
 finishRT();
 }
 }
 }
 });
 
 // ---- "Back to Test Hub" from test-complete overlay ----
 document.getElementById("complete-continue").addEventListener("click", () => {
 document.getElementById("test-complete").classList.remove("active");
 showTestSelection();
 });
});
