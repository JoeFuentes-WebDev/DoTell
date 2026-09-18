// Success criteria for the tic-tac-toe agent loop, written BEFORE the implementation.
// The agent (me) is not "done" until every test here passes.
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { EMPTY, X, O, checkWinner, Board, bestMove } = require("./game");

test("check_winner: rows", () => {
  const b = [X, X, X, EMPTY, O, EMPTY, EMPTY, EMPTY, O];
  assert.equal(checkWinner(b), X);
});

test("check_winner: cols", () => {
  const b = [O, X, EMPTY, O, X, EMPTY, O, EMPTY, EMPTY];
  assert.equal(checkWinner(b), O);
});

test("check_winner: diagonals", () => {
  const b1 = [X, O, O, EMPTY, X, EMPTY, EMPTY, O, X];
  assert.equal(checkWinner(b1), X);
  const b2 = [O, EMPTY, X, EMPTY, X, EMPTY, X, EMPTY, O];
  assert.equal(checkWinner(b2), X);
});

test("check_winner: no winner mid-game", () => {
  const b = [X, O, EMPTY, EMPTY, X, EMPTY, EMPTY, EMPTY, O];
  assert.equal(checkWinner(b), null);
});

test("check_winner: full board, no line -> null (caller treats as draw)", () => {
  const b = [X, O, X, X, O, O, O, X, X];
  assert.equal(checkWinner(b), null);
});

test("Board: rejects move on occupied cell", () => {
  const board = new Board();
  board.play(0, X);
  assert.throws(() => board.play(0, O), /occupied/);
});

test("Board: rejects out-of-range index", () => {
  const board = new Board();
  assert.throws(() => board.play(9, X), /range/);
});

test("AI blocks an immediate loss", () => {
  const b = [X, X, EMPTY, EMPTY, O, EMPTY, EMPTY, EMPTY, EMPTY];
  assert.equal(bestMove(b, O), 2);
});

test("AI takes an immediate win", () => {
  const b = [O, O, EMPTY, X, X, EMPTY, EMPTY, EMPTY, EMPTY];
  assert.equal(bestMove(b, O), 2);
});

function other(p) {
  return p === X ? O : X;
}

test("property: AI vs AI from every opening always draws", () => {
  for (let opening = 0; opening < 9; opening++) {
    const b = Array(9).fill(EMPTY);
    b[opening] = X;
    let turn = O;
    let result = null;
    while (true) {
      const winner = checkWinner(b);
      if (winner) {
        result = winner;
        break;
      }
      if (!b.includes(EMPTY)) break;
      const move = bestMove(b, turn);
      b[move] = turn;
      turn = other(turn);
    }
    assert.equal(result, null, `AI produced a winner (${result}) from opening ${opening} — minimax bug`);
  }
});

test("property: AI (O) never loses against ANY human (X) play, exhaustively", () => {
  // Brute-force the whole game tree: human tries every move at every turn;
  // AI always plays its actual policy (bestMove). AI must never lose.
  function humanCanForceWin(board, humanTurn) {
    const winner = checkWinner(board);
    if (winner === X) return true;
    if (winner === O || !board.includes(EMPTY)) return false;

    if (humanTurn) {
      for (let i = 0; i < 9; i++) {
        if (board[i] === EMPTY) {
          board[i] = X;
          const result = humanCanForceWin(board, false);
          board[i] = EMPTY;
          if (result) return true;
        }
      }
      return false;
    } else {
      const move = bestMove(board, O);
      board[move] = O;
      const result = humanCanForceWin(board, true);
      board[move] = EMPTY;
      return result;
    }
  }

  const board = Array(9).fill(EMPTY);
  assert.equal(humanCanForceWin(board, true), false);
});
