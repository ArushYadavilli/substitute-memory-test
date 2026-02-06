// ======== Configuration ========

// Wordsets: each is an array of 12 [leftWord, rightWord] pairs.
// Keep pairs simple and consistent (lowercase, single words) for clean matching.
let digitAnswerTimer = null;
let finalResults = {};
let rtBest = 0; // or average, depending on what you want
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
const DSS_DISPLAY_MS = 1000; // ms per digit
const DSS_GAP_MS = 300; // gap between digits
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

// Study display duration per pair (milliseconds)
const STUDY_MS = 3000;

// Max time allowed to answer each cue during recall (milliseconds)
const ANSWER_TIME_LIMIT = 8000;

// ======== State ========

// Current study week number entered by the user
let weekNumber = null;

// Index of the selected wordset (0, 1, or 2)
let wordsetIndex = 0;

// The active set of word pairs for this session
let pairs = [];

// Which round we’re in (1, 2, or 3)
let currentRound = 0;

// Index of the current pair being shown during study
let studyIdx = 0;

// Timer reference for study phase (so we can clear it later)
let studyTimer = null;

// Index of the current cue being asked during a recall round
let currentCueIndex = 0;

// How many correct answers the user has given in the current round
let currentCorrect = 0;

// Time reference for the 5-second  window during test phase
let answerTimer = null;

//Score variables for each round
let roundOneScore = 0;
let roundTwoScore = 0;
let roundThreeScore = 0;

// ======== Elements ========

// Label at the top showing current phase (Setup, Study, Round, Summary)
let phaseLabelEl;

// Progress bar element
let progressBarEl;

// Sections of the app (only one is visible at a time)
let setupSection;
let studySection;
let roundSection;
let summarySection;

// Input for week number and Start button
let weekInput;
let startBtn;

// Elements showing the left and right words during study
let pairLeftEl;
let pairRightEl;

// Round title (e.g., "Round 1")
let roundTitleEl;

// Container for the current cue + input
let roundListEl;

// Submit button for each cue
let submitRoundBtn;

// Score elements for each round
let scoreR1El;
let scoreR2El;
let scoreR3El;

// ======== Utility Functions ========
// Switches the app to a given phase and updates the UI

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
  digitSubmitBtn.disabled = true;   // PATCH

  digitScoreEl.textContent = `Best: ${dssBest}`;
  dssSequence = generateSequence(dssCurrentLen);

  dssShowing = true;

  displaySequence(dssSequence).then(() => {
    dssShowing = false;
    digitInputEl.disabled = false;
    digitSubmitBtn.disabled = false;  // PATCH
    digitInputEl.focus();
  });
  // Start 5-second response timer
  if (digitAnswerTimer) clearTimeout(digitAnswerTimer);
  digitAnswerTimer = setTimeout(() => {
      submitDigitSpan(); // auto-submit with whatever is typed (even empty)
  }, 5000);

}


function generateSequence(len) {
  const seq = [];
  for (let i=0;i<len;i++) seq.push(Math.floor(Math.random()*9)+1);
  return seq;
}

async function displaySequence(seq) {
  // PATCH: disable submit during display
  digitSubmitBtn.disabled = true;

  digitDisplayEl.textContent = "";
  for (let i = 0; i < seq.length; i++) {
    digitDisplayEl.textContent = seq[i];
    await new Promise(r => setTimeout(r, DSS_DISPLAY_MS));
    digitDisplayEl.textContent = "";
    await new Promise(r => setTimeout(r, DSS_GAP_MS));
  }

  digitDisplayEl.textContent = "NOW";

  // PATCH: re-enable submit after display
  digitSubmitBtn.disabled = false;
}


