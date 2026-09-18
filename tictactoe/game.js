// Tic-tac-toe: board logic + minimax AI. Built to satisfy game.test.js.
"use strict";

const EMPTY = " ";
const X = "X";
const O = "O";

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

function checkWinner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] !== EMPTY && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function other(player) {
  return player === X ? O : X;
}

class Board {
  constructor() {
    this.cells = Array(9).fill(EMPTY);
  }

  play(index, player) {
    if (index < 0 || index > 8) {
      throw new Error(`index ${index} out of range 0-8`);
    }
    if (this.cells[index] !== EMPTY) {
      throw new Error(`cell ${index} already occupied`);
    }
    this.cells[index] = player;
  }

  isDraw() {
    return checkWinner(this.cells) === null && !this.cells.includes(EMPTY);
  }

  render() {
    const rows = [];
    for (let i = 0; i < 9; i += 3) rows.push(this.cells.slice(i, i + 3).join(" | "));
    return rows.join("\n---------\n");
  }
}

function minimax(board, player, aiPlayer, depth = 0) {
  const winner = checkWinner(board);
  if (winner === aiPlayer) return 10 - depth;
  if (winner === other(aiPlayer)) return depth - 10;
  if (!board.includes(EMPTY)) return 0;

  const scores = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === EMPTY) {
      board[i] = player;
      scores.push(minimax(board, other(player), aiPlayer, depth + 1));
      board[i] = EMPTY;
    }
  }
  return player === aiPlayer ? Math.max(...scores) : Math.min(...scores);
}

function bestMove(board, aiPlayer) {
  let bestScore = null;
  let move = null;
  for (let i = 0; i < 9; i++) {
    if (board[i] === EMPTY) {
      board[i] = aiPlayer;
      const score = minimax(board, other(aiPlayer), aiPlayer, 1);
      board[i] = EMPTY;
      if (bestScore === null || score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

module.exports = { EMPTY, X, O, checkWinner, Board, bestMove, minimax };

// --- CLI mode: `node game.js` to play against the AI ---
if (require.main === module) {
  const readline = require("node:readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const board = new Board();
  const human = X, ai = O;
  let turn = human;

  console.log("You are X. Cells numbered 0-8, left-to-right, top-to-bottom.\n");

  function step() {
    console.log(board.render());
    const winner = checkWinner(board.cells);
    if (winner) {
      console.log(`\n${winner} wins.`);
      rl.close();
      return;
    }
    if (board.isDraw()) {
      console.log("\nDraw.");
      rl.close();
      return;
    }
    if (turn === human) {
      rl.question("\nYour move (0-8): ", (answer) => {
        try {
          board.play(parseInt(answer, 10), human);
          turn = other(turn);
        } catch (e) {
          console.log(e.message);
        }
        step();
      });
    } else {
      const move = bestMove(board.cells, ai);
      board.play(move, ai);
      console.log(`\nAI plays ${move}`);
      turn = other(turn);
      step();
    }
  }

  step();
}
