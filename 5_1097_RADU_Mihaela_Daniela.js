// ===================== GLOBAL =====================
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ASTEROID_COLORS = ['#FFCCE1', '#E195AB', '#A64D79', '#B692C2'];
const keys = { up: false, down: false, left: false, right: false, rotateLeft: false, rotateRight: false, shoot: false };
const asteroids = [];

// ===================================== ROCKET CLASS =====================================
class Rocket {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 10;
        this.radius = 5;
    }

    draw() {
        context.beginPath();
        // 5 - radius of the circle, 0 - the arc begins at (this.x + 5, this.y), Math.PI * 2 - the arc ends at (this.x + 5, this.y)
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = '#FF69B4';
        context.fill();
    }

    move() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
}

// ===================================== ASTEROID CLASS =====================================
class Asteroid {
    constructor(x, y, angle, hits) {
        this.position = { x: x, y: y };
        this.speed = Math.random() * 4 + 0.5;
        this.velocity = { 
            x: Math.cos(angle) * this.speed,
            y: Math.sin(angle) * this.speed
        };
        this.angle = angle;

        this.hits = hits;
        this.radius = hits * 20;
        this.color = ASTEROID_COLORS[hits - 1];
    }

    draw() {
        context.beginPath();
        context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.fill();
        context.textAlign = "center";
        context.fillStyle = "black";
        context.font = "20px Arial";
        context.fillText(this.hits, this.position.x, this.position.y + 6);
    }

    move() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.position.x + this.radius < 0 || this.position.x - this.radius > canvas.width ||
            this.position.y + this.radius < 0 || this.position.y - this.radius > canvas.height) {
            const index = asteroids.indexOf(this);
            if (index > -1) {
                asteroids.splice(index, 1);
            }
        }
    }
}

// ===================== CLASA PLAYER =====================
class Player {
    constructor(x, y) {
        this.position = { 
            x: x, 
            y: y 
        };
        this.speed = { 
            x: 0, 
            y: 0 
        };
        this.rotation = -Math.PI / 2;;
        this.acceleration = 0.3;
        this.maxSpeed = 10;
        this.rockets = [];
        this.lives = 3;
        this.gameOver = false;
        this.score = 0;

        this.updateScoreDisplay();
    }

    draw() {
        context.save();
        context.translate(this.position.x, this.position.y);
        context.rotate(this.rotation);
        context.beginPath();
        context.moveTo(30, 0);
        context.lineTo(-10, -10);
        context.lineTo(-10, 10);
        context.closePath();
        context.strokeStyle = 'white';
        context.stroke();
        context.restore();

        this.drawLives();

        if (this.gameOver) {
            document.getElementById('gameOverMessage').style.display = 'block';
        }
    }

    move(keys) {
        if (this.gameOver) return;

        if (keys.up) {
            this.speed.x += Math.cos(this.rotation) * this.acceleration;
            this.speed.y += Math.sin(this.rotation) * this.acceleration;
        }
        if (keys.down) {
            this.speed.x -= Math.cos(this.rotation) * this.acceleration;
            this.speed.y -= Math.sin(this.rotation) * this.acceleration;
        }
        if (keys.left) this.speed.x -= this.acceleration;
        if (keys.right) this.speed.x += this.acceleration;
        if (keys.rotateLeft) this.rotation -= 0.1;
        if (keys.rotateRight) this.rotation += 0.1;

        //viteza totala
        const speed = Math.sqrt(this.speed.x ** 2 + this.speed.y ** 2);
        if (speed > this.maxSpeed) {
            const scale = this.maxSpeed / speed;
            this.speed.x *= scale;
            this.speed.y *= scale;
        }

        //franare
        this.speed.x *= 0.98;
        this.speed.y *= 0.98;

        //actualizeaza pozitia
        this.position.x += this.speed.x;
        this.position.y += this.speed.y;

        //margini infinite
        this.position.x = (this.position.x + canvas.width) % canvas.width;
        this.position.y = (this.position.y + canvas.height) % canvas.height;

        //trage maxim 3 rachete
        if (keys.shoot && this.rockets.length < 3) {
            this.shoot();
            keys.shoot = false;
        }

        //actualizeaza pozitia rachetelor
        this.rockets.forEach(rocket => rocket.move());

        //eliminare rachete care ies din canvas
        this.rockets = this.rockets.filter(rocket => rocket.x >= 0 && rocket.x <= canvas.width && rocket.y >= 0 && rocket.y <= canvas.height);
    }

