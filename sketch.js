// 設定六個幼兒生活情境，以及和情境配對的文字答案。
const quizItems = [
  { icon: "🧼", answer: "吃東西前要洗手", color: "#d8f2e6" },
  { icon: "🪥", answer: "早晚都要刷牙", color: "#fff0c9" },
  { icon: "🚦", answer: "過馬路要牽大人", color: "#ffe1dc" },
  { icon: "🚗", answer: "坐車要繫安全帶", color: "#dcecff" },
  { icon: "🗑️", answer: "垃圾要丟進垃圾桶", color: "#e8e2ff" },
  { icon: "🛏️", answer: "晚上要早點睡覺", color: "#ffdfed" }
];

// 保存配對、拖曳、成績與彩帶動畫所需的狀態。
let placedAnswers = Array(quizItems.length).fill(null);
let draggingAnswer = null;
let dragPosition = { x: 0, y: 0 };
let resultVisible = false;
let finalScore = 0;
let confettiPieces = [];
let canvasFont = "'Noto Sans TC', 'Microsoft JhengHei', sans-serif";

// 建立符合視窗大小的畫布，並使用觸控友善的游標設定。
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  textFont(canvasFont);
  textAlign(CENTER, CENTER);
  noStroke();
}

// 每一影格重繪背景、題目、選項與目前的互動狀態。
function draw() {
  drawBackground();
  const board = calculateLayout();
  drawHeader(board);
  drawQuestion(board);
  drawPictureCards(board);
  drawAnswerCards(board);
  drawSubmitButton(board);

  // 拖曳中的答案保持在游標上方，方便觸控時辨識。
  if (draggingAnswer !== null && !resultVisible) {
    drawFloatingAnswer(draggingAnswer, dragPosition.x, dragPosition.y);
  }

  // 成績畫面蓋在題目上方，答對率達標時持續播放彩帶。
  if (resultVisible) {
    if (finalScore >= 80) drawConfetti();
    drawResultDialog();
  }
}

// 依照裝置寬度與高度安排圖卡，讓手機與桌面都能完整顯示。
function calculateLayout() {
  const compact = width < 680;
  const margin = compact ? 16 : 32;
  const pictureColumns = width >= 1120 ? 6 : 3;
  const pictureRows = Math.ceil(quizItems.length / pictureColumns);
  const pictureGap = compact ? 10 : 16;
  const pictureTop = compact ? 142 : 160;
  const pictureBottom = Math.min(height * 0.57, height - 300);
  const pictureWidth = (width - margin * 2 - pictureGap * (pictureColumns - 1)) / pictureColumns;
  const pictureHeight = Math.min(
    compact ? 132 : 200,
    Math.max(compact ? 64 : 96, (height - 300) / (compact ? 3.4 : 3))
  );
  const answerColumns = compact && height >= 680 ? 2 : 3;
  const answerRows = Math.ceil(quizItems.length / answerColumns);
  const answerGap = compact ? 10 : 12;
  const answerTop = pictureTop + pictureRows * pictureHeight + pictureGap * (pictureRows - 1) + (compact ? 24 : 30);
  const answerWidth = (width - margin * 2 - answerGap * (answerColumns - 1)) / answerColumns;
  const availableAnswerHeight = (height - 60 - 12 - answerTop - answerGap * (answerRows - 1)) / answerRows;
  const answerHeight = Math.min(compact ? 88 : 110, Math.max(compact ? 36 : 54, availableAnswerHeight));

  // 將每張情境圖卡的位置整理成可供繪圖與拖放共用的資料。
  const pictureCards = quizItems.map((item, index) => {
    const column = index % pictureColumns;
    const row = Math.floor(index / pictureColumns);
    return {
      x: margin + column * (pictureWidth + pictureGap),
      y: pictureTop + row * (pictureHeight + pictureGap),
      w: pictureWidth,
      h: pictureHeight,
      index
    };
  });

  // 將六個文字選項排成適合閱讀及觸控的網格。
  const answerCards = quizItems.map((item, index) => {
    const column = index % answerColumns;
    const row = Math.floor(index / answerColumns);
    return {
      x: margin + column * (answerWidth + answerGap),
      y: answerTop + row * (answerHeight + answerGap),
      w: answerWidth,
      h: answerHeight,
      index
    };
  });

  // 回傳所有版面區域，避免繪圖與滑鼠判定使用不同座標。
  return {
    compact,
    margin,
    pictureCards,
    answerCards,
    questionY: compact ? 106 : 112,
    answerHeadingY: answerTop - 22,
    submit: { x: width / 2 - (compact ? 112 : 128), y: height - 60, w: compact ? 224 : 256, h: 48 }
  };
}

