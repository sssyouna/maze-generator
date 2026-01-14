// Global variables for storing maze data and game state
let currentMazeData = null;
let currentPlayerPos = null;
let gameActive = false;
let startTime = null;
let moveCount = 0;
let timerInterval = null;

// DOM elements
const timerElement = document.getElementById('timer');
const moveCountElement = document.getElementById('move-count');
const scoreElement = document.getElementById('score');
const winModal = document.getElementById('win-modal');

// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// Start the game timer
function startTimer() {
    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

// Update the timer display
function updateTimer() {
    if (startTime) {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        timerElement.textContent = formatTime(elapsedSeconds);
    }
}

// Update move count
function updateMoveCount() {
    moveCount++;
    moveCountElement.textContent = moveCount.toString().padStart(2, '0');
    calculateScore();
}

// Calculate score based on time and moves
function calculateScore() {
    // Base score is 1000, decreased by time and moves
    const timePenalty = Math.floor((Date.now() - startTime) / 1000) * 2; // 2 points per second
    const movePenalty = moveCount * 1; // 1 point per move
    const score = Math.max(0, 1000 - timePenalty - movePenalty);
    scoreElement.textContent = score.toString().padStart(4, '0');
    return score;
}

// Show win modal
function showWinModal() {
    clearInterval(timerInterval);
    gameActive = false;
    
    // Update win modal stats
    const finalTime = timerElement.textContent;
    const finalMoves = moveCount;
    const finalScore = calculateScore();
    
    document.getElementById('final-time').textContent = finalTime;
    document.getElementById('final-moves').textContent = finalMoves;
    document.getElementById('final-score').textContent = finalScore;
    
    winModal.classList.remove('hidden');
}

// Hide win modal
function hideWinModal() {
    winModal.classList.add('hidden');
}

// Function to update player position visualization
function updatePlayerPosition(prevX = -1, prevY = -1) {
    if (!currentMazeData || !currentPlayerPos) return;
    
    const { w, h } = currentMazeData;
    const { x, y } = currentPlayerPos;
    
    // Validate position is within bounds
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    
    // Clear previous player position if provided
    if (prevX !== -1 && prevY !== -1) {
        const prevCell = document.getElementById(`cell-${prevY}-${prevX}`);
        if (prevCell) {
            // Only clear if the previous cell is not the start or end point
            if (prevX === 0 && prevY === 0) {
                prevCell.classList.add('start-cell');
                prevCell.classList.remove('player-cell');
            } else if (prevX === w - 1 && prevY === h - 1) {
                prevCell.classList.add('end-cell');
                prevCell.classList.remove('player-cell');
            } else {
                // Clear the background if it's just a regular path cell
                prevCell.classList.remove('player-cell');
                // Reset to default appearance (path)
                if (!prevCell.classList.contains('solution')) {
                    prevCell.style.background = '';
                }
            }
        }
    }
    
    // Get the current cell element
    const cell = document.getElementById(`cell-${y}-${x}`);
    if (cell) {
        // Add player indicator (different from start/end)
        cell.classList.add('player-cell');
    }
    
    // Make sure start and end points retain their classes if they are not the current player position
    if (!(x === 0 && y === 0)) {
        const startCell = document.getElementById(`cell-0-0`);
        if (startCell) startCell.classList.add('start-cell');
    }
    if (!(x === w - 1 && y === h - 1)) {
        const endCell = document.getElementById(`cell-${h-1}-${w-1}`);
        if (endCell) endCell.classList.add('end-cell');
    }
}

// Function to find and draw solution path
function findAndDrawSolution(mazeData) {
    const { hor, ver, w, h } = mazeData;
    
    // BFS to find solution path from start (0,0) to end (w-1, h-1)
    const queue = [{x: 0, y: 0, path: [{x: 0, y: 0}]}];
    const visited = Array(h).fill().map(() => Array(w).fill(false));
    visited[0][0] = true;
    
    while (queue.length > 0) {
        const {x, y, path} = queue.shift();
        
        if (x === w - 1 && y === h - 1) {
            // Found solution path
            drawSolutionPath(path);
            return;
        }
        
        // Check all 4 directions
        // Up: check if there's no top wall for current cell
        if (y > 0 && !hor[y][x] && !visited[y-1][x]) {
            visited[y-1][x] = true;
            queue.push({x: x, y: y-1, path: [...path, {x: x, y: y-1}] });
        }
        
        // Down: check if there's no bottom wall for current cell
        if (y < h-1 && !hor[y+1][x] && !visited[y+1][x]) {
            visited[y+1][x] = true;
            queue.push({x: x, y: y+1, path: [...path, {x: x, y: y+1}] });
        }
        
        // Left: check if there's no left wall for current cell
        if (x > 0 && !ver[y][x] && !visited[y][x-1]) {
            visited[y][x-1] = true;
            queue.push({x: x-1, y: y, path: [...path, {x: x-1, y: y}] });
        }
        
        // Right: check if there's no right wall for current cell
        if (x < w-1 && !ver[y][x+1] && !visited[y][x+1]) {
            visited[y][x+1] = true;
            queue.push({x: x+1, y: y, path: [...path, {x: x+1, y: y}] });
        }
    }
    
    console.log("No solution found");
}

// Function to draw the solution path
function drawSolutionPath(path) {
    // Reset all cell backgrounds first
    const table = document.getElementById("maze-table");
    const rows = table.querySelectorAll("tr");
    
    for (let y = 0; y < rows.length; y++) {
        const cells = rows[y].querySelectorAll("td");
        for (let x = 0; x < cells.length; x++) {
            // Reset to default (might have been highlighted before)
            if (!(x === 0 && y === 0) && !(x === currentMazeData.w - 1 && y === currentMazeData.h - 1)) {
                if (!cells[x].classList.contains("start-cell") && !cells[x].classList.contains("end-cell")) {
                    cells[x].classList.remove("solution");
                }
            }
        }
    }
    
    // Highlight the solution path
    for (const pos of path) {
        const cell = document.getElementById(`cell-${pos.y}-${pos.x}`);  // Use ID to get cell
        if (cell) {
            // Don't override entrance/exit classes
            if (!(pos.x === 0 && pos.y === 0) && !(pos.x === currentMazeData.w - 1 && pos.y === currentMazeData.h - 1)) {
                cell.classList.add("solution");  // Add CSS class for solution path
            }
        }
    }
}

// Function to draw the maze
function drawMaze(data) {
    const { hor, ver, w, h } = data;
    const table = document.getElementById("maze-table");
    table.innerHTML = "";

    for (let y = 0; y < h; y++) {
        const tr = document.createElement("tr");

        for (let x = 0; x < w; x++) {
            const td = document.createElement("td");
            td.id = `cell-${y}-${x}`; // Add unique ID to each cell
            td.style.width = "30px";
            td.style.height = "30px";
            td.style.boxSizing = "border-box";
            td.style.margin = "0"; // Ensure no margins cause gaps

            // Apply borders based on walls
            // TOP border
            td.style.borderTop = hor[y][x] ? "2px solid #333" : "none";
            
            // BOTTOM border
            td.style.borderBottom = hor[y + 1][x] ? "2px solid #333" : "none";
            
            // LEFT border
            td.style.borderLeft = ver[y][x] ? "2px solid #333" : "none";
            
            // RIGHT border
            td.style.borderRight = ver[y][x + 1] ? "2px solid #333" : "none";

            // Add classes for start and end points
            if (x === 0 && y === 0) {
                td.classList.add('start-cell');  // Start point (red)
            }
            if (x === w - 1 && y === h - 1) {
                td.classList.add('end-cell');  // End point (green)
            }

            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
}

// Event listeners
document.getElementById("generatebtn").addEventListener("click", function() {
    const width = Math.max(2, Math.min(30, parseInt(document.getElementById("w").value)));
    const height = Math.max(2, Math.min(50, parseInt(document.getElementById("h").value)));

    if (!width || !height) {
        alert("Please enter both width and height");
        return;
    }

    fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            width: width,
            height: height
        })
    })
    .then(res => res.json())
    .then(data => {
        currentMazeData = data; // Store for solution
        currentPlayerPos = {x: data.w - 1, y: data.h - 1};
        drawMaze(data);
        updatePlayerPosition();
        
        // Reset game state
        resetGameState();
    })
    .catch(err => console.error(err));
});

