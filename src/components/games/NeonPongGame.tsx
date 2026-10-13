import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, Volume2, VolumeX, Users, User } from 'lucide-react';
import { sound } from '../../utils/audio';

export const NeonPongGame: React.FC<{ onScoreUpdate?: (score: number) => void }> = ({ onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [mode, setMode] = useState<'1P' | '2P'>('1P');
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [muted, setMuted] = useState(sound.getMuted());

  const stateRef = useRef({
    gameState: 'IDLE' as 'IDLE' | 'PLAYING' | 'GAMEOVER',
    mode: '1P' as '1P' | '2P',
    p1Y: 210,
    p2Y: 210,
    paddleHeight: 80,
    paddleWidth: 12,
    ball: { x: 320, y: 240, vx: 320, vy: 160, radius: 8 },
    p1Score: 0,
    p2Score: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
  });

  stateRef.current.mode = mode;

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      mode,
      p1Y: 210,
      p2Y: 210,
      paddleHeight: 80,
      paddleWidth: 12,
      ball: { x: 320, y: 240, vx: Math.random() > 0.5 ? 320 : -320, vy: (Math.random() - 0.5) * 200, radius: 8 },
      p1Score: 0,
      p2Score: 0,
      particles: [],
    };
    setP1Score(0);
    setP2Score(0);
    setWinner(null);
    setGameState('PLAYING');
    sound.playClick();
  };

  // Keyboard events
  useEffect(() => {
    const keysDown = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => keysDown.add(e.key.toLowerCase());
    const onKeyUp = (e: KeyboardEvent) => keysDown.delete(e.key.toLowerCase());

    const interval = setInterval(() => {
      if (stateRef.current.gameState !== 'PLAYING') return;
      const s = stateRef.current;
      const pSpeed = 7;

      // P1 controls (W/S)
      if (keysDown.has('w')) s.p1Y = Math.max(20, s.p1Y - pSpeed);
      if (keysDown.has('s')) s.p1Y = Math.min(480 - s.paddleHeight - 20, s.p1Y + pSpeed);

      // P2 controls (Arrows) if in 2P mode
      if (s.mode === '2P') {
        if (keysDown.has('arrowup')) s.p2Y = Math.max(20, s.p2Y - pSpeed);
        if (keysDown.has('arrowdown')) s.p2Y = Math.min(480 - s.paddleHeight - 20, s.p2Y + pSpeed);
      }
    }, 16);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const state = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const ball = state.ball;

      if (state.gameState === 'PLAYING') {
        // AI logic if 1P
        if (state.mode === '1P') {
          const aiCenter = state.p2Y + state.paddleHeight / 2;
          const aiDiff = ball.y - aiCenter;
          state.p2Y += Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), 260 * dt);
          state.p2Y = Math.max(20, Math.min(h - state.paddleHeight - 20, state.p2Y));
        }

        // Ball movement
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        // Top/Bottom wall bounce
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > h) {
          ball.vy = -ball.vy;
          sound.playBounce();
        }

        // Paddle 1 collision (Left)
        const p1Left = 30;
        const p1Right = p1Left + state.paddleWidth;
        if (
          ball.x - ball.radius <= p1Right &&
          ball.x + ball.radius >= p1Left &&
          ball.y >= state.p1Y &&
          ball.y <= state.p1Y + state.paddleHeight &&
          ball.vx < 0
        ) {
          ball.vx = -ball.vx * 1.06; // Accelerate
          const hitOffset = (ball.y - (state.p1Y + state.paddleHeight / 2)) / (state.paddleHeight / 2);
          ball.vy = hitOffset * 280;
          sound.playTone(480, 'sine', 0.06, 0.15);
        }

        // Paddle 2 collision (Right)
        const p2Right = w - 30;
        const p2Left = p2Right - state.paddleWidth;
        if (
          ball.x + ball.radius >= p2Left &&
          ball.x - ball.radius <= p2Right &&
          ball.y >= state.p2Y &&
          ball.y <= state.p2Y + state.paddleHeight &&
          ball.vx > 0
        ) {
          ball.vx = -ball.vx * 1.06;
          const hitOffset = (ball.y - (state.p2Y + state.paddleHeight / 2)) / (state.paddleHeight / 2);
          ball.vy = hitOffset * 280;
          sound.playTone(440, 'sine', 0.06, 0.15);
        }

        // Score goal left
        if (ball.x < 0) {
          sound.playCoin();
          state.p2Score++;
          setP2Score(state.p2Score);
          ball.x = w / 2;
          ball.y = h / 2;
          ball.vx = 320;
          ball.vy = (Math.random() - 0.5) * 180;
        }

        // Score goal right
        if (ball.x > w) {
          sound.playCoin();
          state.p1Score++;
          setP1Score(state.p1Score);
          ball.x = w / 2;
          ball.y = h / 2;
          ball.vx = -320;
          ball.vy = (Math.random() - 0.5) * 180;
          if (onScoreUpdate) onScoreUpdate(state.p1Score * 100);
        }

        // Check winner
        if (state.p1Score >= 7 || state.p2Score >= 7) {
          state.gameState = 'GAMEOVER';
          setGameState('GAMEOVER');
          sound.playSuccess();
          setWinner(state.p1Score >= 7 ? 'Player 1' : state.mode === '1P' ? 'Computer' : 'Player 2');
        }
      }

      // RENDER
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, w, h);

      // Center dividing line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Neon Paddle 1
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fillRect(30, state.p1Y, state.paddleWidth, state.paddleHeight);

      // Neon Paddle 2
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.fillRect(w - 30 - state.paddleWidth, state.p2Y, state.paddleWidth, state.paddleHeight);

      // Neon Ball
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

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
    <div className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-950 select-none">
      <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold font-mono text-cyan-400">{p1Score}</div>
          <div className="text-xs text-slate-500 uppercase tracking-widest">First to 7</div>
          <div className="text-xl font-bold font-mono text-rose-400">{p2Score}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setMode('1P')}
              className={`px-2.5 py-1 rounded font-medium ${mode === '1P' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
            >
              <User className="w-3.5 h-3.5 inline mr-1" /> 1P vs AI
            </button>
            <button
              onClick={() => setMode('2P')}
              className={`px-2.5 py-1 rounded font-medium ${mode === '2P' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
            >
              <Users className="w-3.5 h-3.5 inline mr-1" /> 2P Local
            </button>
          </div>
          <button onClick={() => setMuted(sound.toggleMute())} className="p-1.5 text-slate-400 hover:text-white">
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} width={640} height={460} className="w-full h-[400px] object-cover block bg-slate-950" />

      {gameState === 'IDLE' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 backdrop-blur-sm text-white">
          <h2 className="text-3xl font-bold mb-2">Neon Pong Duel</h2>
          <p className="text-sm text-slate-300 max-w-xs mb-6">
            P1 controls with <strong>W / S</strong>. P2 controls with <strong>Up / Down</strong> arrows.
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow-lg"
          >
            Start Match
          </button>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/85 backdrop-blur-sm text-white">
          <h2 className="text-3xl font-bold mb-2">{winner} Wins!</h2>
          <div className="text-xl text-cyan-300 mb-6">{p1Score} - {p2Score}</div>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow-lg flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Rematch
          </button>
        </div>
      )}
    </div>
  );
};