function submitDigitSpan() {
  if (digitAnswerTimer) clearTimeout(digitAnswerTimer);
  if (dssShowing) return;
  const raw = digitInputEl.value.replace(/\s+/g, "");
  if (!raw) return;
  const user = raw.split("").map(Number).filter(n=>!isNaN(n));
  const correct = [...dssSequence].sort((a,b)=>a-b);
  if (arraysEqual(user, correct)) {
    dssBest = Math.max(dssBest, dssCurrentLen);
    dssTrialCount++;
    dssFailuresAtLen = 0;
    if (dssTrialCount >= DSS_TRIALS_PER_LEN) {
      dssCurrentLen++;
      dssTrialCount = 0;
    }
  } else {
    dssFailuresAtLen++;
    dssTrialCount++;
    if (dssTrialCount >= DSS_TRIALS_PER_LEN) {
      dssTrialCount = 0;
      if (dssFailuresAtLen >= 2) {
        endDigitSpan();
        return;
      } else {
        dssCurrentLen = Math.max(DSS_START_LEN, dssCurrentLen); // keep same length
      }
    }
  }
  if (dssCurrentLen > DSS_MAX_LEN) { endDigitSpan(); return; }
  showDigitSpanTrial();
}

function endDigitSpan() {
    testsRemaining.digitspan = false;
    hideAllSections();
    document.getElementById("test-complete").style.display = "flex";
}

// small helper
function arraysEqual(a,b){ if(a.length!==b.length) return false; for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return false; return true; }

function setPhase(name) {
  phaseLabelEl.textContent =
    name === "setup" ? "Setup" :
    name === "study" ? "Study" :
    name === "round" ? `Round ${currentRound}` :
    name === "summary" ? "Summary" : "";

  setupSection.classList.toggle("active", name === "setup");
  studySection.classList.toggle("active", name === "study");
  roundSection.classList.toggle("active", name === "round");
  summarySection.classList.toggle("active", name === "summary");
  
  testSelectSection.classList.remove("active");
  stroopSection.classList.remove("active");

}

// Keeps the progress bar value safely between 0 and 100
function clampProgress(pct) {
  progressBarEl.style.width = `${Math.max(0, Math.min(100, pct))}%`;
}
// Chooses which wordset to use based on the week number
function selectWordset(weekNum) {
  const idx = ((weekNum % 3) + 3) % 3; // normalize modulo result
  const map = { 1: 0, 2: 1, 0: 2 };    // map remainder to wordset index
  return map[idx];
}

// Randomizes the order of items in an array
function shuffle(arr) {
  const a = arr.slice(); // copy array
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]; // swap
  }
  return a;
}

  
// Cleans up user input for comparison (lowercase + trimmed)
function normalize(s) {
  return (s || "").trim().toLowerCase();
}

function hideAllSections() {
  setupSection.classList.remove("active");
  studySection.classList.remove("active");
  roundSection.classList.remove("active");
  summarySection.classList.remove("active");
  testSelectSection.classList.remove("active");
  stroopSection.classList.remove("active");
  digitSpanSection.classList.remove("active"); // FIX
  rtSection.classList.remove("active"); // ← add this 
  document.getElementById("stroop-pause").style.display = "none"; // ← and this
  document.getElementById("test-complete").style.display = "none";

}


function showTestSelection() {
  hideAllSections();
  testSelectSection.classList.add("active");

  btnMemory.style.display = testsRemaining.memory ? "block" : "none";
  btnStroop.style.display = testsRemaining.stroop ? "block" : "none";
  btnDigitSpan.style.display = testsRemaining.digitspan ? "block" : "none";
  btnRT.style.display = testsRemaining.rt ? "block" : "none";

  if (!testsRemaining.memory && !testsRemaining.stroop && !testsRemaining.digitspan && !testsRemaining.rt) {
    showSummary();
  } 
}


// ======== Study Phase ========

// Begins the study phase: shuffle pairs, show them one by one
function startStudy() {
  setPhase("study");
  studyIdx = 0;
  pairs = shuffle(pairs); // randomize order each study round
  clampProgress(0);
  renderStudyPair();
  studyTimer = setInterval(nextStudyPair, STUDY_MS);
}

// Shows the current pair during study and updates progress
function renderStudyPair() {
  const [L, R] = pairs[studyIdx];
  pairLeftEl.textContent = L;
  pairRightEl.textContent = R;
  const pct = (studyIdx / pairs.length) * 100;
  clampProgress(pct);
}

