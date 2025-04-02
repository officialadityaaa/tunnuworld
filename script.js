// Ensure the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // Game Class
    class Game {
        constructor() {
            // DOM Elements
            this.gameContainer = document.getElementById('gameContainer');
            this.dino = document.getElementById('dino');
            this.obstacle = document.getElementById('obstacle');
            this.powerUp = document.getElementById('powerUp');
            this.messageOverlay = document.getElementById('messageOverlay');
            this.messageText = document.getElementById('messageText');
            this.scoreCont = document.querySelector('.scoreCont');
            this.levelCont = document.querySelector('.levelCont');
            this.highScoreCont = document.querySelector('.highScoreCont'); // High score display
            this.pauseBtn = document.getElementById('pauseBtn');
            this.leftBtn = document.getElementById('leftBtn');
            this.jumpBtn = document.getElementById('jumpBtn');
            this.rightBtn = document.getElementById('rightBtn');

            // Audio Elements
            this.backgroundMusic = document.getElementById('backgroundMusic');
            this.gameOverAudio = document.getElementById('gameOverAudio');
            this.jumpSound = document.getElementById('jumpSound');
            this.powerUpSound = document.getElementById('powerUpSound');

            // Game State
            this.score = 0;
            this.level = 1;
            this.highScore = localStorage.getItem('highScore') || 0;
            this.gameState = 'idle'; // 'idle', 'running', 'paused', 'gameOver'
            this.canScore = true; // Prevent multiple score increments per obstacle pass
            this.obstacleBaseSpeed = 5; // Initial animation duration in seconds (higher = slower)
            this.obstacleCurrentSpeed = this.obstacleBaseSpeed;
            this.powerUpTypes = ['invincible', 'scoreBoost']; // Available power-up types
            this.activePowerUp = null; // e.g., { type: 'invincible', timeoutId: null }
            this.powerUpSpawnInterval = null;
            this.powerUpDespawnTimeout = null;
            this.gameLoopId = null;
            this.lastTimestamp = 0;

            // Constants
            this.LEVEL_UP_SCORE = 5; // Score needed to level up
            this.SPEED_INCREASE_FACTOR = 0.25; // How much to decrease animation duration per level
            this.MIN_OBSTACLE_SPEED = 1.5; // Fastest speed (minimum animation duration)
            this.POWERUP_SPAWN_TIME = 15000; // ms between power-up spawns
            this.POWERUP_DURATION = 5000; // ms power-up effect lasts
            this.POWERUP_ANIMATION_SPEED = 5; // seconds for powerup to cross screen
            this.HORIZONTAL_MOVE_PERCENT = 8; // Percentage of screen width to move left/right

            // Bind Methods
            this.init = this.init.bind(this);
            this.handleInput = this.handleInput.bind(this);
            this.handleTouchStart = this.handleTouchStart.bind(this);
            this.startGame = this.startGame.bind(this);
            this.gameLoop = this.gameLoop.bind(this);
            this.update = this.update.bind(this);
            this.render = this.render.bind(this);
            this.checkCollisions = this.checkCollisions.bind(this);
            this.collectPowerUp = this.collectPowerUp.bind(this);
            this.spawnPowerUp = this.spawnPowerUp.bind(this);
            this.despawnPowerUp = this.despawnPowerUp.bind(this);
            this.activatePowerUpEffect = this.activatePowerUpEffect.bind(this);
            this.deactivatePowerUpEffect = this.deactivatePowerUpEffect.bind(this);
            this.updateScore = this.updateScore.bind(this);
            this.updateLevel = this.updateLevel.bind(this);
            this.gameOver = this.gameOver.bind(this);
            this.togglePause = this.togglePause.bind(this);
            this.reset = this.reset.bind(this);
            this.jump = this.jump.bind(this);
            this.moveLeft = this.moveLeft.bind(this);
            this.moveRight = this.moveRight.bind(this);
            this.showMessage = this.showMessage.bind(this);
            this.hideMessage = this.hideMessage.bind(this);

            // Initialize Game
            this.init();
        }

        init() {
            // Detect Touch Support
            this.isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
            if (this.isTouchDevice) {
                document.body.classList.add('is-touch'); // Add class to show controls via CSS
            }

            // Initial Display
            this.updateScore(0);
            this.updateLevel(1);
            this.highScoreCont.innerHTML = `High Score: ${this.highScore}`;
            this.showMessage("Press Space or Tap to Start");
            this.obstacle.style.animationDuration = `${this.obstacleCurrentSpeed}s`;

            // Event Listeners
            document.addEventListener('keydown', this.handleInput);
            this.pauseBtn.addEventListener('click', this.togglePause);

            // Touch / Click Listeners
            if (this.isTouchDevice) {
                this.messageOverlay.addEventListener('touchstart', this.handleTouchStart, { passive: false });
                this.leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.moveLeft(); }, { passive: false });
                this.jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.jump(); }, { passive: false });
                this.rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.moveRight(); }, { passive: false });
            } else {
                // Allow clicking overlay/buttons on desktop too
                this.messageOverlay.addEventListener('click', this.handleTouchStart);
                this.leftBtn.addEventListener('click', this.moveLeft);
                this.jumpBtn.addEventListener('click', this.jump);
                this.rightBtn.addEventListener('click', this.moveRight);
            }

            // Preload audio (optional, browsers often do this)
            this.backgroundMusic.volume = 0.3; // Lower volume slightly
            this.backgroundMusic.preload = 'auto';
            this.gameOverAudio.preload = 'auto';
            this.jumpSound.preload = 'auto';
            this.powerUpSound.preload = 'auto';
        }

        handleInput(e) {
            if (this.gameState === 'gameOver' || this.gameState === 'paused') return;

            if (e.code === 'Space' || e.code === 'ArrowUp') {
                 if (this.gameState === 'idle') {
                    this.startGame();
                 } else if (this.gameState === 'running') {
                     this.jump();
                 }
            } else if (e.code === 'ArrowRight' && this.gameState === 'running') {
                this.moveRight();
            } else if (e.code === 'ArrowLeft' && this.gameState === 'running') {
                this.moveLeft();
            } else if (e.code === 'KeyP') { // Add P key for pause
                 this.togglePause();
            }
        }

        handleTouchStart(e) {
            e.preventDefault(); // Prevent potential double actions / scrolling
             if (this.gameState === 'idle' || this.gameState === 'gameOver') {
                this.startGame();
            }
        }

        startGame() {
            if (this.gameState === 'running') return;

            // Reset game state if coming from game over
            if (this.gameState === 'gameOver') {
                this.reset();
            }

            this.gameState = 'running';
            this.hideMessage();
            this.lastTimestamp = performance.now();
            this.backgroundMusic.currentTime = 0;
            this.backgroundMusic.play();
            this.obstacle.classList.add('obstacleAni');
            this.obstacle.style.animationPlayState = 'running';

            // Clear any previous intervals/timeouts
            clearInterval(this.powerUpSpawnInterval);
            clearTimeout(this.powerUpDespawnTimeout);
            if (this.activePowerUp) {
                 clearTimeout(this.activePowerUp.timeoutId);
                 this.deactivatePowerUpEffect();
             }


            // Start spawning power-ups
            this.powerUpSpawnInterval = setInterval(this.spawnPowerUp, this.POWERUP_SPAWN_TIME);

            // Start the game loop
            if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId); // Ensure no duplicates
            this.gameLoopId = requestAnimationFrame(this.gameLoop);
            this.pauseBtn.innerHTML = 'Pause';
            this.pauseBtn.disabled = false;
        }

        reset() {
            this.score = 0;
            this.level = 1;
            this.obstacleCurrentSpeed = this.obstacleBaseSpeed;
            this.activePowerUp = null;
            this.canScore = true;

            // Reset Visuals & Positions
            this.dino.style.left = '10%';
            this.dino.classList.remove('animateDino', 'invincible-effect', 'scoreboost-effect'); // Remove effects
            this.obstacle.classList.remove('obstacleAni'); // Stop animation class
            this.obstacle.style.left = '100%'; // Reset position
            this.obstacle.style.animationDuration = `${this.obstacleCurrentSpeed}s`;
             this.powerUp.style.display = 'none'; // Hide powerup
            this.powerUp.classList.remove('powerUpAni');
             this.gameContainer.classList.remove('screen-shake');


            this.updateScore();
            this.updateLevel();
             // Clear intervals/timeouts (redundant check, but safe)
            clearInterval(this.powerUpSpawnInterval);
            clearTimeout(this.powerUpDespawnTimeout);
            if (this.activePowerUp && this.activePowerUp.timeoutId) {
                clearTimeout(this.activePowerUp.timeoutId);
             }

            // Set state back to idle ready to start
             this.gameState = 'idle';
             this.pauseBtn.disabled = true; // Disable pause until game starts
             this.showMessage("Press Space or Tap to Start");
        }


        gameLoop(timestamp) {
            if (this.gameState !== 'running') {
                 // Stop the loop if paused or game over
                 this.gameLoopId = null; // Allow restarting
                 return;
             }

            const deltaTime = (timestamp - this.lastTimestamp) / 1000; // Time since last frame in seconds
            this.lastTimestamp = timestamp;

            this.update(deltaTime); // Update game logic
            this.render();        // Render changes (mostly handled by CSS animations now)

            this.gameLoopId = requestAnimationFrame(this.gameLoop); // Request next frame
        }

        update(dt) {
             // dt (delta time) can be used for frame-rate independent physics/movement
             // Example: dino.style.left = (currentLeft + speed * dt) + 'px';
             // For now, animations are CSS driven, but collision needs checking

             this.checkCollisions();
             this.checkScore();
        }

         render() {
             // Currently, rendering is mostly handled by CSS animations.
             // This function could be used for more complex rendering if needed (e.g., canvas)
             // Or for updating elements not driven purely by CSS animations.
         }

        checkCollisions() {
            if (this.gameState !== 'running') return;

            const dinoRect = this.dino.getBoundingClientRect();
            const obstacleRect = this.obstacle.getBoundingClientRect();
            const powerUpRect = this.powerUp.getBoundingClientRect();

            // Collision with obstacle
             if (this.isIntersecting(dinoRect, obstacleRect)) {
                // Check for invincibility power-up
                if (!this.activePowerUp || this.activePowerUp.type !== 'invincible') {
                    this.gameOver();
                    return; // Stop further checks if game over
                }
                // If invincible, maybe add a small effect like bouncing the obstacle? (Optional)
             }

             // Collision with power-up (check if it's currently displayed)
             if (this.powerUp.style.display === 'block' && this.isIntersecting(dinoRect, powerUpRect)) {
                this.collectPowerUp();
            }
        }

        checkScore() {
            if (this.gameState !== 'running') return;

            const obstacleRect = this.obstacle.getBoundingClientRect();
            const dinoRect = this.dino.getBoundingClientRect();

            // Score when the obstacle's right edge passes the dino's left edge
            if (obstacleRect.right < dinoRect.left && this.canScore) {
                this.score += (this.activePowerUp && this.activePowerUp.type === 'scoreBoost') ? 2 : 1; // Double points if boost active
                this.updateScore();
                this.canScore = false; // Prevent scoring again for this obstacle

                // Increase difficulty every N points
                if (this.score > 0 && this.score % this.LEVEL_UP_SCORE === 0) {
                    this.level += 1;
                    this.updateLevel();
                }
            }

            // Reset scoring ability when the obstacle goes off-screen left
            if (obstacleRect.right < 0 && !this.canScore) {
                 this.canScore = true;
             }
        }


        isIntersecting(rect1, rect2) {
             // Simple AABB collision detection
            return !(
                rect1.top > rect2.bottom ||
                rect1.bottom < rect2.top ||
                rect1.left > rect2.right ||
                rect1.right < rect2.left
            );
        }

         spawnPowerUp() {
            if (this.gameState !== 'running' || this.powerUp.style.display === 'block') return; // Don't spawn if game not running or one is already active

             // Randomly choose a power-up type
            const type = this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)];

            this.powerUp.style.display = 'block';
            this.powerUp.dataset.type = type; // Store type in data attribute for CSS styling
             this.powerUp.style.left = '100%'; // Start off screen right
            // Randomize vertical position slightly
            this.powerUp.style.top = `${Math.random() * 50 + 15}%`; // Between 15% and 65% from top
             this.powerUp.style.animationDuration = `${this.POWERUP_ANIMATION_SPEED}s`;
             this.powerUp.classList.add('powerUpAni');


            // Set a timeout to automatically remove the power-up if not collected
             clearTimeout(this.powerUpDespawnTimeout); // Clear previous timeout just in case
             this.powerUpDespawnTimeout = setTimeout(this.despawnPowerUp, this.POWERUP_ANIMATION_SPEED * 1000); // Despawn after animation duration
         }

          despawnPowerUp() {
               this.powerUp.style.display = 'none';
               this.powerUp.classList.remove('powerUpAni');
               this.powerUp.style.left = '100%'; // Reset position for next spawn
               clearTimeout(this.powerUpDespawnTimeout); // Clear timeout explicitly
           }


        collectPowerUp() {
            if (this.activePowerUp) return; // Only one power-up active at a time

            const type = this.powerUp.dataset.type;
            this.powerUpSound.currentTime = 0;
            this.powerUpSound.play();
            this.despawnPowerUp(); // Hide the collected power-up immediately

            this.activatePowerUpEffect(type);

            // Set timeout to deactivate the effect
            const timeoutId = setTimeout(() => {
                 this.deactivatePowerUpEffect();
            }, this.POWERUP_DURATION);

             this.activePowerUp = { type: type, timeoutId: timeoutId };
        }

         activatePowerUpEffect(type) {
            this.deactivatePowerUpEffect(); // Ensure any previous effect classes are removed

            if (type === 'invincible') {
                this.dino.classList.add('invincible-effect');
            } else if (type === 'scoreBoost') {
                 // Add a temporary visual cue for score boost if desired
                 this.scoreCont.classList.add('scoreboost-effect');
                 // Remove the class after a short time so it pulses on activation
                 setTimeout(() => this.scoreCont.classList.remove('scoreboost-effect'), 500);
            }
             // Add more power-up effects here
         }

         deactivatePowerUpEffect() {
             if (this.activePowerUp) {
                 clearTimeout(this.activePowerUp.timeoutId); // Clear the deactivation timeout
                  if (this.activePowerUp.type === 'invincible') {
                     this.dino.classList.remove('invincible-effect');
                 } else if (this.activePowerUp.type === 'scoreBoost') {
                      this.scoreCont.classList.remove('scoreboost-effect'); // Ensure removal if timeout cleared early
                 }
                 // Remove other power-up effects here
                 this.activePowerUp = null;
            } else {
                // Failsafe removal if activePowerUp somehow became null
                this.dino.classList.remove('invincible-effect');
                this.scoreCont.classList.remove('scoreboost-effect');
            }

         }


        gameOver() {
             if (this.gameState === 'gameOver') return; // Prevent multiple calls

            this.gameState = 'gameOver';
            this.showMessage("Game Over - Tap to Restart");
            this.gameContainer.classList.add('screen-shake'); // Add shake effect
            setTimeout(() => this.gameContainer.classList.remove('screen-shake'), 500); // Remove after animation

             // Stop sounds and animations
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0; // Reset music
            this.gameOverAudio.play();
            this.obstacle.style.animationPlayState = 'paused'; // Stop obstacle CSS animation
            this.powerUp.style.animationPlayState = 'paused'; // Stop powerup CSS animation


            // Stop the game loop
            if (this.gameLoopId) {
                 cancelAnimationFrame(this.gameLoopId);
                 this.gameLoopId = null;
             }

             // Stop powerup spawns and effects
             clearInterval(this.powerUpSpawnInterval);
             this.powerUpSpawnInterval = null;
             this.despawnPowerUp(); // Ensure powerup is hidden
             this.deactivatePowerUpEffect(); // Ensure any active effect is removed

            // Update High Score if needed
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('highScore', this.highScore);
                this.highScoreCont.innerHTML = `High Score: ${this.highScore}`;
                 // Optionally, add a "New High Score!" message part
                 this.messageText.innerHTML += "<br><span style='font-size: 0.7em; color: lightgreen;'>New High Score!</span>";
            }

             this.pauseBtn.disabled = true; // Disable pause button on game over
        }

        updateScore() {
            this.scoreCont.innerHTML = `Score: ${this.score}`;
        }

        updateLevel() {
            this.levelCont.innerHTML = `Level: ${this.level}`;
            // Increase speed: Decrease animation duration (but not below min speed)
             const newSpeed = this.obstacleBaseSpeed - ( (this.level -1) * this.SPEED_INCREASE_FACTOR);
            this.obstacleCurrentSpeed = Math.max(this.MIN_OBSTACLE_SPEED, newSpeed);
            this.obstacle.style.animationDuration = `${this.obstacleCurrentSpeed}s`;
        }

        togglePause() {
             if (this.gameState === 'gameOver' || this.gameState === 'idle') return;

             if (this.gameState === 'paused') {
                 // Resume
                 this.gameState = 'running';
                 this.obstacle.style.animationPlayState = 'running';
                 this.powerUp.style.animationPlayState = 'running'; // Resume powerup if visible
                 this.backgroundMusic.play();
                 this.pauseBtn.innerHTML = 'Pause';
                 this.hideMessage();
                  // Restart the game loop
                  this.lastTimestamp = performance.now(); // Reset timestamp to avoid jump
                  if (!this.gameLoopId) {
                     this.gameLoopId = requestAnimationFrame(this.gameLoop);
                 }
             } else {
                 // Pause
                 this.gameState = 'paused';
                 this.obstacle.style.animationPlayState = 'paused';
                 this.powerUp.style.animationPlayState = 'paused'; // Pause powerup if visible
                 this.backgroundMusic.pause();
                 this.pauseBtn.innerHTML = 'Resume';
                 this.showMessage("Paused");
                 // The game loop will stop itself because gameState is not 'running'
             }
        }

        jump() {
            if (this.gameState !== 'running' || this.dino.classList.contains('animateDino')) return; // Prevent double jump

            this.dino.classList.add('animateDino');
            this.jumpSound.currentTime = 0;
            this.jumpSound.play();

            // Remove the animation class after it finishes
             // Using 'animationend' event is more robust than setTimeout
             this.dino.addEventListener('animationend', () => {
                 this.dino.classList.remove('animateDino');
             }, { once: true }); // { once: true } automatically removes the listener
        }

        moveRight() {
            if (this.gameState !== 'running') return;
            const gameWidth = this.gameContainer.offsetWidth;
            const dinoWidth = this.dino.offsetWidth;
            let currentLeft = parseFloat(window.getComputedStyle(this.dino).left);
            let maxLeft = gameWidth - dinoWidth - 10; // 10px buffer from edge
             let moveAmount = gameWidth * (this.HORIZONTAL_MOVE_PERCENT / 100);

            let newLeft = Math.min(maxLeft, currentLeft + moveAmount);
            this.dino.style.left = newLeft + "px";
        }

        moveLeft() {
             if (this.gameState !== 'running') return;
             const gameWidth = this.gameContainer.offsetWidth; // Ensure we recalculate width in case of resize
             let currentLeft = parseFloat(window.getComputedStyle(this.dino).left);
             let minLeft = 10; // 10px buffer from edge
             let moveAmount = gameWidth * (this.HORIZONTAL_MOVE_PERCENT / 100);

            let newLeft = Math.max(minLeft, currentLeft - moveAmount);
            this.dino.style.left = newLeft + "px";
        }

         showMessage(text) {
            this.messageText.innerHTML = text;
            this.messageOverlay.classList.add('visible');
        }

        hideMessage() {
            this.messageOverlay.classList.remove('visible');
        }
    }

    // Initialize the Game
    const game = new Game();
});
