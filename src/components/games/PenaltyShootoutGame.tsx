import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Trophy } from 'lucide-react';
import { sound } from '../../utils/audio';

export const PenaltyShootoutGame: React.FC<{ onScoreUpdate?: (score: number) => void }> = ({ onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'RESULT'>('IDLE');
  const [goals, setGoals] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;
  const [muted, setMuted] = useState(sound.getMuted());

  const stateRef = useRef({
    gameState: 'IDLE' as 'IDLE' | 'PLAYING' | 'RESULT',
    goals: 0,
    attempts: 0,
    ball: { x: 340, y: 440, z: 0, vx: 0, vy: 0, vz: 0, radius: 18, isKicked: false },
    keeper: { x: 340, y: 220, targetX: 340, isDiving: false, diveDir: 0 },
    message: '' as string,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
  });

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      goals: 0,
      attempts: 0,
      ball: { x: 340, y: 440, z: 0, vx: 0, vy: 0, vz: 0, radius: 18, isKicked: false },
      keeper: { x: 340, y: 220, targetX: 340, isDiving: false, diveDir: 0 },
      message: 'Aim and click anywhere on the goal!',
      particles: [],
    };
    setGameState('PLAYING');
    setGoals(0);
    setAttempts(0);
    sound.playClick();
  };

  const handleShoot = (targetX: number, targetY: number) => {
    if (stateRef.current.gameState !== 'PLAYING' || stateRef.current.ball.isKicked) return;

    const ball = stateRef.current.ball;
    const keeper = stateRef.current.keeper;

    ball.isKicked = true;
    sound.playBounce();

    // Keeper AI picks dive direction (-1, 0, 1)
    const dives = [-120, -70, 0, 70, 120];
    const chosenDive = dives[Math.floor(Math.random() * dives.length)];
    keeper.targetX = 340 + chosenDive;
    keeper.isDiving = true;

    // Ball velocity toward target
    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    ball.vx = dx * 1.8;
    ball.vy = dy * 1.8;

    setTimeout(() => {
      // Check goal or save
      const goalPosts = { left: 160, right: 520, top: 120, bottom: 250 };
      const isInGoal =
        targetX >= goalPosts.left &&
        targetX <= goalPosts.right &&
        targetY >= goalPosts.top &&
        targetY <= goalPosts.bottom;

      const keeperSave = Math.abs(targetX - keeper.targetX) < 55 && Math.abs(targetY - keeper.y) < 65;

      const newAttempts = stateRef.current.attempts + 1;
      stateRef.current.attempts = newAttempts;
      setAttempts(newAttempts);

      if (isInGoal && !keeperSave) {
        sound.playSuccess();
        const newGoals = stateRef.current.goals + 1;
        stateRef.current.goals = newGoals;
        setGoals(newGoals);
        stateRef.current.message = 'GOAAAL! Beautiful strike!';
        if (onScoreUpdate) onScoreUpdate(newGoals * 200);

        for (let p = 0; p < 25; p++) {
          stateRef.current.particles.push({
            x: targetX,
            y: targetY,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 0.6,
            color: '#10b981',
          });
        }
      } else if (keeperSave) {
        sound.playExplosion();
        stateRef.current.message = 'SAVED! Brilliant stop by keeper!';
      } else {
        sound.playTone(200, 'sawtooth', 0.1, 0.1);
        stateRef.current.message = 'MISSED! Shot flew wide!';
      }

      // Next shot or end match
      setTimeout(() => {
        if (newAttempts >= maxAttempts) {
          stateRef.current.gameState = 'RESULT';
          setGameState('RESULT');
        } else {
          // Reset ball
          ball.x = 340;
          ball.y = 440;
          ball.vx = 0;
          ball.vy = 0;
          ball.isKicked = false;
          keeper.x = 340;
          keeper.targetX = 340;
          keeper.isDiving = false;
        }
      }, 1200);
    }, 450);
  };

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
      const keeper = state.keeper;

      // Update
      if (ball.isKicked) {
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
      }

      if (keeper.isDiving) {
        keeper.x += (keeper.targetX - keeper.x) * 8 * dt;
      }

      // Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 1.5;
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      // RENDER
      // Stadium & Pitch
      ctx.fillStyle = '#065f46'; // Green pitch
      ctx.fillRect(0, 0, w, h);

      // Grass stripes
      ctx.fillStyle = '#047857';
      for (let y = 0; y < h; y += 60) {
        ctx.fillRect(0, y, w, 30);
      }

      // Penalty box lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(100, 180, 480, 260);

      // Goal Frame
      const goalLeft = 160;
      const goalRight = 520;
      const goalTop = 120;
      const goalBottom = 250;

      // Net backing
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(goalLeft, goalTop, goalRight - goalLeft, goalBottom - goalTop);

      // Net grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      for (let x = goalLeft; x <= goalRight; x += 15) {
        ctx.beginPath();
        ctx.moveTo(x, goalTop);
        ctx.lineTo(x, goalBottom);
        ctx.stroke();
      }
      for (let y = goalTop; y <= goalBottom; y += 15) {
        ctx.beginPath();
        ctx.moveTo(goalLeft, y);
        ctx.lineTo(goalRight, y);
        ctx.stroke();
      }

      // Posts
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.strokeRect(goalLeft, goalTop, goalRight - goalLeft, goalBottom - goalTop);

      // Goalkeeper
      ctx.save();
      ctx.translate(keeper.x, keeper.y);
      ctx.fillStyle = '#eab308'; // Yellow jersey
      ctx.beginPath();
      ctx.roundRect(-16, -26, 32, 44, 8);
      ctx.fill();

      // Head
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -36, 12, 0, Math.PI * 2);
      ctx.fill();

      // Gloves
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(-22, -10, 8, 0, Math.PI * 2);
      ctx.arc(22, -10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Football
      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Black patches
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Particles
      for (const p of state.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Status text
      if (state.message && state.gameState === 'PLAYING') {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(state.message, w / 2, 80);
      }

      if (state.gameState === 'IDLE') {
        ctx.fillStyle = 'rgba(6, 78, 59, 0.75)';
        ctx.fillRect(0, 0, w, h);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onScoreUpdate]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 680 / rect.width;
    const scaleY = 500 / rect.height;
    handleShoot((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-emerald-900 bg-emerald-950 select-none">
      <div className="px-5 py-3 bg-emerald-900 border-b border-emerald-800 flex items-center justify-between text-white">
        <div className="flex items-center gap-5">
          <div>
            <div className="text-[11px] text-emerald-200">GOALS</div>
            <div className="text-xl font-bold font-mono text-amber-300">{goals} / {attempts}</div>
          </div>
          <div className="h-6 w-[1px] bg-emerald-700" />
          <div>
            <div className="text-[11px] text-emerald-200">SHOTS LEFT</div>
            <div className="text-xl font-bold font-mono text-white">{maxAttempts - attempts}</div>
          </div>
        </div>

        <button
          onClick={() => setMuted(sound.toggleMute())}
          className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800"
        >
          {muted ? <VolumeX className="w-5 h-5 text-rose-300" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={680}
        height={500}
        onClick={handleCanvasClick}
        className="w-full h-[440px] md:h-[480px] object-cover block cursor-crosshair bg-emerald-900"
      />

      {gameState === 'IDLE' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-emerald-950/85 backdrop-blur-sm text-white">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mb-4 shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Apex Football: Penalty Cup</h2>
          <p className="text-sm text-emerald-200 max-w-md mb-6">
            Click anywhere on the goal frame to place your penalty kick. Beat the keeper's dive across 5 rounds!
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg"
          >
            Take the Penalty
          </button>
        </div>
      )}

      {gameState === 'RESULT' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-emerald-950/90 backdrop-blur-sm text-white">
          <Trophy className="w-12 h-12 text-amber-400 mb-2" />
          <h2 className="text-3xl font-bold mb-2">Match Finished!</h2>
          <div className="text-xl text-emerald-200 mb-6">You scored {goals} out of {maxAttempts} penalties.</div>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Shoot Again
          </button>
        </div>
      )}
    </div>
  );
};
