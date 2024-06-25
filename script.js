const board = [];
const rows = 6;
const cols = 7;
let currentPlayer = 1;
let gameOver = false;
let vsAI = false;
let aiDifficulty = 'medium';

const gameBoard = document.getElementById('gameBoard');
const resetBtn = document.getElementById('resetBtn');
const aiToggle = document.getElementById('aiToggle');
const winnerModal = document.getElementById('winnerModal');
const winnerText = document.getElementById('winnerText');
const playAgainBtn = document.getElementById('playAgainBtn');
const dropSound = document.getElementById('dropSound');
const winSound = document.getElementById('winSound');
const instructionsModal = document.getElementById('instructionsModal');
const closeInstructions = document.getElementById('closeInstructions');
const aiDifficultySelect = document.getElementById('aiDifficulty');
const turnIndicator = document.getElementById('turnIndicator');
const scoreDisplay = document.getElementById('scoreDisplay');

let scores = { player1: 0, player2: 0 };

function initializeBoard() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < rows; i++) {
        board[i] = [];
        for (let j = 0; j < cols; j++) {
            board[i][j] = 0;
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.col = j;
            cell.addEventListener('click', () => handleCellClick(j));
            gameBoard.appendChild(cell);
        }
    }
    updateTurnIndicator();
    updateScoreDisplay();
}

function handleCellClick(col) {
    if (gameOver || (vsAI && currentPlayer === 2)) return;
    makeMove(col);
}

function makeMove(col) {
    const row = getLowestEmptyRow(col);
    if (row === -1) return

    board[row][col] = currentPlayer;
    updateCell(row, col);
    playDropSound();

    if (checkWin(row, col)) {
        gameOver = true;
        showWinner();
        updateScores();
    } else if (checkDraw()) {
        gameOver = true;
        showDraw();
    } else {
        switchPlayer();
        if (vsAI && currentPlayer === 2) {
            setTimeout(aiMove, 500);
        }
    }
}

function getLowestEmptyRow(col) {
    for (let row = rows - 1; row >= 0; row--) {
        if (board[row][col] === 0) return row;
    }
    return -1;
}

function updateCell(row, col) {
    const index = row * cols + col;
    const cell = gameBoard.children[index];
    cell.classList.add(`player${currentPlayer}`);
    cell.classList.add('dropped');
    setTimeout(() => cell.classList.remove('dropped'), 500);
}

function checkWin(row, col) {
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    return directions.some(([dx, dy]) => {
        let count = 1;
        for (let i = 1; i <= 3; i++) {
            const newRow = row + dx * i;
            const newCol = col + dy * i;
            if (isValidCell(newRow, newCol) && board[newRow][newCol] === currentPlayer) {
                count++;
            } else {
                break;
            }
        }
        for (let i = 1; i <= 3; i++) {
            const newRow = row - dx * i;
            const newCol = col - dy * i;
            if (isValidCell(newRow, newCol) && board[newRow][newCol] === currentPlayer) {
                count++;
            } else {
                break;
            }
        }
        return count >= 4;
    });
}

function isValidCell(row, col) {
    return row >= 0 && row < rows && col >= 0 && col < cols;
}

function checkDraw() {
    return board.every(row => row.every(cell => cell !== 0));
}

function showWinner() {
    winnerText.textContent = `Player ${currentPlayer} wins!`;
    winnerModal.style.display = 'flex';
    playWinSound();
}

function showDraw() {
    winnerText.textContent = "It's a draw!";
    winnerModal.style.display = 'flex';
}

function resetGame() {
    board.forEach(row => row.fill(0));
    Array.from(gameBoard.children).forEach(cell => {
        cell.className = 'cell';
    });
    currentPlayer = 1;
    gameOver = false;
    winnerModal.style.display = 'none';
    updateTurnIndicator();
    if (vsAI && currentPlayer === 2) {
        setTimeout(aiMove, 500);
    }
}

function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateTurnIndicator();
}

function updateTurnIndicator() {
    turnIndicator.textContent = `Player ${currentPlayer}'s Turn`;
    turnIndicator.className = `player${currentPlayer}-text`;
}

function updateScores() {
    scores[`player${currentPlayer}`]++;
    updateScoreDisplay();
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `Player 1: ${scores.player1} | Player 2: ${scores.player2}`;
}

function aiMove() {
    if (gameOver) return;

    let col;
    switch (aiDifficulty) {
        case 'easy':
            col = makeRandomMove();
            break;
        case 'medium':
            col = makeMediumMove();
            break;
        case 'hard':
            col = makeHardMove();
            break;
        default:
            col = makeMediumMove();
    }

    makeMove(col);
}

function makeRandomMove() {
    let availableCols = [];
    for (let col = 0; col < cols; col++) {
        if (board[0][col] === 0) availableCols.push(col);
    }
    return availableCols[Math.floor(Math.random() * availableCols.length)];
}

