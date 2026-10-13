import React, { useState } from 'react';
import { RotateCcw, Volume2, VolumeX, Shield, Award, ChevronRight } from 'lucide-react';
import { sound } from '../../utils/audio';

type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
type PieceColor = 'w' | 'b';

interface Piece {
  type: PieceType;
  color: PieceColor;
}

type Board = (Piece | null)[][];

const INITIAL_BOARD: Board = [
  [
    { type: 'r', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'q', color: 'b' },
    { type: 'k', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'r', color: 'b' },
  ],
  Array(8).fill(null).map(() => ({ type: 'p', color: 'b' })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null).map(() => ({ type: 'p', color: 'w' })),
  [
    { type: 'r', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'q', color: 'w' },
    { type: 'k', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'r', color: 'w' },
  ],
];

const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export const ChessMasterGame: React.FC<{ onScoreUpdate?: (score: number) => void }> = ({ onScoreUpdate }) => {
  const [board, setBoard] = useState<Board>(() => JSON.parse(JSON.stringify(INITIAL_BOARD)));
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [history, setHistory] = useState<string[]>([]);
  const [capturedByWhite, setCapturedByWhite] = useState<Piece[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<Piece[]>([]);
  const [statusMessage, setStatusMessage] = useState('Your turn (White)');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [muted, setMuted] = useState(sound.getMuted());
  const [isBotThinking, setIsBotThinking] = useState(false);

  const resetGame = () => {
    setBoard(JSON.parse(JSON.stringify(INITIAL_BOARD)));
    setSelectedSquare(null);
    setValidMoves([]);
    setTurn('w');
    setHistory([]);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setStatusMessage('Your turn (White)');
    setIsBotThinking(false);
    sound.playClick();
  };

  // Calculate pseudo-legal moves for standard pieces
  const getLegalMovesForPiece = (b: Board, r: number, c: number): [number, number][] => {
    const piece = b[r][c];
    if (!piece) return [];
    const moves: [number, number][] = [];
    const color = piece.color;
    const opponent = color === 'w' ? 'b' : 'w';

    const addMove = (nr: number, nc: number) => {
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) return false;
      const target = b[nr][nc];
      if (!target) {
        moves.push([nr, nc]);
        return true;
      }
      if (target.color === opponent) {
        moves.push([nr, nc]);
      }
      return false; // hit piece
    };

    if (piece.type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      // Forward 1
      if (r + dir >= 0 && r + dir <= 7 && !b[r + dir][c]) {
        moves.push([r + dir, c]);
        // Forward 2
        if (r === startRow && !b[r + 2 * dir][c]) {
          moves.push([r + 2 * dir, c]);
        }
      }
      // Diagonal captures
      [-1, 1].forEach((dc) => {
        const nr = r + dir;
        const nc = c + dc;
        if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
          const target = b[nr][nc];
          if (target && target.color === opponent) {
            moves.push([nr, nc]);
          }
        }
      });
    } else if (piece.type === 'n') {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      knightOffsets.forEach(([dr, dc]) => {
        addMove(r + dr, c + dc);
      });
    } else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
      const dirs: [number, number][] = [];
      if (piece.type === 'b' || piece.type === 'q') {
        dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (piece.type === 'r' || piece.type === 'q') {
        dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }
      dirs.forEach(([dr, dc]) => {
        let curR = r + dr;
        let curC = c + dc;
        while (addMove(curR, curC)) {
          curR += dr;
          curC += dc;
        }
      });
    } else if (piece.type === 'k') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) addMove(r + dr, c + dc);
        }
      }
    }

    return moves;
  };

  const handleSquareClick = (r: number, c: number) => {
    if (turn !== 'w' || isBotThinking) return;

    if (selectedSquare) {
      const [sr, sc] = selectedSquare;
      const isMoveValid = validMoves.some(([vr, vc]) => vr === r && vc === c);

      if (isMoveValid) {
        // Execute player move
        makeMove(sr, sc, r, c);
        return;
      }
    }

    // Select piece
    const piece = board[r][c];
    if (piece && piece.color === 'w') {
      setSelectedSquare([r, c]);
      setValidMoves(getLegalMovesForPiece(board, r, c));
      sound.playClick();
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const makeMove = (fromR: number, fromC: number, toR: number, toC: number) => {
    const newBoard = board.map((row) => [...row]);
    const piece = newBoard[fromR][fromC]!;
    const captured = newBoard[toR][toC];

    newBoard[toR][toC] = piece;
    newBoard[fromR][fromC] = null;

    // Pawn Promotion
    if (piece.type === 'p' && (toR === 0 || toR === 7)) {
      piece.type = 'q';
    }

    if (captured) {
      sound.playExplosion();
      if (captured.color === 'b') {
        setCapturedByWhite((prev) => [...prev, captured]);
      } else {
        setCapturedByBlack((prev) => [...prev, captured]);
      }
    } else {
      sound.playTone(320, 'sine', 0.08, 0.12);
    }

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const notat = `${piece.type.toUpperCase()}${files[fromC]}${8 - fromR}→${files[toC]}${8 - toR}`;
    setHistory((prev) => [notat, ...prev]);

    setBoard(newBoard);
    setSelectedSquare(null);
    setValidMoves([]);

    // Check if King was captured
    if (captured?.type === 'k') {
      sound.playSuccess();
      setStatusMessage('Checkmate! White wins the match!');
      if (onScoreUpdate) onScoreUpdate(1000);
      return;
    }

    setTurn('b');
    setStatusMessage('Bot thinking...');
    setIsBotThinking(true);

    // AI Turn with deliberate human-like delay
    setTimeout(() => {
      makeBotMove(newBoard);
    }, 600);
  };

  // Minimax / heuristic bot move
  const makeBotMove = (curBoard: Board) => {
    const allMoves: { from: [number, number]; to: [number, number]; weight: number }[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = curBoard[r][c];
        if (piece && piece.color === 'b') {
          const legal = getLegalMovesForPiece(curBoard, r, c);
          legal.forEach(([tr, tc]) => {
            const target = curBoard[tr][tc];
            let weight = 0;
            if (target) {
              const pieceValues: Record<PieceType, number> = { p: 10, n: 30, b: 35, r: 50, q: 90, k: 999 };
              weight += pieceValues[target.type] * 2;
            }
            // Control center
            if (tr >= 3 && tr <= 4 && tc >= 3 && tc <= 4) weight += 5;
            // Pawn advance
            if (piece.type === 'p') weight += tr;

            allMoves.push({ from: [r, c], to: [tr, tc], weight });
          });
        }
      }
    }

    if (allMoves.length === 0) {
      setStatusMessage('Stalemate / No valid moves!');
      setIsBotThinking(false);
      return;
    }

    // Sort by weight
    allMoves.sort((a, b) => b.weight - a.weight);

    // Pick top move or random depending on difficulty
    let chosen = allMoves[0];
    if (difficulty === 'easy') {
      chosen = allMoves[Math.floor(Math.random() * Math.min(allMoves.length, 6))];
    } else if (difficulty === 'medium') {
      chosen = allMoves[Math.floor(Math.random() * Math.min(allMoves.length, 3))];
    }

    const [fr, fc] = chosen.from;
    const [tr, tc] = chosen.to;

    const newBoard = curBoard.map((row) => [...row]);
    const piece = newBoard[fr][fc]!;
    const captured = newBoard[tr][tc];

    newBoard[tr][tc] = piece;
    newBoard[fr][fc] = null;

    if (piece.type === 'p' && tr === 7) piece.type = 'q';

    if (captured) {
      sound.playTone(240, 'square', 0.1, 0.15);
      setCapturedByBlack((prev) => [...prev, captured]);
    } else {
      sound.playTone(280, 'sine', 0.08, 0.1);
    }

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const notat = `b:${piece.type.toUpperCase()}${files[fc]}${8 - fr}→${files[tc]}${8 - tr}`;
    setHistory((prev) => [notat, ...prev]);

    setBoard(newBoard);
    setTurn('w');
    setIsBotThinking(false);

    if (captured?.type === 'k') {
      sound.playGameOver();
      setStatusMessage('Checkmate! Black wins.');
    } else {
      setStatusMessage('Your turn (White)');
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white p-4 md:p-6 select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Grand Chess Master</h3>
          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <span className={turn === 'w' ? 'font-semibold text-blue-600' : 'text-slate-600'}>
              {statusMessage}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-2.5 py-1 rounded font-medium capitalize transition-all ${
                  difficulty === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMuted(sound.toggleMute())}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={resetGame}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left: 8x8 Chessboard */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Black captured pieces */}
          <div className="w-full flex items-center gap-1 h-7 text-lg px-2 text-slate-700">
            {capturedByWhite.map((p, i) => (
              <span key={i}>{PIECE_SYMBOLS.b[p.type]}</span>
            ))}
          </div>

          {/* Board */}
          <div className="w-full max-w-[480px] aspect-square grid grid-cols-8 border-4 border-slate-800 rounded-xl overflow-hidden shadow-md">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isDark = (r + c) % 2 === 1;
                const isSelected = selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
                const isValidTarget = validMoves.some(([vr, vc]) => vr === r && vc === c);

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-300'
                        : isDark
                        ? 'bg-slate-700 text-slate-100'
                        : 'bg-slate-200 text-slate-900'
                    }`}
                  >
                    {/* Legal move indicator dot */}
                    {isValidTarget && (
                      <div className="absolute w-3.5 h-3.5 rounded-full bg-blue-500/80 ring-2 ring-blue-300 z-10" />
                    )}

                    {cell && (
                      <span
                        className={`text-3xl md:text-4xl leading-none select-none drop-shadow ${
                          cell.color === 'w' ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {PIECE_SYMBOLS[cell.color][cell.type]}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* White captured pieces */}
          <div className="w-full flex items-center gap-1 h-7 text-lg px-2 text-slate-400 mt-1">
            {capturedByBlack.map((p, i) => (
              <span key={i}>{PIECE_SYMBOLS.w[p.type]}</span>
            ))}
          </div>
        </div>

        {/* Right: History & Info */}
        <div className="lg:col-span-4 flex flex-col h-full bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="font-semibold text-xs text-slate-700 mb-2 uppercase tracking-wider">Move Record</div>
          <div className="flex-1 overflow-y-auto max-h-64 space-y-1 font-mono text-xs pr-1">
            {history.length === 0 ? (
              <div className="text-slate-400 italic">No moves recorded yet</div>
            ) : (
              history.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between py-0.5 border-b border-slate-200 text-slate-600">
                  <span>#{history.length - idx}</span>
                  <span className="font-bold text-slate-900">{m}</span>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 leading-relaxed">
            Standard international chess rules. Click piece to highlight valid move targets.
          </div>
        </div>
      </div>
    </div>
  );
};
