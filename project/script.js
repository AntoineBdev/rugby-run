// board
let board;
let boardWidth = 800;
let boardHeight = 250;
let context;
let terrainImg;

// perso
let persoWidth = 88;
let persoHeight = 94;
let persoX = 50;
let persoY = boardHeight - persoHeight;
let persoImg;
let persoPlongeImg;

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
let rm1Width = 40;
let rmHeight = 40;
let rmX = 750;
let rmY = boardHeight - rmHeight;
let rm1Img;

// ballon
let ballonArray = [];
let ballonWidth = 30;
let ballonHeight = 30;
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
    if (niveau === 1) { velocityX = -5; }
    if (niveau === 2) { velocityX = -8; }
    if (niveau === 3) { velocityX = -12; }

    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    terrainImg = new Image();
    terrainImg.src = "terrain.jpg";

    persoImg = new Image();
    persoImg.src = "perso.jpg";

    persoPlongeImg = new Image();
    persoPlongeImg.src = "plonge.jpg";

    rm1Img = new Image();
    rm1Img.src = "rm1.jpg";

    ballonImg = new Image();
    ballonImg.src = "ballon.jpg";

    resetGame();

    // ✅ stoppe les anciens intervalles avant d'en créer de nouveaux
    if (obstacleInterval) { clearTimeout(obstacleInterval); }
    if (animationId) { cancelAnimationFrame(animationId); }

    scheduleObstacle();
    document.addEventListener("keydown", handleKey);
    animationId = requestAnimationFrame(update);
}

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
}

function handleKey(e) {
    if (gameOver) {
        if (e.code === "Escape") {
            clearTimeout(obstacleInterval);
            cancelAnimationFrame(animationId); // ✅ stoppe l'animation
            document.removeEventListener("keydown", handleKey);
            window.location.href = "menu.html";
        }
        return;
    }

    if (e.code === "ArrowUp" && !isSauting && perso.y === persoY) {
        isSauting = true;
        isPlonging = false;
        velocityY = -10;
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
    console.log("update")
    animationId = requestAnimationFrame(update); // ✅ stocke l'id à chaque frame

    if (gameOver) {
        context.fillStyle = "rgba(0,0,0,0.5)"; // ✅ fond semi-transparent
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
    context.drawImage(terrainImg, 0, 0, boardWidth, boardHeight);

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
        context.drawImage(persoPlongeImg, perso.x, persoY + 40, perso.width * 1.5, perso.height * 0.5);
    } else {
        context.drawImage(persoImg, perso.x, perso.y, perso.width, perso.height);
    }

    // hitbox
    let persoActuel = isPlonging
        ? { x: perso.x, y: persoY + 40, width: perso.width * 1.5, height: perso.height * 0.5 }
        : { x: perso.x, y: perso.y, width: perso.width, height: perso.height };

    // rugbymen
    for (let i = 0; i < rmArray.length; i++) {
        let rm = rmArray[i];
        rm.x += velocityX;
        context.drawImage(rm.img, rm.x, rm.y, rm.width, rm.height);
        if (detectCollision(persoActuel, rm)) {
            gameOver = true;
            clearTimeout(obstacleInterval); // ✅ stoppe les obstacles
        }
    }

    // ballons
    for (let i = 0; i < ballonArray.length; i++) {
        let ballon = ballonArray[i];
        ballon.x += ballon.velocityX;
        context.drawImage(ballon.img, ballon.x, ballon.y, ballon.width, ballon.height);
        if (detectCollision(persoActuel, ballon)) {
            gameOver = true;
            clearTimeout(obstacleInterval); // ✅ stoppe les obstacles
        }
    }

    // score
    context.fillStyle = "black";
    context.font = "20px courier";
    score++;
    context.fillText("Score : " + Math.floor(score / 10), 5, 20);
}

function scheduleObstacle() {
    let randomDelay = Math.random() * 1000 + 800;
    obstacleInterval = setTimeout(function() {
        if (!gameOver) {
            placeObstacle();
            scheduleObstacle();
        }
    }, randomDelay);
}

function placeObstacle() {
    if (gameOver) { return; }

    if (Math.random() > 0.5) {
        let rm = {
            img: rm1Img,
            x: rmX,
            y: rmY,
            width: rm1Width,
            height: rmHeight
        }
        rmArray.push(rm);
        if (rmArray.length > 5) { rmArray.shift(); }
    } else {
        let ballon = {
            img: ballonImg,
            x: boardWidth,
            y: persoY - 20, // ✅ hauteur de tête
            width: ballonWidth,
            height: ballonHeight,
            velocityX: velocityX
        }
        ballonArray.push(ballon);
        if (ballonArray.length > 5) { ballonArray.shift(); }
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}