document.getElementById("show-solutionbtn").addEventListener("click", function() {
    if (currentMazeData) {
        findAndDrawSolution(currentMazeData);
    }
});

document.getElementById("startbtn").addEventListener("click", function() {
    // Reset the game state but keep the same maze structure
    if (currentMazeData) {
        // Reset player position to end (green) and remove solution path
        drawMaze(currentMazeData);
        // Set initial player position to end point
        currentPlayerPos = {x: currentMazeData.w - 1, y: currentMazeData.h - 1};
        // Update player position visualization
        updatePlayerPosition();
        
        // Reset game state
        resetGameState();
    } else {
        // If no maze exists, generate a default one
        const width = Math.max(2, Math.min(30, parseInt(document.getElementById("w").value)));
        const height = Math.max(2, Math.min(50, parseInt(document.getElementById("h").value)));
        
        if (!width || !height) {
            alert("Please enter both width and height");
            return;
        }
        
        fetch("/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                width: width,
                height: height
            })
        })
        .then(res => res.json())
        .then(data => {
            currentMazeData = data; // Store for solution
            currentPlayerPos = {x: data.w - 1, y: data.h - 1};
            drawMaze(data);
            updatePlayerPosition();
            
            // Reset game state
            resetGameState();
        })
        .catch(err => console.error(err));
    }
});

