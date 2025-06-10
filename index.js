// Game state
let game = {
    canvas: null,
    ctx: null,
    buildings: [],
    gorillas: [null, null],
    currentPlayer: 0,
    scores: [0, 0],
    wind: 0,
    gravity: 9.8,
    animating: false,
    gameOver: false,
    gorillaImage: null
};

// Initialize the game
function initGame() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');

    // Load gorilla image
    game.gorillaImage = new Image();
    game.gorillaImage.src = 'gorilla.png';
    game.gorillaImage.onload = function() {
        console.log('Gorilla image loaded successfully');
        // Start the game after the image is loaded
        startNewGame();
    };
    game.gorillaImage.onerror = function() {
        console.error('Error loading gorilla image');
        // Start the game even if the image fails to load
        startNewGame();
    };

    // Add Enter key listeners to inputs
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                fireShot();
            }
        });
    });

    // Show loading message
    showMessage("Loading game...");
}

function startNewGame() {
    game.animating = false;
    game.gameOver = false;
    game.currentPlayer = 0;

    generateCity();
    placeGorillas();
    generateWind();
    updateUI();
    drawGame();
    showMessage("Game Started! Player 1's turn.");
}

function generateCity() {
    game.buildings = [];
    const width = game.canvas.width;
    const height = game.canvas.height;

    let x = 0;
    let buildingIndex = 0;

    // Define height categories
    const minHeight = 30;
    const maxHeight = 280;
    const heightRange = maxHeight - minHeight;

    // Create a base pattern with varied heights
    const basePattern = [];
    for (let i = 0; i < 20; i++) { // More than enough for all buildings
        // Randomly assign each building to a height category
        const heightCategory = Math.floor(Math.random() * 3); // 0=short, 1=medium, 2=tall

        let heightPercentage;
        switch (heightCategory) {
            case 0: // Short buildings (20-40% of max height)
                heightPercentage = 0.2 + Math.random() * 0.2;
                break;
            case 1: // Medium buildings (40-70% of max height)
                heightPercentage = 0.4 + Math.random() * 0.3;
                break;
            case 2: // Tall buildings (70-100% of max height)
                heightPercentage = 0.7 + Math.random() * 0.3;
                break;
        }

        basePattern.push(heightPercentage);
    }

    // Shuffle the pattern to avoid predictable sequences
    for (let i = basePattern.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [basePattern[i], basePattern[j]] = [basePattern[j], basePattern[i]];
    }

    while (x < width) {
        const buildingWidth = 40 + Math.random() * 60;

        // Get height from pattern and add some random variation
        const patternHeight = basePattern[buildingIndex % basePattern.length];
        const baseHeight = minHeight + (patternHeight * heightRange);
        const variation = (Math.random() - 0.5) * 40; // Add some random variation

        let buildingHeight = Math.max(minHeight, Math.min(maxHeight, baseHeight + variation));

        // Create building with window states
        const building = {
            x: x,
            y: height - buildingHeight,
            width: buildingWidth,
            height: buildingHeight,
            color: `rgb(${100 + Math.random() * 100}, ${80 + Math.random() * 80}, ${60 + Math.random() * 60})`,
            windows: []
        };

        // Initialize window states (true = lit, false = unlit)
        for (let wx = building.x + 5; wx < building.x + building.width - 5; wx += 12) {
            for (let wy = building.y + 8; wy < building.y + building.height - 8; wy += 15) {
                building.windows.push({
                    x: wx,
                    y: wy,
                    lit: Math.random() > 0.3 // Random window lighting
                });
            }
        }

        game.buildings.push(building);
        x += buildingWidth + 2;
        buildingIndex++;
    }
}

function placeGorillas() {
    const numBuildings = game.buildings.length;

    // Place gorilla 1 on second or third building from left
    const building1Index = Math.floor(Math.random() * 2) + 1;
    const building1 = game.buildings[building1Index];
    game.gorillas[0] = {
        x: building1.x + building1.width / 2 - 15,
        y: building1.y - 15, // Adjusted to account for the -15 offset in drawGorilla
        alive: true
    };

    // Place gorilla 2 on second or third building from right
    const building2Index = numBuildings - 2 - Math.floor(Math.random() * 2);
    const building2 = game.buildings[building2Index];
    game.gorillas[1] = {
        x: building2.x + building2.width / 2 - 15,
        y: building2.y - 15, // Adjusted to account for the -15 offset in drawGorilla
        alive: true
    };
}

