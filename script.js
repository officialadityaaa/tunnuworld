// js/script.js

// Ensure the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Game Class
    class Game {
        constructor() {
            
            this.dino = document.querySelector('.dino');
            this.obstacle = document.querySelector('.obstacle');
            this.powerUp = document.querySelector('.powerUp');
            this.gameOverText = document.querySelector('.gameOver');
            this.scoreCont = document.querySelector('.scoreCont');
            this.levelCont = document.querySelector('.levelCont');
            this.pauseBtn = document.getElementById('pauseBtn');
            this.leftBtn = document.getElementById('leftBtn');
            this.jumpBtn = document.getElementById('jumpBtn');
            this.rightBtn = document.getElementById('rightBtn');
            
            // Audio Elements
            this.backgroundMusic = document.getElementById('backgroundMusic');
            this.gameOverAudio = document.getElementById('gameOverAudio');
            this.jumpSound = document.getElementById('jumpSound');
            this.powerUpSound = document.getElementById('powerUpSound');
            
            // Game Variables
            this.score = 0;
            this.level = 1;
            this.isGameOver = false;
            this.isPaused = false;
            this.cross = true;
            this.powerUpActive = false;
            this.obstacleSpeed = 3; // Initial speed in seconds
            this.powerUpTimer = null;
            
            // Bind Methods
            this.handleKeyDown = this.handleKeyDown.bind(this);
            this.handleTouch = this.handleTouch.bind(this);
            this.checkCollision = this.checkCollision.bind(this);
            this.updateScore = this.updateScore.bind(this);
            this.updateLevel = this.updateLevel.bind(this);
            this.togglePause = this.togglePause.bind(this);
            this.spawnPowerUp = this.spawnPowerUp.bind(this);
            this.moveLeft = this.moveLeft.bind(this);
            this.moveRight = this.moveRight.bind(this);
            this.jump = this.jump.bind(this);
            
            // Initialize Game
            this.init();
        }
        
        init() {
            // Start background music
            this.backgroundMusic.volume = 0.5; // Set volume to 50%
            this.backgroundMusic.play();
            
            // Display start message
            this.gameOverText.style.display = 'block';
            this.gameOverText.innerHTML = "Press Space or Tap to Start";
            
            // Event Listeners
            document.addEventListener('keydown', this.handleKeyDown);
            this.pauseBtn.addEventListener('click', this.togglePause);
            this.leftBtn.addEventListener('click', this.moveLeft);
            this.jumpBtn.addEventListener('click', this.jump);
            this.rightBtn.addEventListener('click', this.moveRight);
            this.gameOverText.addEventListener('click', () => {
                if (this.isGameOver) return;
                if (!this.collisionInterval) {
                    this.start();
                }
            });
        }
        
        start() {
            if (this.isGameOver) return;
            
            // Hide start message
            this.gameOverText.style.display = 'none';
            
            // Start obstacle animation
            this.obstacle.classList.add('obstacleAni');
            this.obstacle.style.animationDuration = `${this.obstacleSpeed}s`;
            
            // Start power-up spawn
            this.spawnPowerUp();
            
            // Start Collision Detection
            this.collisionInterval = setInterval(this.checkCollision, 10);
        }
        
        handleKeyDown(e) {
            if (this.isGameOver) return;
            
            if (e.code === 'Space') {
                // Start the game
                if (!this.collisionInterval) {
                    this.start();
                }
            }
            
            if (e.code === 'ArrowUp') {
                this.jump();
            }
            if (e.code === 'ArrowRight') {
                this.moveRight();
            }
            if (e.code === 'ArrowLeft') {
                this.moveLeft();
            }
        }
        
        handleTouch(e) {
            // Implement touch controls if needed
        }
        
        jump() {
            if (this.dino.classList.contains('animateDino')) return;
            this.dino.classList.add('animateDino');
            this.jumpSound.currentTime = 0;
            this.jumpSound.play();
            setTimeout(() => {
                this.dino.classList.remove('animateDino');
            }, 800);
        }
        
        moveRight() {
            let dinoX = parseInt(window.getComputedStyle(this.dino, null).getPropertyValue('left'));
            if (dinoX < window.innerWidth - this.dino.offsetWidth - 20) {
                this.dino.style.left = (dinoX + 100) + "px";
            }
        }
        
        moveLeft() {
            let dinoX = parseInt(window.getComputedStyle(this.dino, null).getPropertyValue('left'));
            if (dinoX > 20) {
                this.dino.style.left = (dinoX - 100) + "px";
            }
        }
        
        checkCollision() {
            const dinoRect = this.dino.getBoundingClientRect();
            const obstacleRect = this.obstacle.getBoundingClientRect();
            const powerUpRect = this.powerUp.getBoundingClientRect();
            
            // Collision with obstacle
            if (this.isIntersecting(dinoRect, obstacleRect)) {
                if (!this.powerUpActive) {
                    this.gameOver();
                }
            }
            
            // Collision with power-up
            if (this.isIntersecting(dinoRect, powerUpRect)) {
                this.collectPowerUp();
            }
            
            // Scoring Logic
            const ox = parseInt(window.getComputedStyle(this.obstacle, null).getPropertyValue('left'));
            if (ox < 120 && this.cross) {
                this.score += 1;
                this.updateScore();
                this.cross = false;
                setTimeout(() => {
                    this.cross = true;
                }, 1000);
                
                // Increase difficulty every 5 points
                if (this.score % 5 === 0) {
                    this.level += 1;
                    this.updateLevel();
                }
            }
        }
        
        isIntersecting(rect1, rect2) {
            return !(
                rect1.top > rect2.bottom ||
                rect1.bottom < rect2.top ||
                rect1.left > rect2.right ||
                rect1.right < rect2.left
            );
        }
        
        gameOver() {
            this.isGameOver = true;
            this.gameOverText.style.display = 'block';
            this.gameOverText.innerHTML = "Game Over - Tap to Restart";
            this.obstacle.classList.remove('obstacleAni');
            this.gameOverAudio.play();
            this.backgroundMusic.pause();
            clearInterval(this.collisionInterval);
            clearInterval(this.powerUpInterval);
        }
        
        updateScore() {
            this.scoreCont.innerHTML = `Score: ${this.score}`;
            
            // Update high score
            let highScore = localStorage.getItem('highScore') || 0;
            if (this.score > highScore) {
                localStorage.setItem('highScore', this.score);
                // Optionally, notify the player of a new high score
            }
        }
        
        updateLevel() {
            this.levelCont.innerHTML = `Level: ${this.level}`;
            // Decrease animation duration to increase speed
            this.obstacleSpeed = Math.max(1.5, this.obstacleSpeed - 0.3);
            this.obstacle.style.animationDuration = `${this.obstacleSpeed}s`;
        }
        
        togglePause() {
            if (this.isGameOver) return;
            
            if (this.isPaused) {
                // Resume the game
                this.obstacle.style.animationPlayState = 'running';
                this.powerUp.style.animationPlayState = 'running';
                this.backgroundMusic.play();
                this.isPaused = false;
                this.pauseBtn.innerHTML = 'Pause';
            } else {
                // Pause the game
                this.obstacle.style.animationPlayState = 'paused';
                this.powerUp.style.animationPlayState = 'paused';
                this.backgroundMusic.pause();
                this.isPaused = true;
                this.pauseBtn.innerHTML = 'Resume';
            }
        }
        
        spawnPowerUp() {
            this.powerUpInterval = setInterval(() => {
                if (this.isGameOver) {
                    clearInterval(this.powerUpInterval);
                    return;
                }
                // Randomly show power-up
                this.powerUp.classList.add('powerUpAni');
                this.powerUp.style.left = '100%';
                this.powerUp.style.top = `${Math.random() * 60 + 10}%`;
                
                // Show the power-up
                this.powerUp.style.display = 'block';
                
                // Hide after animation completes
                setTimeout(() => {
                    this.powerUp.classList.remove('powerUpAni');
                    this.powerUp.style.display = 'none';
                }, 5000);
            }, 15000); // Spawn every 15 seconds
        }
        
        collectPowerUp() {
            if (this.powerUpActive) return;
            this.powerUpActive = true;
            this.powerUpSound.currentTime = 0;
            this.powerUpSound.play();
            // Example Power-Up: Temporary invincibility
            this.dino.classList.add('invincible');
            setTimeout(() => {
                this.dino.classList.remove('invincible');
                this.powerUpActive = false;
            }, 5000); // Invincibility lasts for 5 seconds
        }
    }

    // Initialize the Game
    const game = new Game();
});
