import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Zap } from 'lucide-react';
import { sound } from '../../utils/audio';

export const CyberSnakeGame: React.FC<{ onScoreUpdate?: (score: number) => void }> = ({ onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [muted, setMuted] = useState(sound.getMuted());

  const stateRef = useRef({
    gameState: 'IDLE' as 'IDLE' | 'PLAYING' | 'GAMEOVER',
    gridSize: 22,
    cellSize: 24,
    snake: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 16, y: 10, isSpecial: false },
    score: 0,
    speed: 120, // ms per tick
    lastTick: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
  });

  useEffect(() => {
    const saved = localStorage.getItem('cs_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const spawnFood = (snake: { x: number; y: number }[]) => {
    let nx = 0;
    let ny = 0;
    let valid = false;
    while (!valid) {
      nx = Math.floor(Math.random() * stateRef.current.gridSize);
      ny = Math.floor(Math.random() * stateRef.current.gridSize);
      valid = !snake.some((s) => s.x === nx && s.y === ny);
    }
    stateRef.current.food = {
      x: nx,
      y: ny,
      isSpecial: Math.random() < 0.25,
    };
  };

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      gridSize: 22,
      cellSize: 24,
      snake: [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
      ],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 16, y: 10, isSpecial: false },
      score: 0,
      speed: 120,
      lastTick: performance.now(),
      particles: [],
    };
    spawnFood(stateRef.current.snake);
    setGameState('PLAYING');
    setScore(0);
    sound.playClick();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.gameState !== 'PLAYING') return;
      const { dir } = stateRef.current;
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && dir.y === 0) {
        stateRef.current.nextDir = { x: 0, y: -1 };
      } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && dir.y === 0) {
        stateRef.current.nextDir = { x: 0, y: 1 };
      } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && dir.x === 0) {
        stateRef.current.nextDir = { x: -1, y: 0 };
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && dir.x === 0) {
        stateRef.current.nextDir = { x: 1, y: 0 };
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = (time: number) => {
      const state = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      if (state.gameState === 'PLAYING') {
        if (time - state.lastTick > state.speed) {
          state.lastTick = time;
          state.dir = state.nextDir;

          const head = state.snake[0];
          const newHead = { x: head.x + state.dir.x, y: head.y + state.dir.y };

          // Wall collision
          if (
            newHead.x < 0 ||
            newHead.x >= state.gridSize ||
            newHead.y < 0 ||
            newHead.y >= state.gridSize
          ) {
            // Crash
            sound.playGameOver();
            state.gameState = 'GAMEOVER';
            setGameState('GAMEOVER');
            setHighScore((prev) => {
              const nh = Math.max(prev, state.score);
              localStorage.setItem('cs_highscore', String(nh));
              return nh;
            });
          } else if (state.snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
            // Self bite
            sound.playGameOver();
            state.gameState = 'GAMEOVER';
            setGameState('GAMEOVER');
          } else {
            state.snake.unshift(newHead);

            // Food eaten?
            if (newHead.x === state.food.x && newHead.y === state.food.y) {
              sound.playCoin();
              const pts = state.food.isSpecial ? 300 : 100;
              state.score += pts;
              setScore(state.score);
              if (onScoreUpdate) onScoreUpdate(state.score);
              state.speed = Math.max(65, state.speed - 2);

              // Spawn particles at food
              for (let p = 0; p < 12; p++) {
                state.particles.push({
                  x: (state.food.x + 0.5) * state.cellSize,
                  y: (state.food.y + 0.5) * state.cellSize,
                  vx: (Math.random() - 0.5) * 140,
                  vy: (Math.random() - 0.5) * 140,
                  life: 0.4,
                  color: state.food.isSpecial ? '#f59e0b' : '#38bdf8',
                });
              }

              spawnFood(state.snake);
            } else {
              state.snake.pop();
            }
          }
        }
      }

      // Update particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.life -= 0.04;
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      // RENDER
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, w, h);

      // Grid matrix lines
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      for (let x = 0; x <= state.gridSize; x++) {
        ctx.beginPath();
        ctx.moveTo(x * state.cellSize, 0);
        ctx.lineTo(x * state.cellSize, state.gridSize * state.cellSize);
        ctx.stroke();
      }
      for (let y = 0; y <= state.gridSize; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * state.cellSize);
        ctx.lineTo(state.gridSize * state.cellSize, y * state.cellSize);
        ctx.stroke();
      }

      // Food
      const fx = (state.food.x + 0.5) * state.cellSize;
      const fy = (state.food.y + 0.5) * state.cellSize;
      ctx.fillStyle = state.food.isSpecial ? '#f59e0b' : '#38bdf8';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(fx, fy, state.cellSize * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Snake body
      state.snake.forEach((seg, idx) => {
        const sx = seg.x * state.cellSize;
        const sy = seg.y * state.cellSize;
        const isHead = idx === 0;

        ctx.fillStyle = isHead ? '#38bdf8' : '#2563eb';
        ctx.shadowColor = isHead ? '#38bdf8' : '#1d4ed8';
        ctx.shadowBlur = isHead ? 10 : 4;

        ctx.beginPath();
        ctx.roundRect(sx + 2, sy + 2, state.cellSize - 4, state.cellSize - 4, isHead ? 6 : 4);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isHead) {
          ctx.fillStyle = '#030712';
          ctx.beginPath();
          ctx.arc(sx + state.cellSize * 0.35, sy + state.cellSize * 0.35, 2, 0, Math.PI * 2);
          ctx.arc(sx + state.cellSize * 0.65, sy + state.cellSize * 0.35, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Particles
      for (const p of state.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (state.gameState === 'IDLE') {
        ctx.fillStyle = 'rgba(6, 10, 20, 0.75)';
        ctx.fillRect(0, 0, w, h);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onScoreUpdate]);

  return (
    <div className="relative w-full max-w-xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-950 select-none">
      {/* Top HUD */}
      <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
        <div className="flex items-center gap-5">
          <div>
            <div className="text-[11px] text-slate-400">SCORE</div>
            <div className="text-xl font-bold font-mono text-cyan-400">{score}</div>
          </div>
          <div className="h-6 w-[1px] bg-slate-700" />
          <div>
            <div className="text-[11px] text-slate-400">BEST</div>
            <div className="text-xl font-bold font-mono text-slate-300">{highScore}</div>
          </div>
        </div>

        <button
          onClick={() => setMuted(sound.toggleMute())}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex justify-center p-3">
        <canvas
          ref={canvasRef}
          width={528}
          height={528}
          className="max-w-full aspect-square object-contain block bg-slate-950 rounded-lg"
        />
      </div>

      {gameState === 'IDLE' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 backdrop-blur-sm text-white">
          <div className="w-16 h-16 rounded-2xl bg-cyan-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Cyber Snake Pulse</h2>
          <p className="text-sm text-slate-300 max-w-xs mb-6">
            Eat energy cubes to grow, avoid edges and your tail, and score combos.
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow-lg"
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/85 backdrop-blur-sm text-white">
          <div className="text-rose-500 font-bold tracking-widest text-xs mb-1 uppercase">Collision</div>
          <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-52 mb-6">
            <div className="text-xs text-slate-400">FINAL SCORE</div>
            <div className="text-2xl font-bold font-mono text-cyan-400">{score}</div>
          </div>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow-lg flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Play Again
          </button>
        </div>
      )}

      {/* Mobile D-Pad */}
      {gameState === 'PLAYING' && (
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-center md:hidden">
          <div className="grid grid-cols-3 gap-2 w-44">
            <div />
            <button
              onTouchStart={() => {
                if (stateRef.current.dir.y === 0) stateRef.current.nextDir = { x: 0, y: -1 };
              }}
              className="w-12 h-12 bg-slate-800 text-white font-bold rounded-xl active:bg-blue-600"
            >
              ▲
            </button>
            <div />
            <button
              onTouchStart={() => {
                if (stateRef.current.dir.x === 0) stateRef.current.nextDir = { x: -1, y: 0 };
              }}
              className="w-12 h-12 bg-slate-800 text-white font-bold rounded-xl active:bg-blue-600"
            >
              ◀
            </button>
            <button
              onTouchStart={() => {
                if (stateRef.current.dir.y === 0) stateRef.current.nextDir = { x: 0, y: 1 };
              }}
              className="w-12 h-12 bg-slate-800 text-white font-bold rounded-xl active:bg-blue-600"
            >
              ▼
            </button>
            <button
              onTouchStart={() => {
                if (stateRef.current.dir.x === 0) stateRef.current.nextDir = { x: 1, y: 0 };
              }}
              className="w-12 h-12 bg-slate-800 text-white font-bold rounded-xl active:bg-blue-600"
            >
              ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
