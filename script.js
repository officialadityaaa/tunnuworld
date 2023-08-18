score = 0;
cross = true;

audios = new Audio('tunnu.mp3');
audiogo = new Audio('gameover.mp3');
setTimeout(() => {
    audios.play()
}, 500);
//if any kew press 

document.onkeydown = function (e) {
    console.log("Key code is: ", e.keyCode)

    if (e.keyCode == 38) {
        dino = document.querySelector('.dino');
        dino.classList.add('animateDino');
        setTimeout(() => {
            dino.classList.remove('animateDino')
        }, 700);
    }
    if (e.keyCode == 39) {
        dino = document.querySelector('.dino');
        dinoX = parseInt(window.getComputedStyle(dino, null).getPropertyValue('left'));
        dino.style.left = dinoX + 112 + "px";
    }
    if (e.keyCode == 37) {
        dino = document.querySelector('.dino');
        dinoX = parseInt(window.getComputedStyle(dino, null).getPropertyValue('left'));
        dino.style.left = (dinoX - 112) + "px";
    }
}

setInterval(() => {
    dino = document.querySelector('.dino');
    gameOver = document.querySelector('.gameOver');
    obstacle = document.querySelector('.obstacle');
sc=document.querySelector('.scoreCont');
    dx = parseInt(window.getComputedStyle(dino, null).getPropertyValue('left'));
    dy = parseInt(window.getComputedStyle(dino, null).getPropertyValue('top'));

    ox = parseInt(window.getComputedStyle(obstacle, null).getPropertyValue('left'));
    oy = parseInt(window.getComputedStyle(obstacle, null).getPropertyValue('top'));

    offsetX = Math.abs(dx - ox);
    offsetY = Math.abs(dy - oy);
    // console.log(offsetX, offsetY)

    if (offsetX < 100 && offsetY < 150) {
        gameOver.innerHTML = "Game Over - Reload to Play Again"
        obstacle.classList.remove('obstacleAni')
   cross=false;
   dino.classList.add('dd');
   obstacle.classList.add('dd');
   sc.classList.add('cont')
  
        audiogo.play();
        setTimeout(() => {
            audiogo.pause();
            audio.pause();
        }, 2000);
    }
    else if (offsetX < 145 && cross) {
        obstacle.style.left = window.innerWidth + "px";
        score += 1;
        updateScore(score);
        cross = false;
        setTimeout(() => {
            cross = true;
        }, 500);
        setTimeout(() => {
            aniDur = parseFloat(window.getComputedStyle(obstacle, null).getPropertyValue('animation-duration'));
            newDur = aniDur - 0.1;
            obstacle.style.animationDuration = newDur + 's';
            obstacle.style.left = window.innerWidth + "px"; // Set the obstacle to start from the right edge of the screen
            setTimeout(() => {
                obstacle.classList.remove('obstacleAni');
                setTimeout(() => {
                    obstacle.classList.add('obstacleAni');
                    
                }, 100);
            }, 100);
            // console.log('New animation duration: ', newDur)
        }, 50);
   

    }

}, 10);

function updateScore(score) {
    sc.innerHTML = "Your Score: " + score;
     // Set the obstacle to start from the right edge of the screen
}