// DOM
const elevator = document.getElementById("elevator");
const actionButton = document.getElementById("action-button");
const resultDiv = document.getElementById("result");
const timerDisplay = document.getElementById("timer");
const difficultySelect = document.getElementById("difficulty");
const dangerLabel = document.getElementById("danger-label");
const nameEntry = document.getElementById("name-entry");
const playerNameInput = document.getElementById("player-name");
const submitScoreBtn = document.getElementById("submit-score");
const tickSound = document.getElementById("tick-sound");
const alertSound = document.getElementById("alert-sound");
const crashSound = document.getElementById("crash-sound");
const crashFlash = document.getElementById("crash-flash");
const resetButton = document.getElementById("reset-button");

// ★ building の高さをリアルタイム取得
function getBuildingHeight() {
  return document.getElementById("building").getBoundingClientRect().height;
}

// 基本設定
const floorCount = 7;
function getElevatorHeight() {
  return getBuildingHeight() / floorCount;
}
const initialTop = 150;

let elevatorTop = initialTop;
let falling = false;
let startTime = 0;
let maxTime = 3;
let timeRemaining = 0;
let tickInterval = null;
let rafId = null;
let gameState = "ready";

// ストップボタン一度だけ
let stopPressedOnce = false;

// UIテキスト
const TXT = {
  remaining: "残り時間:",
  easy: "イージー",
  normal: "ノーマル",
  hard: "ハード",
  ranking: "ランキング",
  noRecords: "記録がありません",
  ground: "地上",
  gameover: "GAME OVER…",
  failStop: "停止できませんでした",
  stoppedAt: (floor, dist) => `停止しました（残り ${dist}m）`,
  defaultName: "プレイヤー"
};

// ボタン類
function setButtonImageStart() {
  actionButton.innerHTML = `<img src="../img/start-bt.png" class="btn-img" alt="start">`;
  actionButton.disabled = false;
}
function setButtonImageStop() {
  actionButton.innerHTML = `<img src="../img/stop-bt.png" class="btn-img" alt="stop">`;
  actionButton.disabled = false;
}
function showResetButton() {
  resetButton.classList.add("visible");
  resetButton.classList.add("reset");
}
function hideResetButton() {
  resetButton.classList.remove("visible");
}

// タイマー
function updateTimerDisplay() {
  timerDisplay.style.display = "block";
  timerDisplay.textContent = `${TXT.remaining} ${Math.max(0, timeRemaining.toFixed(1))}s`;
}

// チクタク音
function startTicking(rate) {
  stopTicking();
  if (!tickSound) return;
  tickInterval = setInterval(() => {
    tickSound.currentTime = 0;
    tickSound.play().catch(()=>{});
  }, 1000 / rate);
}
function stopTicking() {
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = null;
}

// 難易度
function applyDifficulty(value) {
  switch(value) {
    case "Easy": maxTime = 4.5; break;
    case "Normal": maxTime = 3; break;
    case "Hard": maxTime = 1.5; break;
    default: maxTime = 3;
  }
}
applyDifficulty(difficultySelect.value || "Normal");

// 落下開始
function startFall() {
  if (falling) return;
  falling = true;
  gameState = "running";
  setButtonImageStop();
  hideResetButton();

  stopPressedOnce = false;

  elevatorTop = initialTop;
  elevator.style.top = elevatorTop + "px";

  startTime = performance.now();
  timeRemaining = maxTime;
  updateTimerDisplay();

  const diff = difficultySelect.value;
  startTicking(diff === "Easy" ? 1 : diff === "Normal" ? 2 : 3);

  function step(now) {
    if (!falling) return;

    const buildingHeight = getBuildingHeight();
    const elevatorHeight = getElevatorHeight();
    const bottomLimit = buildingHeight - elevatorHeight;

    const elapsed = (now - startTime) / 1000;
    const progress = Math.min(elapsed / maxTime, 1);

    elevatorTop = Math.round(initialTop + progress * (bottomLimit - initialTop));
    elevator.style.top = elevatorTop + "px";

    timeRemaining = Math.max(0, maxTime - elapsed);
    updateTimerDisplay();

    const distanceToGround = Math.round(buildingHeight - (elevatorTop + elevatorHeight));
    const dangerZone = Math.max(80, Math.round(buildingHeight * 0.15));

    if (distanceToGround <= dangerZone) {
      if (dangerLabel.style.display !== "block") {
        try { alertSound.currentTime = 0; alertSound.play(); } catch(e){}
      }
      dangerLabel.style.display = "block";
    } else {
      dangerLabel.style.display = "none";
    }

    if (progress >= 1) {
      falling = false;
      stopTicking();
      stopElevator(true);
      showResetButton();
      actionButton.disabled = true;
      return;
    }

    rafId = requestAnimationFrame(step);
  }
  rafId = requestAnimationFrame(step);
}