function makeMediumMove() {
    for (let col = 0; col < cols; col++) {
        let row = getLowestEmptyRow(col);
        if (row !== -1) {
            board[row][col] = 2;
            if (checkWin(row, col)) {
                board[row][col] = 0;
                return col;
            }
            board[row][col] = 0;
        }
    }

    for (let col = 0; col < cols; col++) {
        let row = getLowestEmptyRow(col);
        if (row !== -1) {
            board[row][col] = 1;
            if (checkWin(row, col)) {
                board[row][col] = 0;
                return col;
            }
            board[row][col] = 0;
        }
    }

    if (board[0][3] === 0) return 3;

    return makeRandomMove();
}

function makeHardMove() {
    return minimax(board, 5, -Infinity, Infinity, true)[1];
}

function minimax(board, depth, alpha, beta, maximizingPlayer) {
    const availableMoves = getAvailableMoves(board);
    
    if (depth === 0 || availableMoves.length === 0 || checkGameEnd(board)) {
        return [evaluateBoard(board), null];
    }

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        let bestMove = null;
        for (let col of availableMoves) {
            let newBoard = makeMoveOnBoard(board, col, 2);
            let evalScore = minimax(newBoard, depth - 1, alpha, beta, false)[0];
            if (evalScore > maxEval) {
                maxEval = evalScore;
                bestMove = col;
            }
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return [maxEval, bestMove];
    } else {
        let minEval = Infinity;
        let bestMove = null;
        for (let col of availableMoves) {
            let newBoard = makeMoveOnBoard(board, col, 1);
            let evalScore = minimax(newBoard, depth - 1, alpha, beta, true)[0];
            if (evalScore < minEval) {
                minEval = evalScore;
                bestMove = col;
            }
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return [minEval, bestMove];
    }
}

function getAvailableMoves(board) {
    let moves = [];
    for (let col = 0; col < cols; col++) {
        if (board[0][col] === 0) moves.push(col);
    }
    return moves;
}

function makeMoveOnBoard(board, col, player) {
    let newBoard = board.map(row => [...row]);
    for (let row = rows - 1; row >= 0; row--) {
        if (newBoard[row][col] === 0) {
            newBoard[row][col] = player;
            break;
        }
    }
    return newBoard;
}

function checkGameEnd(board) {
    return checkWinningMove(board, 1) || checkWinningMove(board, 2) || board[0].every(cell => cell !== 0);
}

function checkWinningMove(board, player) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col] === player) {
                if (checkWin(row, col)) return true;
            }
        }
    }
    return false;
}

function evaluateBoard(board) {
    let score = 0;
    score += evaluateLines(board, 2) - evaluateLines(board, 1);
    return score;
}

function evaluateLines(board, player) {
    let score = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols - 3; col++) {
            score += evaluateLine(board, row, col, 0, 1, player);
        }
    }
    for (let row = 0; row < rows - 3; row++) {
        for (let col = 0; col < cols; col++) {
            score += evaluateLine(board, row, col, 1, 0, player);
        }
    }
    for (let row = 3; row < rows; row++) {
        for (let col = 0; col < cols - 3; col++) {
            score += evaluateLine(board, row, col, -1, 1, player);
        }
    }
    for (let row = 0; row < rows - 3; row++) {
        for (let col = 0; col < cols - 3; col++) {
            score += evaluateLine(board, row, col, 1, 1, player);
        }
    }
    return score;
}

function evaluateLine(board, row, col, dRow, dCol, player) {
    let score = 0;
    let ours = 0;
    let empty = 0;

    for (let i = 0; i < 4; i++) {
        if (board[row][col] === player) ours++;
        else if (board[row][col] === 0) empty++;
        row += dRow;
        col += dCol;
    }

    if (ours === 4) score += 100;
    else if (ours === 3 && empty === 1) score += 5;
    else if (ours === 2 && empty === 2) score += 2;

    return score;
}

function playDropSound() {
    dropSound.currentTime = 0;
    dropSound.play().catch(e => console.log("Audio play failed:", e));
}

function playWinSound() {
    winSound.currentTime = 0;
    winSound.play().catch(e => console.log("Audio play failed:", e));
}
resetBtn.addEventListener('click', resetGame);
aiToggle.addEventListener('click', () => {
    vsAI = !vsAI;
    aiToggle.textContent = vsAI ? 'Play vs Human' : 'Play vs AI';
    resetGame();
});
playAgainBtn.addEventListener('click', resetGame);
closeInstructions.addEventListener('click', () => {
    instructionsModal.style.display = 'none';
});
aiDifficultySelect.addEventListener('change', (e) => {
    aiDifficulty = e.target.value;
});
const themeButtons = document.querySelectorAll('.theme-btn');
themeButtons.forEach(button => {
    button.addEventListener('click', () => {
        document.body.className = button.dataset.theme;
    });
});
window.addEventListener('DOMContentLoaded', (event) => {
    initializeBoard();
    instructionsModal.style.display = 'flex';
});