// Advances to the next pair during study, or moves into Round 1 if finished
function nextStudyPair() {
  studyIdx++;
  if (studyIdx >= pairs.length) {
    clearInterval(studyTimer);
    clampProgress(100);
    startRound(1); // move into first recall round
    return;
  }
  renderStudyPair();
}

// ======== Round Phase ========

// Begins a recall round (Round 1, 2, or 3)
function startRound(n) {
  currentRound = n;
  currentCorrect = 0;
  setPhase("round");
  roundTitleEl.textContent = `Round ${n}`;

  // Shuffle the order of cues for this round
  currentOrder = shuffle(pairs.map((_, i) => i));
  currentCueIndex = 0;

  // Show the first cue
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

// Shows the next cue in the current round
function showNextCue() {
  roundListEl.innerHTML = "";

  // If we've gone through all cues in this round
  if (currentCueIndex >= currentOrder.length) {
    // Save score for this round
    if (currentRound === 1) roundOneScore = currentCorrect;
    if (currentRound === 2) roundTwoScore = currentCorrect;
    if (currentRound === 3) roundThreeScore = currentCorrect;

    // Move to next study/round or summary
    if (currentRound < 3) {
      startStudyAgainThenRound(currentRound + 1);
    } else {
      testsRemaining.memory = false; // optional here, but safe 
      hideAllSections(); 
      document.getElementById("test-complete").style.display = "flex";
    }
    return;
  }

  // Get the current cue (always left word) and target (right word)
  const idx = currentOrder[currentCueIndex];
  const cue = pairs[idx][0];
  const target = pairs[idx][1];

  // Build UI for this cue
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

  // Start 5-second auto-advance timer
  if (answerTimer) clearTimeout(answerTimer);
  answerTimer = setTimeout(() => {
    currentCueIndex++;
    showNextCue();
  }, ANSWER_TIME_LIMIT);

  // Submit button logic
  submitRoundBtn.onclick = () => {
    clearTimeout(answerTimer);
    const val = normalize(inputEl.value);
    if (val === normalize(target)) {
      currentCorrect++;
    }
    currentCueIndex++;
    showNextCue();
  };
};

// Repeats the study phase before moving into the next round
function startStudyAgainThenRound(nextRoundNum) {
  setPhase("study");
  studyIdx = 0;
  pairs = shuffle(pairs); // randomize order again
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
        document.getElementById("stroop-pause").style.display = "flex";
    } else {
        testsRemaining.stroop = false;
        hideAllSections();
        document.getElementById("test-complete").style.display = "flex";
    }
}

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
  const delay = 3000 + Math.random() * 500;
  setTimeout(showRTBall, delay);
}

function showRTBall() {
  rtBall.style.left = "50%";
  rtBall.style.top = "50%";
  rtBall.style.transform = "translate(-50%, -50%)";
  rtBall.style.display = "block";

  rtStartTime = performance.now();
}


function finishRT() {
  // compute average RT
  let sum = rtResults.reduce((a, b) => a + b, 0);
  rtBest = Math.round(sum / rtResults.length);

  // show result in RT section
  rtResultsEl.innerHTML = `Average RT: ${rtBest} ms`;

  // mark test complete
  testsRemaining.rt = false;

  // update summary page score
  const rtSummaryEl = document.getElementById("score-rt");
  if (rtSummaryEl) {
    rtSummaryEl.textContent = rtBest + " ms";
  }

  hideAllSections();
  document.getElementById("test-complete").style.display = "flex";
}


// ======== Summary Phase ========

// Displays the scores after all three rounds
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
  submitToGoogleForms();
}
// ======== Bootstrapping / Event Listeners ========