// 畫出暖色系底紋與角落裝飾，維持內容清楚且有童趣。
function drawBackground() {
  background("#fffaf1");
  noStroke();
  fill("#f4e8d8");
  circle(width - 34, 32, 110);
  fill("#e4f2e8");
  circle(24, height - 18, 105);
  fill("#fff0c9");
  circle(width - 14, height - 10, 72);
}

// 繪製標題、分數提示與目前已完成的配對數。
function drawHeader(board) {
  fill("#263b36");
  textAlign(LEFT, CENTER);
  textSize(board.compact ? 21 : 27);
  text("生活小高手", board.margin, 38);

  fill("#73817a");
  textAlign(RIGHT, CENTER);
  textSize(board.compact ? 12 : 14);
  const completed = placedAnswers.filter((answer) => answer !== null).length;
  text(`${completed} / ${quizItems.length} 已配對`, width - board.margin, 39);
  textAlign(CENTER, CENTER);
}

// 繪製簡短題目與操作提示，提醒孩子把文字配到正確圖片。
function drawQuestion(board) {
  fill("#41534c");
  textSize(board.compact ? 15 : 18);
  text("幫生活小習慣找到正確的圖片！", width / 2, board.questionY);
  fill("#879189");
  textSize(board.compact ? 11 : 12);
  text("拖曳下方文字，放到上方最適合的情境", width / 2, board.questionY + 23);
}

// 畫出六張固定情境圖卡，並讓圖示以輕微浮動動畫呈現。
function drawPictureCards(board) {
  board.pictureCards.forEach((card, index) => {
    const item = quizItems[index];
    const answer = placedAnswers[index];
    const bob = Math.sin(frameCount * 0.045 + index * 1.1) * 3;
    const isMatched = answer === index;

    // 繪製圖卡底色與配對完成時的外框。
    fill("#ffffff");
    rect(card.x, card.y, card.w, card.h, 16);
    fill(item.color);
    rect(card.x + 5, card.y + 5, card.w - 10, card.h - 10, 12);
    if (isMatched) {
      noFill();
      stroke("#4f9d75");
      strokeWeight(3);
      rect(card.x, card.y, card.w, card.h, 16);
      noStroke();
    }

    // 繪製編號與放大動畫表情，作為圖像式情境提示。
    fill("#ffffff");
    circle(card.x + 22, card.y + 21, 25);
    fill("#63726b");
    textSize(11);
    text(String.fromCharCode(65 + index), card.x + 22, card.y + 21);
    textSize(Math.min(board.compact ? 62 : 78, card.w * 0.52, card.h * 0.55));
    text(item.icon, card.x + card.w / 2, card.y + card.h * 0.53 + bob);

    // 顯示已放入的文字答案，未配對時保留乾淨的圖片區。
    if (answer !== null) {
      fill(isMatched ? "#337755" : "#a35a50");
      textSize(Math.min(12, card.w * 0.11));
      text(isMatched ? "配對成功" : "再想一想", card.x + card.w / 2, card.y + card.h - 18);
    }
  });
}

