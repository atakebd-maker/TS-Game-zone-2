import React, { useState } from 'react';
import { RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';

type Grid = (string | null)[][]; // 8x8

interface PieceShape {
  id: string;
  matrix: number[][];
  color: string;
}

const SHAPES: { matrix: number[][]; color: string }[] = [
  { matrix: [[1]], color: '#38bdf8' },
  { matrix: [[1, 1]], color: '#3b82f6' },
  { matrix: [[1], [1]], color: '#3b82f6' },
  { matrix: [[1, 1, 1]], color: '#6366f1' },
  { matrix: [[1], [1], [1]], color: '#6366f1' },
  { matrix: [[1, 1], [1, 1]], color: '#f59e0b' },
  { matrix: [[1, 1, 1], [0, 1, 0]], color: '#ec4899' },
  { matrix: [[1, 0], [1, 1]], color: '#10b981' },
  { matrix: [[0, 1], [1, 1]], color: '#10b981' },
  { matrix: [[1, 1, 1, 1]], color: '#06b6d4' },
];

export const BlockMatchGame: React.FC<{ onScoreUpdate?: (score: number) => void }> = ({ onScoreUpdate }) => {
  const [grid, setGrid] = useState<Grid>(() =>
    Array(8).fill(null).map(() => Array(8).fill(null))
  );
  const [dockPieces, setDockPieces] = useState<(PieceShape | null)[]>([]);
  const [selectedPieceIdx, setSelectedPieceIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [muted, setMuted] = useState(sound.getMuted());

  const generatePieces = (): PieceShape[] => {
    return Array(3).fill(null).map((_, i) => {
      const template = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      return {
        id: `p-${Date.now()}-${i}`,
        matrix: template.matrix,
        color: template.color,
      };
    });
  };

  const initGame = () => {
    setGrid(Array(8).fill(null).map(() => Array(8).fill(null)));
    setDockPieces(generatePieces());
    setSelectedPieceIdx(null);
    setScore(0);
    setIsGameOver(false);
    sound.playClick();
  };

  useState(() => {
    initGame();
  });

  const canPlacePiece = (g: Grid, matrix: number[][], startR: number, startC: number): boolean => {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] === 1) {
          const gr = startR + r;
          const gc = startC + c;
          if (gr < 0 || gr >= 8 || gc < 0 || gc >= 8) return false;
          if (g[gr][gc] !== null) return false;
        }
      }
    }
    return true;
  };

  const handleCellClick = (r: number, c: number) => {
    if (selectedPieceIdx === null || !dockPieces[selectedPieceIdx]) return;
    const piece = dockPieces[selectedPieceIdx]!;

    if (!canPlacePiece(grid, piece.matrix, r, c)) {
      sound.playTone(200, 'sawtooth', 0.08, 0.1);
      return;
    }

    // Place piece
    const newGrid = grid.map((row) => [...row]);
    let placedBlocks = 0;
    for (let pr = 0; pr < piece.matrix.length; pr++) {
      for (let pc = 0; pc < piece.matrix[pr].length; pc++) {
        if (piece.matrix[pr][pc] === 1) {
          newGrid[r + pr][c + pc] = piece.color;
          placedBlocks++;
        }
      }
    }

    sound.playTone(440, 'sine', 0.08, 0.12);

    // Check full rows and columns
    const fullRows: number[] = [];
    const fullCols: number[] = [];

    for (let row = 0; row < 8; row++) {
      if (newGrid[row].every((cell) => cell !== null)) fullRows.push(row);
    }
    for (let col = 0; col < 8; col++) {
      let isFull = true;
      for (let row = 0; row < 8; row++) {
        if (newGrid[row][col] === null) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullCols.push(col);
    }

    // Clear full lines
    let clearedLines = fullRows.length + fullCols.length;
    if (clearedLines > 0) {
      sound.playCoin();
      fullRows.forEach((row) => {
        for (let col = 0; col < 8; col++) newGrid[row][col] = null;
      });
      fullCols.forEach((col) => {
        for (let row = 0; row < 8; row++) newGrid[row][col] = null;
      });
    }

    const pointsEarned = placedBlocks * 10 + clearedLines * 100 * clearedLines;
    const nextScore = score + pointsEarned;
    setScore(nextScore);
    if (onScoreUpdate) onScoreUpdate(nextScore);

    setGrid(newGrid);

    // Consume piece
    const nextDock = [...dockPieces];
    nextDock[selectedPieceIdx] = null;
    setSelectedPieceIdx(null);

    // Check if dock is empty -> deal 3 new
    let activeDock = nextDock;
    if (nextDock.every((p) => p === null)) {
      activeDock = generatePieces();
    }
    setDockPieces(activeDock);

    // Check if any piece can be placed anywhere
    let hasValidMove = false;
    for (const p of activeDock) {
      if (!p) continue;
      for (let gr = 0; gr < 8; gr++) {
        for (let gc = 0; gc < 8; gc++) {
          if (canPlacePiece(newGrid, p.matrix, gr, gc)) {
            hasValidMove = true;
            break;
          }
        }
        if (hasValidMove) break;
      }
      if (hasValidMove) break;
    }

    if (!hasValidMove && activeDock.some((p) => p !== null)) {
      setIsGameOver(true);
      sound.playGameOver();
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white p-4 md:p-6 select-none">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Block Match Blast</h3>
          <div className="text-xs text-slate-500">Match 8-line rows & columns</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] text-slate-400">SCORE</div>
            <div className="text-lg font-bold font-mono text-blue-600">{score}</div>
          </div>
          <button
            onClick={initGame}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 8x8 Grid */}
      <div className="max-w-[400px] mx-auto aspect-square grid grid-cols-8 gap-1.5 p-3 bg-slate-100 rounded-xl my-5 border border-slate-200">
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              style={{ backgroundColor: cell || '#e2e8f0' }}
              className={`rounded-md cursor-pointer transition-transform ${
                cell ? 'shadow-sm' : 'hover:bg-slate-300'
              }`}
            />
          ))
        )}
      </div>

      {/* Dock Pieces */}
      <div className="grid grid-cols-3 gap-3 max-w-[400px] mx-auto pt-2">
        {dockPieces.map((piece, idx) => {
          if (!piece) return <div key={idx} className="h-20 bg-slate-50 rounded-xl border border-dashed border-slate-200" />;
          const isSelected = selectedPieceIdx === idx;
          return (
            <div
              key={piece.id}
              onClick={() => {
                setSelectedPieceIdx(idx);
                sound.playClick();
              }}
              className={`h-20 rounded-xl flex items-center justify-center p-2 cursor-pointer transition-all border ${
                isSelected ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${piece.matrix[0].length}, minmax(0, 1fr))`,
                }}
              >
                {piece.matrix.map((row, pr) =>
                  row.map((val, pc) => (
                    <div
                      key={`${pr}-${pc}`}
                      className="w-3.5 h-3.5 rounded-sm"
                      style={{
                        backgroundColor: val === 1 ? piece.color : 'transparent',
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isGameOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-900/85 backdrop-blur-sm text-white">
          <div className="text-amber-400 text-xs font-bold uppercase mb-1">Grid Filled</div>
          <h2 className="text-3xl font-bold mb-3">No More Moves!</h2>
          <div className="text-2xl font-mono text-blue-400 font-bold mb-6">Score: {score}</div>
          <button
            onClick={initGame}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}
    </div>
  );
};