// 停止（★階を+1）
function stopElevator(crashed = false) {
  falling = false;
  stopTicking();
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

  const buildingHeight = getBuildingHeight();
  const elevatorHeight = getElevatorHeight();

  const distancePx = Math.max(0, Math.round(buildingHeight - (elevatorTop + elevatorHeight)));
  const usableHeight = buildingHeight - elevatorHeight;
  const frac = usableHeight > 0 ? (distancePx / usableHeight) : 0;

  let floor = Math.ceil(frac * floorCount);
  floor = Math.max(1, Math.min(floor, floorCount));
  floor = floor + 1;  // ←★ 追加（階を1つ上に補正）

  if (crashed) {
    try { crashSound.currentTime = 0; crashSound.play(); } catch(e){}
    if (crashFlash) {
      crashFlash.style.opacity = 1;
      setTimeout(()=>{ crashFlash.style.opacity = 0; }, 300);
    }

    resultDiv.innerHTML = `<p>${TXT.gameover} ${TXT.failStop}</p>`;
    const scores = updateLeaderboard(null, null);
    resultDiv.innerHTML += renderLeaderboard(scores);

    actionButton.disabled = true;
    stopPressedOnce = true;

  } else {
    const text = TXT.stoppedAt(floor, distancePx);
    resultDiv.innerHTML = `<p>${escapeHtml(text)}</p>`;
    nameEntry.classList.add("active");
    playerNameInput.focus();
    actionButton.disabled = false;
    stopPressedOnce = false;
  }

  dangerLabel.style.display = "none";
}

// リセット
function resetGame() {
  elevatorTop = initialTop;
  elevator.style.top = elevatorTop + "px";

  resultDiv.textContent = "";
  nameEntry.classList.remove("active");
  dangerLabel.style.display = "none";

  if (crashFlash) crashFlash.style.opacity = 0;

  setButtonImageStart();
  gameState = "ready";
  timeRemaining = maxTime;

  hideResetButton();

  actionButton.disabled = false;
  stopPressedOnce = false;
}

// ランキング
function updateLeaderboard(name, distance) {
  const key = `elevatorScores_${difficultySelect.value}`;
  const scores = JSON.parse(localStorage.getItem(key) || "[]");

  if (name && typeof distance === "number") {
    scores.push({ name, distance, when: Date.now() });
  }

  const filtered = scores.filter(s => s && s.name && typeof s.distance === "number");
  filtered.sort((a,b) => a.distance - b.distance);
  const top = filtered.slice(0,5);
  localStorage.setItem(key, JSON.stringify(top));
  return top;
}
function renderLeaderboard(scores) {
  if (!scores || scores.length === 0) {
    return `<div class="leaderboard"><div class="leaderboard-title">${TXT.ranking}</div><div class="no-scores">${TXT.noRecords}</div></div>`;
  }
  const items = scores.map((s,i) => {
    const rankClass = i===0 ? "gold" : i===1 ? "silver" : i===2 ? "bronze" : "";
    return `<div class="leaderboard-entry">
      <span class="rank ${rankClass}">${i+1}.</span>
      <span class="name">${escapeHtml(s.name)}</span>
      <span class="score">(${s.distance}m)</span>
    </div>`;
  }).join("");
  return `<div class="leaderboard"><div class="leaderboard-title">${TXT.ranking}</div>${items}</div>`;
}

// ボタン
actionButton.addEventListener("click", () => {
  if (actionButton.disabled) return;

  if (gameState === "ready") {
    applyDifficulty(difficultySelect.value);
    startFall();
  } else if (gameState === "running") {
    if (!stopPressedOnce) {
      stopElevator(false);
      showResetButton();
      stopPressedOnce = true;
    }
  } else if (gameState === "stopped") {
    resetGame();
  }
});

difficultySelect.addEventListener("change", (e) => {
  applyDifficulty(e.target.value);
  timeRemaining = maxTime;
  updateTimerDisplay();
  resultDiv.textContent = "";
});

// 名前送信
submitScoreBtn.addEventListener("click", () => {
  const name = (playerNameInput.value || TXT.defaultName).trim();

  const buildingHeight = getBuildingHeight();
  const elevatorHeight = getElevatorHeight();

  const distancePx = Math.max(0, Math.round(buildingHeight - (elevatorTop + elevatorHeight)));
  const scores = updateLeaderboard(name, distancePx);

  resultDiv.innerHTML =
    `<p>${TXT.stoppedAt(calcFloor(elevatorTop), distancePx)}</p>` +
    renderLeaderboard(scores);

  nameEntry.classList.remove("active");
  playerNameInput.value = "";
});

// Enter送信
playerNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submitScoreBtn.click();
  }
});

// Reset
resetButton.addEventListener("click", resetGame);

// 階数計算（★返り値+1）
function calcFloor(topPx) {
  const buildingHeight = getBuildingHeight();
  const elevatorHeight = getElevatorHeight();

  const distancePx = Math.max(0, Math.round(buildingHeight - (topPx + elevatorHeight)));
  const usableHeight = buildingHeight - elevatorHeight;

  let floor = Math.ceil((distancePx / usableHeight) * floorCount);
  floor = Math.max(1, Math.min(floor, floorCount));
  return floor + 1;   // ←★ 追加
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 初期化
resetGame();