// 繪製可拖曳文字選項，已使用的選項仍會保留在原位方便修改。
function drawAnswerCards(board) {
  fill("#52665d");
  textSize(board.compact ? 17 : 20);
  text("選一張生活小提醒", width / 2, board.answerHeadingY);

  board.answerCards.forEach((card, index) => {
    const isUsed = placedAnswers.includes(index);
    const isBeingDragged = draggingAnswer === index;

    // 以不同底色區分可選答案與已經放置的答案。
    fill(isUsed ? "#e6eee8" : "#ffffff");
    rect(card.x, card.y, card.w, card.h, 13);
    fill(isUsed ? "#f4f7f4" : "#fff1cc");
    rect(card.x + 4, card.y + 4, card.w - 8, card.h - 8, 10);
    if (isBeingDragged) {
      noFill();
      stroke("#65977b");
      strokeWeight(2);
      rect(card.x, card.y, card.w, card.h, 13);
      noStroke();
    }

    // 用勾勾標記已使用選項，文字過長時自動縮小以避免溢出。
    fill("#394a42");
    const labelSize = card.h < 48 ? 14 : board.compact ? 18 : 21;
    textSize(labelSize);
    text(quizItems[index].answer, card.x + 7, card.y + 4, card.w - 14, card.h - 8);
    if (isUsed) {
      fill("#4f9d75");
      circle(card.x + card.w - 10, card.y + 10, 15);
      fill("#ffffff");
      textSize(9);
      text("✓", card.x + card.w - 10, card.y + 10);
    }
  });
}

// 繪製交卷按鈕，六題尚未完成時提供明確的禁用狀態。
function drawSubmitButton(board) {
  const complete = placedAnswers.every((answer) => answer !== null);
  const button = board.submit;
  fill(complete ? "#3d8260" : "#c7d0ca");
  rect(button.x, button.y, button.w, button.h, 24);
  fill("#ffffff");
  textSize(15);
  text(complete ? "交卷看成績" : "完成六題後即可交卷", width / 2, button.y + button.h / 2);
}

// 繪製跟隨指標移動的文字卡，讓拖曳目標更容易辨認。
function drawFloatingAnswer(answerIndex, x, y) {
  const cardWidth = Math.min(width * 0.9, 420);
  const cardHeight = 76;
  fill("#314b3d");
  rect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 14);
  fill("#ffffff");
  textSize(19);
  text(quizItems[answerIndex].answer, x - cardWidth / 2 + 12, y - cardHeight / 2 + 8, cardWidth - 24, cardHeight - 16);
}

// 依照拖曳卡片落點配對；若放到另一張卡，會取代該位置的舊答案。
function mouseReleased() {
  if (draggingAnswer === null || resultVisible) return;
  const board = calculateLayout();
  const target = board.pictureCards.find((card) => isInside(mouseX, mouseY, card));
  const sourceAnswer = draggingAnswer;

  // 只有落在圖片卡上才建立配對，並移除同一答案之前的位置。
  if (target) {
    placedAnswers = placedAnswers.map((answer) => answer === sourceAnswer ? null : answer);
    placedAnswers[target.index] = sourceAnswer;
  }
  draggingAnswer = null;
}

// 從文字卡或已配對圖片開始拖曳，支援把錯誤配對移回答案區。
function mousePressed() {
  if (resultVisible) {
    if (isInside(mouseX, mouseY, resultButtons().restart)) resetQuiz();
    return false;
  }

  const board = calculateLayout();
  if (isInside(mouseX, mouseY, board.submit)) {
    submitQuiz();
    return false;
  }

  // 先檢查答案區，再檢查已放置的圖卡，避免重疊操作被誤判。
  const answerCard = board.answerCards.find((card) => isInside(mouseX, mouseY, card));
  if (answerCard) {
    draggingAnswer = answerCard.index;
    dragPosition = { x: mouseX, y: mouseY };
    return false;
  }

  const pictureCard = board.pictureCards.find((card) => isInside(mouseX, mouseY, card));
  if (pictureCard && placedAnswers[pictureCard.index] !== null) {
    draggingAnswer = placedAnswers[pictureCard.index];
    placedAnswers[pictureCard.index] = null;
    dragPosition = { x: mouseX, y: mouseY };
    return false;
  }
  return false;
}

// 更新拖曳卡片的位置，讓滑鼠與觸控操作使用相同的互動流程。
function mouseDragged() {
  if (draggingAnswer !== null) dragPosition = { x: mouseX, y: mouseY };
  return false;
}

