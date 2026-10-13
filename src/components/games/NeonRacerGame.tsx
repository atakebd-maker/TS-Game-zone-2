import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Shield, Zap } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onScoreUpdate?: (score: number) => void;
}

export const NeonRacerGame: React.FC<Props> = ({ onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(120);
  const [nitro, setNitro] = useState(50);
  const [isBoosting, setIsBoosting] = useState(false);
  const [muted, setMuted] = useState(sound.getMuted());

  const stateRef = useRef({
    gameState: 'IDLE' as 'IDLE' | 'PLAYING' | 'GAMEOVER',
    playerX: 0.5, // 0 to 1
    targetX: 0.5,
    playerLane: 1, // 0: left, 1: center, 2: right
    nitro: 50,
    isBoosting: false,
    speed: 120,
    distance: 0,
    score: 0,
    traffic: [] as { x: number; y: number; speed: number; color: string; width: number; height: number }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    collectibles: [] as { x: number; y: number; type: 'nitro' | 'coin'; collected: boolean }[],
    roadOffset: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem('nr_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      playerX: 0.5,
      targetX: 0.5,
      playerLane: 1,
      nitro: 60,
      isBoosting: false,
      speed: 130,
      distance: 0,
      score: 0,
      traffic: [],
      particles: [],
      collectibles: [],
      roadOffset: 0,
    };
    setGameState('PLAYING');
    setScore(0);
    setNitro(60);
    setSpeed(130);
    sound.playClick();
  };

  const toggleMute = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.gameState !== 'PLAYING') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.targetX = Math.max(0.2, stateRef.current.targetX - 0.28);
        sound.playTone(280, 'sine', 0.05, 0.08);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.targetX = Math.min(0.8, stateRef.current.targetX + 0.28);
        sound.playTone(280, 'sine', 0.05, 0.08);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        if (stateRef.current.nitro > 10) {
          stateRef.current.isBoosting = true;
          setIsBoosting(true);
          sound.playTone(550, 'sawtooth', 0.1, 0.12);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        stateRef.current.isBoosting = false;
        setIsBoosting(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const state = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // Update
      if (state.gameState === 'PLAYING') {
        // Player smooth interpolation
        state.playerX += (state.targetX - state.playerX) * 12 * dt;

        // Nitro handling
        if (state.isBoosting && state.nitro > 0) {
          state.nitro = Math.max(0, state.nitro - 25 * dt);
          state.speed = Math.min(220, state.speed + 80 * dt);
          if (state.nitro <= 0) {
            state.isBoosting = false;
            setIsBoosting(false);
          }
        } else {
          state.speed = Math.max(130, state.speed - 40 * dt);
          state.nitro = Math.min(100, state.nitro + 5 * dt);
        }

        setNitro(Math.round(state.nitro));
        setSpeed(Math.round(state.speed));

        const moveFactor = (state.speed / 100) * 450 * dt;
        state.roadOffset = (state.roadOffset + moveFactor) % 80;
        state.distance += moveFactor;
        state.score += Math.round((state.speed / 5) * dt * 10);
        setScore(state.score);
        if (onScoreUpdate) onScoreUpdate(state.score);

        // Spawn traffic
        if (Math.random() < 0.025 + state.speed * 0.00005) {
          const lanes = [0.25, 0.5, 0.75];
          const chosenX = lanes[Math.floor(Math.random() * lanes.length)] + (Math.random() - 0.5) * 0.08;
          const colors = ['#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];
          state.traffic.push({
            x: chosenX,
            y: -100,
            speed: Math.random() * 30 + 40,
            color: colors[Math.floor(Math.random() * colors.length)],
            width: 44,
            height: 80,
          });
        }

        // Spawn collectibles
        if (Math.random() < 0.015) {
          const lanes = [0.25, 0.5, 0.75];
          const chosenX = lanes[Math.floor(Math.random() * lanes.length)];
          state.collectibles.push({
            x: chosenX,
            y: -50,
            type: Math.random() > 0.4 ? 'coin' : 'nitro',
            collected: false,
          });
        }

        // Update traffic
        const playerScreenY = h - 140;
        const playerScreenX = state.playerX * w;
        const playerW = 46;
        const playerH = 82;

        for (let i = state.traffic.length - 1; i >= 0; i--) {
          const car = state.traffic[i];
          const relativeSpeed = (state.speed - car.speed) * 3.5 * dt;
          car.y += relativeSpeed;

          // Collision detection
          const carScreenX = car.x * w;
          if (
            Math.abs(carScreenX - playerScreenX) < (playerW + car.width) * 0.42 &&
            Math.abs(car.y - playerScreenY) < (playerH + car.height) * 0.42
          ) {
            // Crash!
            sound.playExplosion();
            state.gameState = 'GAMEOVER';
            setGameState('GAMEOVER');
            setHighScore((prev) => {
              const nh = Math.max(prev, state.score);
              localStorage.setItem('nr_highscore', String(nh));
              return nh;
            });

            // Explode particles
            for (let p = 0; p < 35; p++) {
              state.particles.push({
                x: playerScreenX,
                y: playerScreenY,
                vx: (Math.random() - 0.5) * 400,
                vy: (Math.random() - 0.5) * 400,
                life: 1,
                color: '#38bdf8',
              });
            }
          }

          if (car.y > h + 150) {
            state.traffic.splice(i, 1);
          }
        }

        // Update collectibles
        for (let i = state.collectibles.length - 1; i >= 0; i--) {
          const item = state.collectibles[i];
          item.y += state.speed * 3.5 * dt;

          const itemScreenX = item.x * w;
          if (
            !item.collected &&
            Math.abs(itemScreenX - playerScreenX) < 45 &&
            Math.abs(item.y - playerScreenY) < 55
          ) {
            item.collected = true;
            if (item.type === 'coin') {
              sound.playCoin();
              state.score += 500;
              // Real coin reward
              try {
                const cur = parseInt(localStorage.getItem('ts_game_zone_coins') || '0', 10);
                localStorage.setItem('ts_game_zone_coins', String(cur + 2));
              } catch {}
            } else {
              sound.playTone(660, 'sine', 0.1, 0.15);
              state.nitro = Math.min(100, state.nitro + 35);
            }
            state.collectibles.splice(i, 1);
          } else if (item.y > h + 50) {
            state.collectibles.splice(i, 1);
          }
        }

        // Boost trail particles
        if (state.isBoosting) {
          state.particles.push({
            x: playerScreenX + (Math.random() - 0.5) * 20,
            y: playerScreenY + 40,
            vx: (Math.random() - 0.5) * 30,
            vy: 200 + Math.random() * 150,
            life: 0.3,
            color: '#06b6d4',
          });
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

      // RENDER
      // Background / Night Highway
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Distant skyline neon glow
      const horizonY = 100;
      const gradSky = ctx.createLinearGradient(0, 0, 0, horizonY);
      gradSky.addColorStop(0, '#040714');
      gradSky.addColorStop(1, '#0e1d38');
      ctx.fillStyle = gradSky;
      ctx.fillRect(0, 0, w, horizonY);

      // Road surface (asphalt with neon grid)
      const roadLeft = w * 0.12;
      const roadRight = w * 0.88;
      const roadWidth = roadRight - roadLeft;

      ctx.fillStyle = '#111827';
      ctx.fillRect(roadLeft, horizonY, roadWidth, h - horizonY);

      // Neon road borders
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(roadLeft, horizonY);
      ctx.lineTo(roadLeft, h);
      ctx.moveTo(roadRight, horizonY);
      ctx.lineTo(roadRight, h);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Road Lane lines
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([30, 30]);
      ctx.lineDashOffset = -state.roadOffset;

      const lane1X = roadLeft + roadWidth * 0.333;
      const lane2X = roadLeft + roadWidth * 0.666;

      ctx.beginPath();
      ctx.moveTo(lane1X, horizonY);
      ctx.lineTo(lane1X, h);
      ctx.moveTo(lane2X, horizonY);
      ctx.lineTo(lane2X, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Collectibles
      for (const item of state.collectibles) {
        const ix = item.x * w;
        if (item.type === 'coin') {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(ix, item.y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#78350f';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', ix, item.y);
        } else {
          // Nitro canister
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(ix - 10, item.y - 14, 20, 28);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('N₂O', ix, item.y + 4);
        }
      }

      // Draw Traffic Cars
      for (const car of state.traffic) {
        const cx = car.x * w;
        ctx.save();
        ctx.translate(cx, car.y);

        // Car body shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(-car.width / 2 - 2, -car.height / 2 + 4, car.width + 4, car.height + 4);

        // Car chassis
        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.roundRect(-car.width / 2, -car.height / 2, car.width, car.height, 8);
        ctx.fill();

        // Windshield
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-car.width * 0.35, -car.height * 0.2, car.width * 0.7, car.height * 0.35);

        // Taillights
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 8;
        ctx.fillRect(-car.width * 0.4, car.height * 0.42, 10, 5);
        ctx.fillRect(car.width * 0.4 - 10, car.height * 0.42, 10, 5);
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      // Draw Player Car
      const px = state.playerX * w;
      const py = h - 140;
      const pw = 48;
      const ph = 84;

      ctx.save();
      ctx.translate(px, py);

      // Underglow neon
      ctx.shadowColor = state.isBoosting ? '#06b6d4' : '#3b82f6';
      ctx.shadowBlur = state.isBoosting ? 25 : 15;
      ctx.fillStyle = state.isBoosting ? '#06b6d4' : '#2563eb';
      ctx.beginPath();
      ctx.roundRect(-pw / 2 - 4, -ph / 2 - 4, pw + 8, ph + 8, 12);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Main chassis
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 10);
      ctx.fill();

      // Cyber lines
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cockpit windshield
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(-pw * 0.32, -ph * 0.25, pw * 0.64, ph * 0.35, 4);
      ctx.fill();

      // Headlights pointing up
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.fillRect(-pw * 0.4, -ph * 0.48, 8, 4);
      ctx.fillRect(pw * 0.4 - 8, -ph * 0.48, 8, 4);
      ctx.shadowBlur = 0;

      ctx.restore();

      // Draw Particles
      for (const p of state.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Overlay if IDLE
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
      <div className="absolute top-0 left-0 right-0 z-10 px-5 py-3 bg-slate-900/85 backdrop-blur-md flex items-center justify-between border-b border-slate-800 text-white">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">SCORE</div>
            <div className="text-xl font-bold font-mono tracking-tight text-blue-400">{score.toLocaleString()}</div>
          </div>
          <div className="h-6 w-[1px] bg-slate-700" />
          <div>
            <div className="text-[11px] text-slate-400 font-medium">SPEED</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{speed} <span className="text-xs font-normal text-slate-400">MPH</span></div>
          </div>
        </div>

        {/* Nitro bar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" /> NITRO
            </div>
            <div className="w-24 h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-100 ${isBoosting ? 'bg-cyan-300 shadow-[0_0_8px_#06b6d4]' : 'bg-cyan-500'}`}
                style={{ width: `${nitro}%` }}
              />
            </div>
          </div>

          <button
            onClick={toggleMute}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={680}
        height={540}
        className="w-full h-[460px] md:h-[520px] object-cover block bg-slate-950"
      />

      {/* Start / Game Over Overlay */}
      {gameState === 'IDLE' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 backdrop-blur-sm text-white">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <Play className="w-8 h-8 fill-current text-white ml-1" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Neon Velocity: Overdrive</h2>
          <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            Dodge traffic, collect nitro boost cans and coins, and set record speeds on the synthwave highway.
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Race Now
          </button>
          <div className="mt-6 flex items-center gap-4 text-xs text-slate-400">
            <span>Controls: <strong>A / D</strong> or <strong>Left / Right</strong></span>
            <span>·</span>
            <span>Boost: <strong>W / Up Arrow</strong></span>
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/85 backdrop-blur-sm text-white">
          <div className="text-rose-500 font-bold tracking-widest text-sm mb-1 uppercase">Vehicle Totaled</div>
          <h2 className="text-3xl font-bold text-white mb-4">Wipeout!</h2>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 w-64 mb-6">
            <div className="text-xs text-slate-400 mb-1">FINAL SCORE</div>
            <div className="text-2xl font-bold font-mono text-blue-400 mb-2">{score.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Best: {highScore.toLocaleString()}</div>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <RotateCcw className="w-4 h-4" /> Play Again
          </button>
        </div>
      )}

      {/* Touch Controls for Mobile */}
      {gameState === 'PLAYING' && (
        <div className="md:hidden absolute bottom-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-auto">
          <div className="flex gap-2">
            <button
              onTouchStart={() => {
                stateRef.current.targetX = Math.max(0.2, stateRef.current.targetX - 0.28);
                sound.playTone(280, 'sine', 0.05, 0.08);
              }}
              className="w-14 h-14 bg-slate-800/80 border border-slate-700 text-white rounded-xl active:bg-blue-600 flex items-center justify-center font-bold text-lg backdrop-blur-md"
            >
              ◀
            </button>
            <button
              onTouchStart={() => {
                stateRef.current.targetX = Math.min(0.8, stateRef.current.targetX + 0.28);
                sound.playTone(280, 'sine', 0.05, 0.08);
              }}
              className="w-14 h-14 bg-slate-800/80 border border-slate-700 text-white rounded-xl active:bg-blue-600 flex items-center justify-center font-bold text-lg backdrop-blur-md"
            >
              ▶
            </button>
          </div>
          <button
            onTouchStart={() => {
              stateRef.current.isBoosting = true;
              setIsBoosting(true);
              sound.playTone(550, 'sawtooth', 0.1, 0.12);
            }}
            onTouchEnd={() => {
              stateRef.current.isBoosting = false;
              setIsBoosting(false);
            }}
            className="w-20 h-14 bg-cyan-600/80 border border-cyan-500 text-white rounded-xl active:bg-cyan-500 flex items-center justify-center font-bold text-sm tracking-wider uppercase backdrop-blur-md shadow-lg shadow-cyan-600/30"
          >
            Boost
          </button>
        </div>
      )}
    </div>
  );
};