    //trage racheta, calculeaza pozitia rachetei
    shoot() {
        const rocketStartX = this.position.x + Math.cos(this.rotation) * 25;
        const rocketStartY = this.position.y + Math.sin(this.rotation) * 25;
        this.rockets.push(new Rocket(rocketStartX, rocketStartY, this.rotation));
    }

    //dx = x1 - x2, dy = y1 - y2, distanta = sqrt(dx^2 + dy^2)
    checkCollision(asteroid) {
        const dx = this.position.x - asteroid.position.x;
        const dy = this.position.y - asteroid.position.y;
        return Math.sqrt(dx ** 2 + dy ** 2) < asteroid.radius;
    }

    loseLife() {
        this.lives -= 1;
        this.updateScoreDisplay(); 
    
        this.drawLives();
        
        if (this.lives <= 0) {
            this.gameOver = true;
            document.getElementById('gameOverMessage').style.display = 'block';
    
            const playerName = prompt('Your name: ') || 'Jucator anonim';
    
            saveHighScore(playerName, this.score);

            displayHighScores();
            document.getElementById('highScores').style.display = 'block';
        } else {
            this.respawn();
        }
    }
    
    respawn() {
        this.position.x = canvas.width / 2;
        this.position.y = canvas.height / 2;
        this.speed.x = 0;
        this.speed.y = 0;
        this.rotation = -Math.PI / 2;

        resetKeys();
    }

    drawLives() {
        const livesContainer = document.getElementById('livesDisplay');
        livesContainer.innerHTML = '';
        for (let i = 0; i < this.lives; i++) {
            const lifeElement = document.createElement('div');
            lifeElement.classList.add('life');
            livesContainer.appendChild(lifeElement);
        }
    }

    restartGame() {
        this.lives = 3;
        this.score = 0;
        this.gameOver = false;
        this.updateScoreDisplay();
        this.position.x = canvas.width / 2;
        this.position.y = canvas.height / 2;
        this.speed.x = 0;
        this.speed.y = 0;
        this.rotation = -Math.PI / 2;
        asteroids.length = 0;
        resetKeys();
        document.getElementById('gameOverMessage').style.display = 'none';
        document.getElementById('highScores').style.display = 'none'; 
    }

    increaseScore(points) {
        this.score += points;
        this.updateScoreDisplay();
    
        if (this.score >= 100 && this.lives < 3) {
            this.lives += 1;
            this.drawLives();
        }
    }

    updateScoreDisplay() {
        const scoreContainer = document.getElementById('scoreDisplay');
        scoreContainer.innerText = `Score: ${this.score}`;
    }
}

// ===================== MAIN =====================

const player = new Player(canvas.width / 2, canvas.height / 2);

function resetKeys() {
    keys.up = false; keys.down = false;
    keys.left = false; keys.right = false;
    keys.rotateLeft = false; keys.rotateRight = false;
    keys.shoot = false;
}

function spawnAsteroid() {
    const side = Math.floor(Math.random() * 4);
    let x, y, angle;
    if (side === 0) { 
        x = 0; 
        y = Math.random() * canvas.height; 
        angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x); 
    }
    else if (side === 1) { 
        x = canvas.width; 
        y = Math.random() * canvas.height; 
        angle = Math.atan2(canvas.height / 2 - y, 0 - x); 
    }
    else if (side === 2) { 
        x = Math.random() * canvas.width; 
        y = 0; 
        angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x); 
    }
    else { 
        x = Math.random() * canvas.width; 
        y = canvas.height; 
        angle = Math.atan2(0 - y, canvas.width / 2 - x); 
    }

    const hits = Math.floor(Math.random() * 4) + 1;
    asteroids.push(new Asteroid(x, y, angle, hits));
}

function handleRocketCollision(rocket, asteroid) {
    const dx = rocket.x - asteroid.position.x;
    const dy = rocket.y - asteroid.position.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    if (distance < asteroid.radius) {
        asteroid.hits -= 1;
        player.increaseScore(10);
        return true;
    }
    return false;
}

function handleAsteroidCollision(asteroid1, asteroid2) {
    const dx = asteroid1.position.x - asteroid2.position.x;
    const dy = asteroid1.position.y - asteroid2.position.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    //distanta dintre centrele lor este mai mica decat suma razelor lor
    if (distance < asteroid1.radius + asteroid2.radius) {
        //unghiul dintre axa orizontala si linia care leaga centrele celor doi asteroizi
        const angle = Math.atan2(dy, dx);
        //viteze scalare
        const speed1 = Math.sqrt(asteroid1.velocity.x ** 2 + asteroid1.velocity.y ** 2);
        const speed2 = Math.sqrt(asteroid2.velocity.x ** 2 + asteroid2.velocity.y ** 2);

        asteroid1.velocity.x = Math.cos(angle) * speed2;
        asteroid1.velocity.y = Math.sin(angle) * speed2;
        asteroid2.velocity.x = Math.cos(angle + Math.PI) * speed1;
        asteroid2.velocity.y = Math.sin(angle + Math.PI) * speed1;
    }
}

