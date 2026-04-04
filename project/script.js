// board
let board;
let boardWidth = 1000;
let boardHeight = 400;
let context;
let terrainImg;
let bgX = 0;

// perso
let persoWidth = 88;
let persoHeight = 94;
let persoX = 50;
let persoY = boardHeight - persoHeight;
let persoRunImg1, persoRunImg2, persoJumpImg, persoDiveImg;
let runFrame = 0;
let runTimer = 0;

let perso = {
    x: persoX,
    y: persoY,
    width: persoWidth,
    height: persoHeight
}

// états du perso
let isSauting = false;
let isPlonging = false;
let plongeTimer = 0;

// rugbyman
let rmArray = [];
let rm1Width = 70;
let rmHeight = 100;
let rmX = boardWidth;
let rmY = boardHeight - rmHeight;
let rm1Img;

// ballon
let ballonArray = [];
let ballonWidth = 60;
let ballonHeight = 40;
let ballonImg;

// physics
let velocityX = -8;
let velocityY = 0;
let gravity = .4;
let gameOver = false;
let score = 0;
let obstacleInterval = null;
let animationId = null; // ✅ pour stopper requestAnimationFrame

function startGame(niveau) {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    terrainImg = new Image(); terrainImg.src = "StadeBG.png";
    persoRunImg1 = new Image(); persoRunImg1.src = "runingPlayer1.png";
    persoRunImg2 = new Image(); persoRunImg2.src = "runingPlayer2.png";
    persoJumpImg = new Image(); persoJumpImg.src = "JumpingPlayer.png";
    persoDiveImg = new Image(); persoDiveImg.src = "DivingPlayer.png";
    ballonImg = new Image(); ballonImg.src = "rugbyBall.png";

    let v = parseFloat(localStorage.getItem('velocite')) || -5;
    velocityX = v;
    rm1Img = new Image();
    if (v === -5)      rm1Img.src = "CastreRB.png";
    else if (v === -8) rm1Img.src = "LarochelleRM.png";
    else               rm1Img.src = "BordeauBG.png";

    resetGame();
    if (obstacleInterval) { clearTimeout(obstacleInterval); }
    if (animationId) { cancelAnimationFrame(animationId); }

    if (niveau === 1) startLevel1();
    else if (niveau === 2) startLevel2();
    else if (niveau === 3) startLevel3();

    document.addEventListener("keydown", handleKey);
    animationId = requestAnimationFrame(update);
}

function startLevel1() { scheduleObstacle(placeRm); }
function startLevel2() { scheduleObstacle(placeBallon); }
function startLevel3() { scheduleObstacle(placeMix); }

function resetGame() {
    gameOver = false;
    score = 0;
    rmArray = [];
    ballonArray = [];
    perso.y = persoY;
    velocityY = 0;
    isSauting = false;
    isPlonging = false;
    plongeTimer = 0;
    runFrame = 0;
    runTimer = 0;
    bgX = 0;
}

function handleKey(e) {
    if (gameOver) {
        if (e.code === "Escape") {
            e.preventDefault();
            clearTimeout(obstacleInterval);
            cancelAnimationFrame(animationId);
            document.removeEventListener("keydown", handleKey);
            window.location.href = "menu.html";
        }
        return;
    }

    if (e.code === "ArrowUp" && !isSauting && perso.y === persoY) {
        isSauting = true;
        isPlonging = false;
        velocityY = -12;
    }

    if (e.code === "ArrowDown" && !isPlonging && perso.y === persoY) {
        isPlonging = true;
        isSauting = false;
    }
}

document.addEventListener("keyup", function(e) {
    if (e.code === "ArrowDown") { isPlonging = false; }
});

