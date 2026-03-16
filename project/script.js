// board
let board;
let boardWidth = 750;
let boardHeight = 250;
let context;
let terrainImg;

// player
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

// neutral player
let isSauting = false;
let isPlonging = false;
let plongeTimer = 0;

// rugbyman
let rmArray = [];
let rm1Width = 40;
let rmHeight = 40;
let rmX = 700;
let rmY = boardHeight - rmHeight;
let rm1Img;

// ball
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

window.onload = function () {
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

    requestAnimationFrame(update);
    setInterval(placeObstacle, 1500); // obstacles
    document.addEventListener("keydown", handleKey);
}

function handleKey(e) {
    // ✅ relance la partie si game over
    if (gameOver) {
        if (e.code == "Space" || e.code == "Enter") {
            resetGame();
        }
        return;
    }

    // jump over rugbymen
    if (e.code == "Enter" && !isSauting && perso.y == persoY) {
        isSauting = true;
        isPlonging = false;
        velocityY = -10;
    }

    // diving under ball
    if (e.code == "Space" && !isPlonging && perso.y == persoY) {
        isPlonging = true;
        isSauting = false;
        plongeTimer = 40; // diving time per frame
    }
}

function resetGame() {
    // remet tout à zéro
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

function update() {
    requestAnimationFrame(update);

    if (gameOver) {
        context.fillStyle = "red";
        context.font = "40px courier";
        context.fillText("GAME OVER", boardWidth / 2 - 100, boardHeight / 2);
        context.fillStyle = "white";
        context.font = "20px courier";
        context.fillText("Score : " + Math.floor(score / 10), boardWidth / 2 - 70, boardHeight / 2 + 40);
        context.fillStyle = "yellow";
        context.font = "16px courier";
        context.fillText("Appuie sur ESPACE ou ENTREE pour rejouer", boardWidth / 2 - 170, boardHeight / 2 + 80);
        return;
}

    context.clearRect(0, 0, board.width, board.height);
    context.drawImage(terrainImg, 0, 0, boardWidth, boardHeight);

    // dive
    if (isPlonging) {
        plongeTimer--;
        if (plongeTimer <= 0) {
            isPlonging = false;
        }
    }

    // jump
    if (isSauting) {
        velocityY += gravity;
        perso.y = Math.min(perso.y + velocityY, persoY);
        if (perso.y == persoY) {
            isSauting = false;
            velocityY = 0;
        }
    }

    // player images
    if (isPlonging) {
    context.drawImage(persoPlongeImg, perso.x, persoY + 40, perso.width * 1.5, perso.height * 0.5);
} else {
    context.drawImage(persoImg, perso.x, perso.y, perso.width, perso.height);
}

    // collision rugbymen 
    for (let i = 0; i < rmArray.length; i++) {
        let rm = rmArray[i];
        rm.x += velocityX;
        context.drawImage(rm.img, rm.x, rm.y, rm.width, rm.height);

        let persoActuel = isPlonging
            ? { x: perso.x, y: persoY + 30, width: perso.width * 1.5, height: perso.height * 0.5 }
            : { x: perso.x, y: perso.y, width: perso.width, height: perso.height };

        if (detectCollision(persoActuel, rm)) {
            gameOver = true;
        }
    }

    // collision ball
    for (let i = 0; i < ballonArray.length; i++) {
        let ballon = ballonArray[i];
        ballon.x += ballon.velocityX;
        context.drawImage(ballon.img, ballon.x, ballon.y, ballon.width, ballon.height);

        let persoActuel = isPlonging
            ? { x: perso.x, y: persoY + 30, width: perso.width * 1.5, height: perso.height * 0.5 }
            : { x: perso.x, y: perso.y, width: perso.width, height: perso.height };

        if (detectCollision(persoActuel, ballon)) {
            gameOver = true;
        }
    }

    // rules
    context.fillStyle = "white";
    context.font = "14px courier";
    context.fillText("ENTREE = sauter | ESPACE = plonger", boardWidth / 2 - 130, 20);

    // score
    context.fillStyle = "black";
    context.font = "20px courier";
    score++;
    context.fillText("Score : " + Math.floor(score / 10), 5, 20);
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
        y: persoY ,
        width: ballonWidth,
        height: ballonHeight,
        velocityX: -8
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