function handleCollisions() {
    //de la sfarsit pentru ca splice sa nu afecteze iteratia si sa nu sarim elemente
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];

        player.rockets = player.rockets.filter(rocket => {
            const collision = handleRocketCollision(rocket, asteroid);
            if (collision && asteroid.hits <= 0) {
                asteroids.splice(i, 1);
            }
            return !collision;
        });

        if (player.checkCollision(asteroid)) {
            player.loseLife();
            if (!player.gameOver) asteroids.splice(i, 1);
        }
    }

    for (let i = 0; i < asteroids.length; i++) {
        for (let j = i + 1; j < asteroids.length; j++) {
            handleAsteroidCollision(asteroids[i], asteroids[j]);
        }
    }
}

// ===================== GAME LOOP =====================
function animate() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);

    player.move(keys);
    player.draw();
    player.rockets.forEach(rocket => rocket.draw());
    asteroids.forEach(asteroid => {
        asteroid.move();
        asteroid.draw();
    });

    handleCollisions();
    if (!player.gameOver) requestAnimationFrame(animate);
}

// ===================== KEY EVENTS =====================
window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') keys.up = true;
    if (event.key === 'ArrowDown') keys.down = true;
    if (event.key === 'ArrowLeft') keys.left = true;
    if (event.key === 'ArrowRight') keys.right = true;
    if (event.key === 'z') keys.rotateLeft = true;
    if (event.key === 'c') keys.rotateRight = true;
    if (event.key === 'x') keys.shoot = true;
    if (event.key === 'Enter' && player.gameOver) {
        player.restartGame();
        requestAnimationFrame(animate);
    }
});

window.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowUp') keys.up = false;
    if (event.key === 'ArrowDown') keys.down = false;
    if (event.key === 'ArrowLeft') keys.left = false;
    if (event.key === 'ArrowRight') keys.right = false;
    if (event.key === 'z') keys.rotateLeft = false;
    if (event.key === 'c') keys.rotateRight = false;
});

// ===================== GAME BEGINNING =====================
document.addEventListener('DOMContentLoaded', () => {
    resetKeys();

    const upButton = document.getElementById('upButton');
    const downButton = document.getElementById('downButton');
    const leftButton = document.getElementById('leftButton');
    const rightButton = document.getElementById('rightButton');
    const rotateLeftButton = document.getElementById('rotateLeftButton');
    const rotateRightButton = document.getElementById('rotateRightButton');
    const shootButton = document.getElementById('shootButton');

    const setKey = (key, value) => {
        keys[key] = value;
    };

    const addButtonListeners = (button, key) => {
        button.addEventListener('touchstart', () => setKey(key, true));
        button.addEventListener('touchend', () => setKey(key, false));
        button.addEventListener('mousedown', () => setKey(key, true));
        button.addEventListener('mouseup', () => setKey(key, false));
        button.addEventListener('mouseleave', () => setKey(key, false));
    };

    addButtonListeners(upButton, 'up');
    addButtonListeners(downButton, 'down');
    addButtonListeners(leftButton, 'left');
    addButtonListeners(rightButton, 'right');
    addButtonListeners(rotateLeftButton, 'rotateLeft');
    addButtonListeners(rotateRightButton, 'rotateRight');
    addButtonListeners(shootButton, 'shoot');

    animate();
});

// ===================== SCORES =====================
function saveHighScore(name, score) {
    const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    
    highScores.push({ name, score });
    
    highScores.sort((a, b) => b.score - a.score);
    if (highScores.length > 5) {
        highScores.splice(5);
    }

    localStorage.setItem('highScores', JSON.stringify(highScores));
}

function displayHighScores() {
    const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    const highScoreList = document.getElementById('highScoreList');
    
    if (!highScoreList) {
        console.error('Elementul highScoreList nu există în DOM.');
        return;
    }

    highScoreList.innerHTML = ''; 
    highScores.forEach((entry, index) => {
        const listItem = document.createElement('dt');
        listItem.textContent = `${index + 1}. ${entry.name}: ${entry.score}`;
        highScoreList.appendChild(listItem);
    });
}
document.addEventListener('DOMContentLoaded', displayHighScores);

// ===================== SPAWN =====================
setInterval(spawnAsteroid, 3000);


// de rulat in browser pentru a goli scorurile
// localStorage.removeItem('highScores');