function generateWind() {
    game.wind = (Math.random() - 0.5) * 20; // Wind between -10 and 10
}

function drawGame() {
    const ctx = game.ctx;
    const canvas = game.canvas;

    // Clear canvas
    ctx.fillStyle = '#001';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw buildings
    game.buildings.forEach(building => {
        ctx.fillStyle = building.color;
        ctx.fillRect(building.x, building.y, building.width, building.height);

        // Draw windows using stored window states
        ctx.fillStyle = '#ff4';
        building.windows.forEach(window => {
            if (window.lit) {
                ctx.fillRect(window.x, window.y, 6, 8);
            }
        });
    });

    // Draw wind arrow
    drawWindArrow();

    // Draw sun
    drawSun();

    // Draw gorillas
    game.gorillas.forEach((gorilla, index) => {
        if (gorilla && gorilla.alive) {
            drawGorilla(gorilla.x, gorilla.y, index);
        }
    });
}

function drawGorilla(x, y, playerIndex) {
    const ctx = game.ctx;

    if (game.gorillaImage && game.gorillaImage.complete) {
        // Draw the gorilla image
        // Original image is 85x84px, scale it down to approximately 30x30 pixels
        const scaledWidth = 30;
        const scaledHeight = 30;
        // Position adjustments to center the gorilla properly
        ctx.drawImage(game.gorillaImage, x, y - 15, scaledWidth, scaledHeight);
    } else {
        // Fallback to original drawing if image isn't loaded
        // Gorilla body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, 30, 30);

        // Gorilla head
        ctx.fillRect(x + 5, y - 15, 20, 20);

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 8, y - 10, 3, 3);
        ctx.fillRect(x + 19, y - 10, 3, 3);
    }

    // Player number - keep this to identify players
    ctx.fillStyle = playerIndex === 0 ? '#0f0' : '#f0f';
    ctx.font = '12px monospace';
    ctx.fillText(`P${playerIndex + 1}`, x + 8, y - 18);
}

function drawSun() {
    const ctx = game.ctx;
    const centerX = game.canvas.width / 2;
    const centerY = 40;

    // Sun body
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fill();

    // Sun rays
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const startX = centerX + Math.cos(angle) * 25;
        const startY = centerY + Math.sin(angle) * 25;
        const endX = centerX + Math.cos(angle) * 35;
        const endY = centerY + Math.sin(angle) * 35;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    // Sun face
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX - 5, centerY - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 5, centerY - 3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 2, 8, 0, Math.PI);
    ctx.stroke();
}