document.addEventListener("DOMContentLoaded", () => {
  // Cache references to DOM elements
  phaseLabelEl = document.getElementById("phase-label");
  progressBarEl = document.getElementById("progress-bar");
  
  setupSection = document.getElementById("setup-section");
  studySection = document.getElementById("study-section");
  roundSection = document.getElementById("round-section");
  summarySection = document.getElementById("summary-section");

  weekInput = document.getElementById("week-input");
  participantIdInput = document.getElementById("participant-id");
  startBtn = document.getElementById("start-btn");

  pairLeftEl = document.getElementById("pair-left");
  pairRightEl = document.getElementById("pair-right");

  roundTitleEl = document.getElementById("round-title");
  roundListEl = document.getElementById("round-list");
  submitRoundBtn = document.getElementById("submit-round-btn");

  digitSpanSection = document.getElementById("digitspan-section");
  btnDigitSpan = document.getElementById("btn-digitspan");
  digitDisplayEl = document.getElementById("digitspan-display");
  digitInputEl = document.getElementById("digitspan-input");
  digitSubmitBtn = document.getElementById("digitspan-submit");
  digitTimerEl = document.getElementById("digitspan-timer");
  digitScoreEl = document.getElementById("digitspan-score");
  scoreDigitSpanEl = document.getElementById("score-digitspan"); // add to summary HTML


  
  scoreR1El = document.getElementById("score-r1");
  scoreR2El = document.getElementById("score-r2");
  scoreR3El = document.getElementById("score-r3");
  testSelectSection = document.getElementById("test-select-section");
  btnMemory = document.getElementById("btn-memory");
  btnStroop = document.getElementById("btn-stroop");
  
  stroopSection = document.getElementById("stroop-section");
  stroopWordEl = document.getElementById("stroop-word");
  stroopTimerEl = document.getElementById("stroop-timer");
  stroopScoreDisplayEl = document.getElementById("stroop-score-display");
  
  scoreStroopCongEl = document.getElementById("score-stroop-cong");
  scoreStroopIncongEl = document.getElementById("score-stroop-incong");

  rtSection = document.getElementById("rt-section");
  rtBall = document.getElementById("rt-ball");
  rtArea = document.getElementById("rt-area");
  rtResultsEl = document.getElementById("rt-results");
  btnRT = document.getElementById("btn-rt");
  
    // Start button listener
  startBtn.addEventListener("click", () => {
    const participantId = participantIdInput.value.trim();
    const val = parseInt(weekInput.value, 10);

    if (!/^\d+$/.test(participantId)) {
      alert("Participant ID must be numbers only");
      return;
    }
    if ( (!val || val < 1) || (val > 3) ) {
      alert("Please enter a valid week number (>=1).");
      return;
    }

    const week = val;  // reuse val, no redeclaration

    const lockKey = `completed_${participantId}_week_${week}`;
    if (localStorage.getItem(lockKey)) {
      alert("You have already completed this week's tests.");
      return;
    }

    weekNumber = val;
    wordsetIndex = selectWordset(weekNumber);

    // Build pairs from the chosen wordset
    pairs = WORDSETS[wordsetIndex].map(([L, R]) => [L, R]);

    // Begin test hub
    showTestSelection();
});



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
  btnMemory.addEventListener("click", startStudy);
  btnStroop.addEventListener("click", () => startStroop("congruent"));
  btnDigitSpan.addEventListener("click", startDigitSpan);
  digitSubmitBtn.addEventListener("click", submitDigitSpan);
  digitInputEl && digitInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitDigitSpan();
  });
  document.getElementById("stroop-continue").addEventListener("click", () => {
  document.getElementById("stroop-pause").style.display = "none";
  startStroop("incongruent");
  });
  btnRT.addEventListener("click", startRT);
  document.addEventListener("keydown", (e) => {
    if (rtBall.style.display === "block" && e.code === "Space") {
      const rt = performance.now() - rtStartTime;
      rtResults.push(rt);
      rtBall.style.display = "none";
  
      rtTrial++;
      if (rtTrial < RT_TRIALS) {
        nextRTTrial();
      } else {
        finishRT();
      }
    }
  });
  document.getElementById("complete-continue").addEventListener("click", () => {
    document.getElementById("test-complete").style.display = "none";
    showTestSelection();
  });

});