function update() {
    animationId = requestAnimationFrame(update);

    if (gameOver) {
        context.fillStyle = "rgba(0,0,0,0.5)";
        context.fillRect(0, 0, boardWidth, boardHeight);
        context.fillStyle = "red";
        context.font = "40px courier";
        context.fillText("GAME OVER", boardWidth / 2 - 100, boardHeight / 2);
        context.fillStyle = "white";
        context.font = "20px courier";
        context.fillText("Score : " + Math.floor(score / 10), boardWidth / 2 - 70, boardHeight / 2 + 40);
        context.fillStyle = "yellow";
        context.font = "16px courier";
        context.fillText("ECHAP pour revenir au menu", boardWidth / 2 - 120, boardHeight / 2 + 75);
        return;
    }

    context.clearRect(0, 0, board.width, board.height);
    bgX -= 2;
    if (bgX <= -2000) bgX = 0;
    context.drawImage(terrainImg, bgX, 0, 2000, boardHeight);
    context.drawImage(terrainImg, bgX + 2000, 0, 2000, boardHeight);

    // saut
    if (isSauting) {
        velocityY += gravity;
        perso.y = Math.min(perso.y + velocityY, persoY);
        if (perso.y === persoY) {
            isSauting = false;
            velocityY = 0;
        }
    }

    // dessin perso
    if (isPlonging) {
        context.drawImage(persoDiveImg, perso.x, boardHeight - 42, 113, 42);
    } else if (isSauting) {
        context.drawImage(persoJumpImg, perso.x, perso.y, 42, 113);
    } else {
        runTimer++;
        if (runTimer >= 10) { runFrame = runFrame === 0 ? 1 : 0; runTimer = 0; }
        context.drawImage(runFrame === 0 ? persoRunImg1 : persoRunImg2, perso.x, perso.y, perso.width, perso.height);
    }

    // hitbox perso selon état
    let persoActuel;
    if (isPlonging) {
        persoActuel = { x: perso.x, y: boardHeight - 42, width: 113, height: 42 };
    } else if (isSauting) {
        persoActuel = { x: perso.x, y: perso.y, width: 42, height: 113 };
    } else {
        persoActuel = { x: perso.x, y: perso.y, width: perso.width, height: perso.height };
    }

    // rugbymen
    for (let i = 0; i < rmArray.length; i++) {
        let rm = rmArray[i];
        rm.x += velocityX;
        context.drawImage(rm.img, rm.x, rm.y, rm.width, rm.height);
        let rmHb = { x: rm.x + 15, y: rm.y + 10, width: rm.width - 30, height: rm.height - 15 };
        if (detectCollision(persoActuel, rmHb)) {
            gameOver = true;
            clearTimeout(obstacleInterval);
        }
    }

    // ballons
    for (let i = 0; i < ballonArray.length; i++) {
        let ballon = ballonArray[i];
        ballon.x += ballon.velocityX;
        context.drawImage(ballon.img, ballon.x, ballon.y, ballon.width, ballon.height);
        if (detectCollision(persoActuel, ballon)) {
            gameOver = true;
            clearTimeout(obstacleInterval);
        }
    }

    // score
    context.fillStyle = "black";
    context.font = "20px courier";
    score++;
    context.fillText("Score : " + Math.floor(score / 10), 5, 20);
}

function scheduleObstacle(placeFn) {
    let randomDelay = Math.random() * 1000 + 800;
    obstacleInterval = setTimeout(function() {
        if (!gameOver) {
            placeFn();
            scheduleObstacle(placeFn);
        }
    }, randomDelay);
}

function placeRm() {
    if (gameOver) { return; }
    let rm = { img: rm1Img, x: rmX, y: rmY, width: rm1Width, height: rmHeight, hbOffsetX: 15, hbOffsetY: 10, hbWidth: rm1Width - 30, hbHeight: rmHeight - 15 };
    rmArray.push(rm);
    if (rmArray.length > 5) { rmArray.shift(); }
}

function placeBallon() {
    if (gameOver) { return; }
    let ballon = { img: ballonImg, x: boardWidth, y: persoY - 35, width: ballonWidth, height: ballonHeight, velocityX: velocityX };
    ballonArray.push(ballon);
    if (ballonArray.length > 5) { ballonArray.shift(); }
}

function placeMix() {
    if (Math.random() > 0.5) { placeRm(); } else { placeBallon(); }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}