function drawWindArrow() {
    const ctx = game.ctx;
    const centerX = game.canvas.width / 2;
    const centerY = game.canvas.height - 20;

    // Always show wind indicator, even if very small
    const windStrength = Math.abs(game.wind);
    const arrowLength = Math.max(20, windStrength * 5); // Minimum length of 20
    const direction = game.wind > 0 ? 1 : -1;

    // Color based on wind strength
    let windColor;
    if (windStrength < 3) {
        windColor = '#0ff'; // Light wind - cyan
    } else if (windStrength < 7) {
        windColor = '#0f0'; // Medium wind - green
    } else {
        windColor = '#f00'; // Strong wind - red
    }

    ctx.strokeStyle = windColor;
    ctx.lineWidth = Math.min(5, Math.max(2, windStrength / 2)); // Line width based on strength

    // Arrow shaft
    ctx.beginPath();
    ctx.moveTo(centerX - arrowLength * direction / 2, centerY);
    ctx.lineTo(centerX + arrowLength * direction / 2, centerY);
    ctx.stroke();

    // Arrow head
    const headSize = Math.min(15, Math.max(8, windStrength));
    ctx.beginPath();
    ctx.moveTo(centerX + arrowLength * direction / 2, centerY);
    ctx.lineTo(centerX + (arrowLength / 2 - headSize) * direction, centerY - headSize / 2);
    ctx.moveTo(centerX + arrowLength * direction / 2, centerY);
    ctx.lineTo(centerX + (arrowLength / 2 - headSize) * direction, centerY + headSize / 2);
    ctx.stroke();

    // Add small wind particles for visual effect
    ctx.fillStyle = windColor;
    for (let i = 0; i < windStrength * 2; i++) {
        const particleX = centerX + (Math.random() - 0.5) * arrowLength * direction;
        const particleY = centerY + (Math.random() - 0.5) * 10;
        ctx.beginPath();
        ctx.arc(particleX, particleY, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}

function fireShot(playerIndex) {
    if (game.animating || game.gameOver) return;

    // Only allow the current player to fire
    if (playerIndex !== game.currentPlayer) {
        showMessage(`It's Player ${game.currentPlayer + 1}'s turn!`);
        return;
    }

    const player = playerIndex;
    const angleInput = document.getElementById(`player${player + 1}Angle`);
    const velocityInput = document.getElementById(`player${player + 1}Velocity`);

    let angle = parseFloat(angleInput.value);
    let velocity = parseFloat(velocityInput.value);

    // Validate inputs
    if (isNaN(angle) || angle < 0 || angle > 360) {
        showMessage("Invalid angle! Must be between 0 and 360.");
        return;
    }

    if (isNaN(velocity) || velocity < 1 || velocity > 200) {
        showMessage("Invalid velocity! Must be between 1 and 200.");
        return;
    }

    // Convert angle for player 2 (they shoot left)
    if (player === 1) {
        // Ensure player 2 throws to the left by using the correct angle transformation
        angle = 180 - angle;
    }

    // Convert to radians
    angle = (angle * Math.PI) / 180;

    game.animating = true;
    showMessage(`Player ${player + 1} fires!`);

    // Calculate offset to start banana outside the gorilla
    const offsetDistance = 20; // Distance in pixels to offset the banana
    const offsetX = Math.cos(angle) * offsetDistance;
    const offsetY = -Math.sin(angle) * offsetDistance; // Negative because y-axis is inverted

    // Start banana animation with offset position
    animateBanana(
        game.gorillas[player].x + 15 + offsetX,
        game.gorillas[player].y + 15 + offsetY,
        angle,
        velocity,
        player
    );
}

function animateBanana(startX, startY, angle, velocity, shooterIndex) {
    const ctx = game.ctx;
    let t = 0;
    const dt = 0.025; // Reduced from 0.05 to slow down the game
    let frameCount = 0; // Add frame counter to track animation progress

    const initialVelX = Math.cos(angle) * velocity * 4; // Increased from 2 to 4 for better range
    const initialVelY = -Math.sin(angle) * velocity * 4; // Increased from 2 to 4 for better range

    function animate() {
        if (!game.animating) return;

        frameCount++; // Increment frame counter

        // Calculate position
        const x = startX + initialVelX * t + 0.5 * game.wind * t * t;
        const y = startY + initialVelY * t + 0.5 * game.gravity * 25 * t * t; // Reduced gravity effect from 50 to 25

        // Clear and redraw
        drawGame();

        // Draw banana - made larger and more visible
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2); // Increased size from 3 to 5
        ctx.fill();

        // Add a small trail for better visibility
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(x - initialVelX * dt * 2, y - initialVelY * dt * 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Check for collisions - only after a few frames to prevent self-collision at start
        const collision = frameCount > 3 ? checkCollisions(x, y, shooterIndex) : { hit: false };

        if (collision.hit) {
            game.animating = false;

            if (collision.type === 'gorilla') {
                // Gorilla hit!
                const hitPlayer = collision.player;
                game.gorillas[hitPlayer].alive = false;

                // Create explosion
                explode(x, y);

                if (hitPlayer === shooterIndex) {
                    showMessage(`Player ${shooterIndex + 1} hit themselves! Oops!`);
                } else {
                    showMessage(`Player ${shooterIndex + 1} hits Player ${hitPlayer + 1}!`);
                    game.scores[shooterIndex]++;
                    updateUI();

                    if (game.scores[shooterIndex] >= 3) {
                        endGame(shooterIndex);
                        return;
                    }
                }

                setTimeout(() => {
                    startNewRound();
                }, 2000);
            } else {
                // Building hit
                explode(x, y);
                setTimeout(() => {
                    switchPlayer();
                }, 1000);
            }
            return;
        }

        // Check if banana is off screen
        if (x < -10 || x > game.canvas.width + 10 || y > game.canvas.height + 10) {
            game.animating = false;
            showMessage("Shot missed!");
            setTimeout(() => {
                switchPlayer();
            }, 1000);
            return;
        }

        t += dt;
        requestAnimationFrame(animate);
    }

    animate();
}

function checkCollisions(x, y, shooterIndex) {
    // Check gorilla collisions - fixed to properly return collision result
    for (let index = 0; index < game.gorillas.length; index++) {
        const gorilla = game.gorillas[index];
        if (gorilla && gorilla.alive) {
            if (x >= gorilla.x && x <= gorilla.x + 30 &&
                y >= gorilla.y - 15 && y <= gorilla.y + 30) {
                return { hit: true, type: 'gorilla', player: index };
            }
        }
    }

    // Check building collisions
    for (let building of game.buildings) {
        if (x >= building.x && x <= building.x + building.width &&
            y >= building.y && y <= building.y + building.height) {
            return { hit: true, type: 'building' };
        }
    }

    return { hit: false };
}

function explode(x, y) {
    const ctx = game.ctx;
    const radius = 40;

    // Create explosion crater in buildings
    game.buildings.forEach(building => {
        if (x >= building.x - radius && x <= building.x + building.width + radius &&
            y >= building.y - radius && y <= building.y + building.height + radius) {

            // Simple crater - just make the building shorter in explosion area
            const craterLeft = Math.max(building.x, x - radius);
            const craterRight = Math.min(building.x + building.width, x + radius);

            if (craterLeft < craterRight && y >= building.y - radius) {
                const craterHeight = radius - Math.abs(y - (building.y + building.height));
                if (craterHeight > 0) {
                    building.height = Math.max(0, building.height - craterHeight);
                    building.y += craterHeight;

                    // Update windows: remove any that are now outside the building
                    building.windows = building.windows.filter(window => {
                        return window.y >= building.y &&
                               window.y + 8 <= building.y + building.height;
                    });
                }
            }
        }
    });

    // Draw explosion effect
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            drawGame();

            // Explosion particles
            ctx.fillStyle = i % 2 === 0 ? '#f40' : '#fa0';
            for (let j = 0; j < 10; j++) {
                const angle = (j / 10) * Math.PI * 2;
                const dist = (i / 20) * radius;
                const px = x + Math.cos(angle) * dist;
                const py = y + Math.sin(angle) * dist;

                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }, i * 50);
    }
}

