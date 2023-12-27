title = "Morse Code Fight";
description = `
[Space] to Input Morse
`;

characters = [
    `
llllll
llllll
llllll
llllll
llllll
llllll
`,`
yyyyyy
yyyyyy
yyyyyy
yyyyyy
yyyyyy
yyyyyy
`
];

const G = {
    WIDTH: 200,
    HEIGHT: 100,
    GRAVITY: 0.3,
    PLAYER_SPEED: 2,
    JUMP_FORCE: 7,
    ATTACK_RANGE: 20
};
let hitCounter = 5;


options = {
    viewSize: { x: G.WIDTH, y: G.HEIGHT },
    seed: 2,
    isPlayingBgm: true,
    theme: "pixel"
};
/**
 * @typedef {{
* pos: Vector,
* speedX: number,
* speedY: number,
* owner: string
* }} Bullet
*/

let bullets = [];

let player = {
    pos: vec(G.WIDTH * 0.25, G.HEIGHT - 20),
    vel: vec(0, 0),
    inputSequence: "",
    inputTimer: 0,
    inputCount: 0,
    shieldActive: false,
    shieldTimer: 0,
    isFirstInput: true,
    shieldColor: null 
};


let enemy = {
    pos: vec(G.WIDTH * 0.75, G.HEIGHT - 20),
    attackTimer: 240 // 4 seconds
};


const actionList = {
    "...": "Jump",
    ".-.": "Attack",
    "-..": "Defend"
};
function renderShield() {
    if (player.shieldActive) {
        color(player.shieldColor || "blue"); // Use shieldColor or default to blue
        arc(player.pos.x, player.pos.y, 10, 3, 0, PI); // Draw a half-circle shield
    }
}
function attackAction() {
    const bullet = {
        pos: vec(player.pos.x, player.pos.y),
        speedX: 5, 
        speedY: 0,
        owner: "player"
    };
    bullets.push(bullet);
}



function displayActionList() {
    color("black");
    let y = 10;
    let x = G.WIDTH - 150; 
    Object.keys(actionList).forEach(code => {
        text(`${code}: ${actionList[code]}`, x, y);
        y += 8; 
    });
}


function handleMorseCodeInput() {
    if (input.isPressed) {
        player.inputTimer++;
    }

    if (input.isJustReleased) {
        if (player.isFirstInput) {
            
            player.isFirstInput = false;
            player.inputTimer = 0;
            return;
        }

        if (player.inputTimer < 20) { 
            player.inputSequence += ".";
        } else { 
            player.inputSequence += "-";
        }
        player.inputTimer = 0;
        player.inputCount++;

        if (player.inputCount === 3) {
            executeAction(player.inputSequence);
            player.inputSequence = "";
            player.inputCount = 0;
        }
    }
}

function executeAction(sequence) {
    if (sequence === "-.-") {
        activateRedShield(); // Activate red shield cheat
    } else if (sequence === ".--") {
        addScore(10000); // Activate score boost cheat
    }else if (sequence === "...") {
        if (player.pos.y >= G.HEIGHT - 20) {
            player.vel.y = -G.JUMP_FORCE; 
        }
    } else if (sequence === ".-.") {
        attackAction(); 
    } else if (sequence === "-..") { 
        player.shieldActive = true;
        player.shieldTimer = 120; 
    }    
}

function checkPlayerActionsAgainstEnemy() {
    if (player.pos.distanceTo(enemy.pos) < G.ATTACK_RANGE) {
        addScore(10, enemy.pos); // Add score
        color("red");
        particle(enemy.pos);
    }
}
function activateRedShield() {
    play("powerUp");
    player.shieldActive = true;
    player.shieldTimer = 20 * 60; 
    player.shieldColor = "red"; 
}
function enemyAttackAction() {
    const direction = vec(player.pos.x - enemy.pos.x, player.pos.y - enemy.pos.y).normalize();
    const bulletSpeed = 3;

    const enemyBullet = {
        pos: vec(enemy.pos.x, enemy.pos.y),
        speedX: direction.x * bulletSpeed,
        speedY: direction.y * bulletSpeed,
        owner: "enemy"
    };
    bullets.push(enemyBullet);
}



function update() {
    play(“powerUp”)
    color("black");
    text(`HP: ${hitCounter}`, G.WIDTH - 50, 10);
    displayActionList();
    handleMorseCodeInput();

    player.vel.y += G.GRAVITY;
    player.pos.add(player.vel);
    player.pos.y = Math.min(player.pos.y, G.HEIGHT - 20);

    color("black");
    char("a", player.pos);

    color("black");
    char("b", enemy.pos);

    enemy.attackTimer--;
    if (enemy.attackTimer <= 0) {
        // Trigger enemy attack
        enemyAttackAction();

        // Reset the attack timer
        enemy.attackTimer = 180; // 3 seconds at 60 frames per second
    }
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.pos.x += bullet.speedX; // Update bullet position based on speedX
        bullet.pos.y += bullet.speedY; // Update bullet position based on speedY
    
        // Render the bullet
        color("red");
        box(bullet.pos, 2, 2);
    
        // Collision detection for player bullets
        if (bullet.owner === "player" && char("b", enemy.pos).isColliding.rect.red) {
            play("hit");
            color("yellow");
            particle(bullet.pos);
            bullets.splice(i, 1);
            addScore(10, bullet.pos);
        }
    
        // Collision detection for enemy bullets
        if (bullet.owner === "enemy" && char("a", player.pos).isColliding.rect.red) {
            play("hit");
            color("yellow");
            particle(bullet.pos);
            bullets.splice(i, 1);
            hitCounter--; // Increment hit counter
            if(hitCounter==0){
                play("explosion");
                hitCounter=5;
                end();
            }
        }
    
        // Shield collision detection for enemy bullets only
        if (bullet.owner === "enemy" && player.shieldActive && bullet.pos.distanceTo(player.pos) < 10) {
            play("lucky");
            color("blue");
            particle(bullet.pos); // Shield hit effect
            bullets.splice(i, 1); // Remove bullet
        }
    
        // Remove the bullet if it goes off screen
        if (bullet.pos.x > G.WIDTH || bullet.pos.x < 0 || bullet.pos.y > G.HEIGHT || bullet.pos.y < 0) {
            bullets.splice(i, 1);
        }
    }


    renderShield();
    if (player.shieldActive) {
        player.shieldTimer--;
        if (player.shieldTimer <= 0) {
            player.shieldActive = false;
        }
    }
    
    checkPlayerActionsAgainstEnemy();
}
