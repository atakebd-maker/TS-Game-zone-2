import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Flame } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onScoreUpdate?: (score: number) => void;
}

export const SuperDunkGame: React.FC<Props> = ({ onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [highScore, setHighScore] = useState(0);
  const [muted, setMuted] = useState(sound.getMuted());

  const stateRef = useRef({
    gameState: 'IDLE' as 'IDLE' | 'PLAYING' | 'GAMEOVER',
    score: 0,
    streak: 0,
    timeLeft: 60,
    ball: {
      x: 120,
      y: 380,
      vx: 0,
      vy: 0,
      radius: 18,
      isHeld: false,
      isAirborne: false,
      hasScoredThisShot: false,
    },
    hoop: {
      x: 520,
      y: 220,
      radius: 28,
      rimLeft: { x: 492, y: 220 },
      rimRight: { x: 548, y: 220 },
      netHeight: 45,
    },
    dragStart: { x: 120, y: 380 },
    dragCurrent: { x: 120, y: 380 },
    isDragging: false,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    swishText: null as { text: string; x: number; y: number; life: number } | null,
  });

  useEffect(() => {
    const saved = localStorage.getItem('sd_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    stateRef.current.gameState = 'PLAYING';
    stateRef.current.score = 0;
    stateRef.current.streak = 0;
    stateRef.current.timeLeft = 60;
    stateRef.current.ball = {
      x: 120,
      y: 380,
      vx: 0,
      vy: 0,
      radius: 18,
      isHeld: false,
      isAirborne: false,
      hasScoredThisShot: false,
    };
    stateRef.current.particles = [];
    stateRef.current.swishText = null;

    setGameState('PLAYING');
    setScore(0);
    setStreak(0);
    setTimeLeft(60);
    sound.playClick();
  };

  // Timer interval
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stateRef.current.gameState = 'GAMEOVER';
          setGameState('GAMEOVER');
          sound.playGameOver();
          setHighScore((h) => {
            const nh = Math.max(h, stateRef.current.score);
            localStorage.setItem('sd_highscore', String(nh));
            return nh;
          });
          return 0;
        }
        stateRef.current.timeLeft = prev - 1;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (stateRef.current.gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 680 / rect.width;
    const scaleY = 500 / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const ball = stateRef.current.ball;
    if (!ball.isAirborne && Math.hypot(ball.x - x, ball.y - y) < 45) {
      stateRef.current.isDragging = true;
      stateRef.current.dragStart = { x: ball.x, y: ball.y };
      stateRef.current.dragCurrent = { x, y };
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!stateRef.current.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 680 / rect.width;
    const scaleY = 500 / rect.height;
    stateRef.current.dragCurrent = {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerUp = () => {
    if (!stateRef.current.isDragging) return;
    stateRef.current.isDragging = false;
    const { dragStart, dragCurrent, ball } = stateRef.current;

    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    const power = Math.min(Math.hypot(dx, dy), 160);

    if (power > 15) {
      const angle = Math.atan2(dy, dx);
      ball.vx = Math.cos(angle) * power * 0.17;
      ball.vy = Math.sin(angle) * power * 0.17;
      ball.isAirborne = true;
      ball.hasScoredThisShot = false;
      sound.playBounce();
    }
  };

  // Main game loop
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
      const hoop = state.hoop;

      // Physics update
      if (ball.isAirborne) {
        ball.vy += 700 * dt; // Gravity
        ball.x += ball.vx * 60 * dt;
        ball.y += ball.vy * 60 * dt;

        // Rim collisions
        const leftRimDist = Math.hypot(ball.x - hoop.rimLeft.x, ball.y - hoop.rimLeft.y);
        if (leftRimDist < ball.radius + 5) {
          ball.vx = -ball.vx * 0.6;
          ball.vy = -ball.vy * 0.6;
          sound.playBounce();
        }

        const rightRimDist = Math.hypot(ball.x - hoop.rimRight.x, ball.y - hoop.rimRight.y);
        if (rightRimDist < ball.radius + 5) {
          ball.vx = -ball.vx * 0.6;
          ball.vy = -ball.vy * 0.6;
          sound.playBounce();
        }

        // Backboard collision
        const backboardX = hoop.x + 36;
        if (ball.x + ball.radius > backboardX && ball.y < hoop.y + 60 && ball.y > hoop.y - 80) {
          ball.x = backboardX - ball.radius;
          ball.vx = -ball.vx * 0.7;
          sound.playBounce();
        }

        // Hoop basket scoring check
        if (
          !ball.hasScoredThisShot &&
          ball.y > hoop.y &&
          ball.y < hoop.y + 25 &&
          ball.x > hoop.rimLeft.x + 4 &&
          ball.x < hoop.rimRight.x - 4 &&
          ball.vy > 0
        ) {
          ball.hasScoredThisShot = true;
          const cleanSwish = Math.abs(ball.x - hoop.x) < 10;
          const points = (cleanSwish ? 3 : 2) * (1 + state.streak);

          state.score += points;
          state.streak++;
          setScore(state.score);
          setStreak(state.streak);
          if (onScoreUpdate) onScoreUpdate(state.score);

          sound.playSwish();

          state.swishText = {
            text: cleanSwish ? `SWISH! +${points}` : `BUCKET! +${points}`,
            x: hoop.x,
            y: hoop.y - 20,
            life: 1,
          };

          // Sparkle burst
          for (let p = 0; p < 20; p++) {
            state.particles.push({
              x: hoop.x,
              y: hoop.y + 15,
              vx: (Math.random() - 0.5) * 200,
              vy: Math.random() * 120 + 40,
              life: 0.6,
              color: state.streak > 2 ? '#f59e0b' : '#38bdf8',
            });
          }
        }

        // Floor bounce or reset
        if (ball.y + ball.radius > h - 40) {
          ball.y = h - 40 - ball.radius;
          ball.vy = -ball.vy * 0.5;
          ball.vx *= 0.8;

          if (Math.abs(ball.vy) < 2) {
            // Ball came to rest -> reposition
            setTimeout(() => {
              if (!ball.hasScoredThisShot && ball.isAirborne) {
                state.streak = 0;
                setStreak(0);
              }
              ball.x = Math.random() * 160 + 80;
              ball.y = 380;
              ball.vx = 0;
              ball.vy = 0;
              ball.isAirborne = false;
            }, 400);
          }
        }
      }

      // Update particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 1.5;
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      if (state.swishText) {
        state.swishText.y -= 30 * dt;
        state.swishText.life -= dt * 1.2;
        if (state.swishText.life <= 0) state.swishText = null;
      }

      // RENDER
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Court background gradient
      const gradCourt = ctx.createLinearGradient(0, 0, 0, h);
      gradCourt.addColorStop(0, '#1e293b');
      gradCourt.addColorStop(1, '#090d16');
      ctx.fillStyle = gradCourt;
      ctx.fillRect(0, 0, w, h);

      // Floor
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, h - 40, w, 40);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, h - 40, w, 4);

      // Draw Backboard & Post
      ctx.fillStyle = '#64748b';
      ctx.fillRect(hoop.x + 36, hoop.y - 80, 10, 140); // Backboard
      ctx.fillStyle = '#475569';
      ctx.fillRect(hoop.x + 46, hoop.y - 40, 40, 12); // Extension arm
      ctx.fillRect(hoop.x + 80, hoop.y - 40, 16, h - hoop.y + 40); // Main post

      // Hoop rim
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(hoop.rimLeft.x, hoop.rimLeft.y);
      ctx.lineTo(hoop.rimRight.x, hoop.rimRight.y);
      ctx.stroke();

      // Net (mesh strings)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hoop.rimLeft.x, hoop.rimLeft.y);
      ctx.lineTo(hoop.x - 10, hoop.y + hoop.netHeight);
      ctx.lineTo(hoop.x + 10, hoop.y + hoop.netHeight);
      ctx.lineTo(hoop.rimRight.x, hoop.rimRight.y);
      ctx.stroke();

      // Aiming trajectory arc
      if (state.isDragging) {
        const dx = state.dragStart.x - state.dragCurrent.x;
        const dy = state.dragStart.y - state.dragCurrent.y;
        const power = Math.min(Math.hypot(dx, dy), 160);
        const angle = Math.atan2(dy, dx);
        const simVx = Math.cos(angle) * power * 0.17;
        const simVy = Math.sin(angle) * power * 0.17;

        ctx.fillStyle = '#38bdf8';
        let simX = ball.x;
        let simY = ball.y;
        let simVcurY = simVy;

        for (let step = 0; step < 18; step++) {
          simX += simVx * 60 * 0.04;
          simVcurY += 700 * 0.04;
          simY += simVcurY * 60 * 0.04;

          ctx.beginPath();
          ctx.arc(simX, simY, 3.5 - step * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Ball
      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.fillStyle = state.streak > 2 ? '#ea580c' : '#f97316';
      ctx.beginPath();
      ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      // Basketball seam lines
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
      ctx.moveTo(-ball.radius, 0);
      ctx.lineTo(ball.radius, 0);
      ctx.moveTo(0, -ball.radius);
      ctx.lineTo(0, ball.radius);
      ctx.stroke();
      ctx.restore();

      // Swish text
      if (state.swishText) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(state.swishText.text, state.swishText.x, state.swishText.y);
      }

      // Particles
      for (const p of state.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (state.gameState === 'IDLE') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(0, 0, w, h);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onScoreUpdate]);

  return (
    <div className="relative w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 select-none">
      {/* Top HUD */}
      <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
        <div className="flex items-center gap-5">
          <div>
            <div className="text-[11px] text-slate-400">SCORE</div>
            <div className="text-xl font-bold font-mono text-amber-400">{score}</div>
          </div>
          <div className="h-6 w-[1px] bg-slate-700" />
          <div>
            <div className="text-[11px] text-slate-400">TIME</div>
            <div className="text-xl font-bold font-mono text-rose-400">{timeLeft}s</div>
          </div>
          {streak > 1 && (
            <div className="flex items-center gap-1 text-xs text-orange-400 font-bold bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{streak}x ON FIRE</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setMuted(sound.toggleMute())}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={680}
        height={500}
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handlePointerUp}
        className="w-full h-[440px] md:h-[480px] object-cover block cursor-grab active:cursor-grabbing bg-slate-950"
      />

      {gameState === 'IDLE' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 backdrop-blur-sm text-white">
          <div className="w-16 h-16 rounded-2xl bg-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Super Dunk: Street Hoops</h2>
          <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            Drag the basketball to aim your trajectory arc and release to score. Chain clean swishes to trigger multiplier flame combos!
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.02]"
          >
            Start Shootout
          </button>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/85 backdrop-blur-sm text-white">
          <div className="text-amber-500 font-bold tracking-widest text-sm mb-1 uppercase">Buzzer Beater</div>
          <h2 className="text-3xl font-bold text-white mb-4">Time Expired!</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-64 mb-6">
            <div className="text-xs text-slate-400 mb-1">TOTAL POINTS</div>
            <div className="text-2xl font-bold font-mono text-orange-400 mb-1">{score}</div>
            <div className="text-xs text-slate-500">Record: {highScore}</div>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <RotateCcw className="w-4 h-4" /> Shoot Again
          </button>
        </div>
      )}
    </div>
  );
};