// 判斷游標座標是否落在指定的矩形範圍內。
function isInside(x, y, rectangle) {
  return x >= rectangle.x && x <= rectangle.x + rectangle.w && y >= rectangle.y && y <= rectangle.y + rectangle.h;
}

// 只有六個位置都完成後才計算答對率並顯示成績。
function submitQuiz() {
  if (!placedAnswers.every((answer) => answer !== null)) return;
  const correctAnswers = placedAnswers.filter((answer, index) => answer === index).length;
  finalScore = Math.round((correctAnswers / quizItems.length) * 100);
  resultVisible = true;

  // 答對率超過百分之八十時，建立彩帶粒子並開始慶祝動畫。
  if (finalScore > 80) {
    confettiPieces = Array.from({ length: 130 }, () => ({
      x: random(width),
      y: random(-height, 0),
      speed: random(2, 6),
      drift: random(-1.4, 1.4),
      size: random(5, 10),
      color: random(["#ec6f5c", "#f4bd45", "#5ba77b", "#5999d0", "#b27ec8"]),
      angle: random(TWO_PI)
    }));
  }
}

// 在成績畫面上方繪製持續飄落並旋轉的彩帶粒子。
function drawConfetti() {
  confettiPieces.forEach((piece) => {
    piece.y += piece.speed;
    piece.x += piece.drift + Math.sin(frameCount * 0.04 + piece.angle) * 0.8;
    piece.angle += 0.08;
    if (piece.y > height + 12) {
      piece.y = random(-80, -12);
      piece.x = random(width);
    }
    push();
    translate(piece.x, piece.y);
    rotate(piece.angle);
    fill(piece.color);
    rect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 1.8, 2);
    pop();
  });
}

// 繪製成績彈窗、鼓勵訊息與重新挑戰按鈕。
function drawResultDialog() {
  fill(38, 54, 46, 120);
  rect(0, 0, width, height);
  const dialogWidth = Math.min(width - 36, 390);
  const dialogHeight = 290;
  const dialogX = (width - dialogWidth) / 2;
  const dialogY = (height - dialogHeight) / 2;

  // 使用淺色彈窗承載成績，不遮住彩帶與背景動畫。
  fill("#fffdf8");
  rect(dialogX, dialogY, dialogWidth, dialogHeight, 22);
  fill(finalScore > 80 ? "#3d8260" : "#40564a");
  textSize(20);
  text(finalScore > 80 ? "太棒了！生活小高手" : "完成挑戰！", width / 2, dialogY + 52);
  fill("#263b36");
  textSize(58);
  text(`${finalScore}%`, width / 2, dialogY + 126);
  fill("#728078");
  textSize(14);
  text(`${placedAnswers.filter((answer, index) => answer === index).length} 題答對，共 ${quizItems.length} 題`, width / 2, dialogY + 174);
  text(finalScore > 80 ? "你真是生活小達人！" : "再玩一次，會記得更多生活好習慣！", width / 2, dialogY + 202);

  // 提供重新挑戰的按鈕，讓孩子可以立刻再玩一輪。
  const restart = resultButtons().restart;
  fill("#3d8260");
  rect(restart.x, restart.y, restart.w, restart.h, 20);
  fill("#ffffff");
  textSize(14);
  text("再玩一次", width / 2, restart.y + restart.h / 2);
}

// 回傳成績視窗按鈕的位置，供繪圖和點擊共用。
function resultButtons() {
  const buttonWidth = 150;
  const buttonHeight = 42;
  return {
    restart: {
      x: width / 2 - buttonWidth / 2,
      y: height / 2 + 82,
      w: buttonWidth,
      h: buttonHeight
    }
  };
}

// 清除配對與成績，重新開始六題測驗。
function resetQuiz() {
  placedAnswers = Array(quizItems.length).fill(null);
  draggingAnswer = null;
  resultVisible = false;
  finalScore = 0;
  confettiPieces = [];
}

// 視窗尺寸改變時同步調整畫布，重新計算後續互動座標。
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