function switchPlayer() {
    game.currentPlayer = 1 - game.currentPlayer;
    updateUI();
    showMessage(`Player ${game.currentPlayer + 1}'s turn.`);
}

function startNewRound() {
    // Reset gorillas
    game.gorillas[0].alive = true;
    game.gorillas[1].alive = true;

    // Generate new city and positions
    generateCity();
    placeGorillas();
    generateWind();

    drawGame();
    switchPlayer();
}

function endGame(winner) {
    game.gameOver = true;
    showMessage(`🎉 Player ${winner + 1} wins the match! 🎉`);

    // Reset scores for next match
    setTimeout(() => {
        game.scores = [0, 0];
        updateUI();
        showMessage("Click 'NEW GAME' to play again!");
    }, 3000);
}

function updateUI() {
    document.getElementById('player1Score').textContent = `Player 1: ${game.scores[0]}`;
    document.getElementById('player2Score').textContent = `Player 2: ${game.scores[1]}`;
    document.getElementById('windInfo').textContent = `Wind: ${game.wind.toFixed(1)}`;

    // Update active player controls
    document.getElementById('player1Controls').classList.toggle('active', game.currentPlayer === 0);
    document.getElementById('player2Controls').classList.toggle('active', game.currentPlayer === 1);
}

function showMessage(message) {
    document.getElementById('gameMessage').textContent = message;
}

// Initialize the game when page loads
window.onload = initGame;