// Restart button functionality
document.getElementById("restartbtn").addEventListener("click", function() {
    if (currentMazeData) {
        // Reset game state without regenerating the maze
        drawMaze(currentMazeData);
        // Set player position back to end point
        currentPlayerPos = {x: currentMazeData.w - 1, y: currentMazeData.h - 1};
        // Update player position visualization
        updatePlayerPosition();
        // Reset game state
        resetGameState();
    }
});

// Close modal button
document.getElementById("close-modal").addEventListener("click", function() {
    hideWinModal();
    resetGameState();
});

// Reset game state
function resetGameState() {
    moveCount = 0;
    updateMoveCount();
    updateTimer();
    clearInterval(timerInterval);
    gameActive = false;
}

// Keyboard controls for player movement
document.addEventListener('keydown', function(e) {
    if (!currentMazeData || !currentPlayerPos || !gameActive) return;
    
    const { hor, ver, w, h } = currentMazeData;
    let { x, y } = currentPlayerPos;
    let moved = false;
    
    switch(e.key) {
        case 'ArrowUp':
            if (y > 0 && !hor[y][x]) { // Check if no top wall
                y--;
                moved = true;
            }
            e.preventDefault(); // Prevent page scrolling
            break;
        case 'ArrowDown':
            if (y < h - 1 && !hor[y + 1][x]) { // Check if no bottom wall
                y++;
                moved = true;
            }
            e.preventDefault(); // Prevent page scrolling
            break;
        case 'ArrowLeft':
            if (x > 0 && !ver[y][x]) { // Check if no left wall
                x--;
                moved = true;
            }
            e.preventDefault(); // Prevent page scrolling
            break;
        case 'ArrowRight':
            if (x < w - 1 && !ver[y][x + 1]) { // Check if no right wall
                x++;
                moved = true;
            }
            e.preventDefault(); // Prevent page scrolling
            break;
    }
    
    if (moved) {
        // Track previous position
        const prevX = currentPlayerPos.x;
        const prevY = currentPlayerPos.y;
        
        // Update player position
        currentPlayerPos = { x, y };
        
        // Update visualization with previous position
        updatePlayerPosition(prevX, prevY);
        
        // Update move count
        updateMoveCount();
        
        // Check if player reached start point (win condition)
        if (x === 0 && y === 0) {
            setTimeout(() => {
                findAndDrawSolution(currentMazeData);
                showWinModal();
            }, 100);
        }
    }
});

// Start game when player begins moving
document.addEventListener('keydown', function(e) {
    if (currentMazeData && currentPlayerPos && !gameActive) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            gameActive = true;
            startTimer();
        }
    }
});

// Prevent arrow key scrolling when focused on the page
document.addEventListener('keydown', function(e) {
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (currentMazeData && currentPlayerPos) {
            e.preventDefault();
        }
    }
}, { passive: false });