import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Shield, Crosshair } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onScoreUpdate?: (score: number) => void;
}

export const CosmicDefenderGame: React.FC<Props> = ({ onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [muted, setMuted] = useState(sound.getMuted());

  const stateRef = useRef({
    gameState: 'IDLE' as 'IDLE' | 'PLAYING' | 'GAMEOVER',
    playerX: 300,
    playerY: 450,
    playerVx: 0,
    playerVy: 0,
    targetX: 300,
    targetY: 450,
    isFiring: false,
    lastFireTime: 0,
    fireRate: 160,
    weaponLevel: 1, // 1 to 3
    shield: 100,
    lives: 3,
    score: 0,
    wave: 1,
    lasers: [] as { x: number; y: number; vx: number; vy: number; isPlayer: boolean; color: string }[],
    enemies: [] as {
      x: number;
      y: number;
      vx: number;
      vy: number;
      type: 'drone' | 'scout' | 'dreadnought';
      hp: number;
      maxHp: number;
      shootTimer: number;
      color: string;
      radius: number;
    }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[],
    stars: [] as { x: number; y: number; speed: number; size: number; alpha: number }[],
    powerups: [] as { x: number; y: number; type: 'spread' | 'shield'; vy: number }[],
  });

  useEffect(() => {
    const saved = localStorage.getItem('cd_highscore');
    if (saved) setHighScore(parseInt(saved, 10));

    // Generate initial starfield
    const stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * 680,
        y: Math.random() * 540,
        speed: Math.random() * 1.5 + 0.5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }
    stateRef.current.stars = stars;
  }, []);

  const startGame = () => {
    stateRef.current.gameState = 'PLAYING';
    stateRef.current.playerX = 340;
    stateRef.current.playerY = 460;
    stateRef.current.targetX = 340;
    stateRef.current.targetY = 460;
    stateRef.current.lives = 3;
    stateRef.current.score = 0;
    stateRef.current.wave = 1;
    stateRef.current.shield = 100;
    stateRef.current.weaponLevel = 1;
    stateRef.current.lasers = [];
    stateRef.current.enemies = [];
    stateRef.current.particles = [];
    stateRef.current.powerups = [];

    setGameState('PLAYING');
    setScore(0);
    setLives(3);
    setWave(1);
    sound.playClick();
  };

  const toggleMute = () => {
    setMuted(sound.toggleMute());
  };

  // Keyboard controls
  useEffect(() => {
    const keysDown = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.gameState !== 'PLAYING') return;
      keysDown.add(e.key.toLowerCase());

      if (e.key === ' ' || e.key === 'Spacebar') {
        stateRef.current.isFiring = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.key.toLowerCase());
      if (e.key === ' ' || e.key === 'Spacebar') {
        stateRef.current.isFiring = false;
      }
    };

    const interval = setInterval(() => {
      if (stateRef.current.gameState !== 'PLAYING') return;
      const s = stateRef.current;
      const speed = 6;
      if (keysDown.has('arrowleft') || keysDown.has('a')) s.playerX = Math.max(30, s.playerX - speed);
      if (keysDown.has('arrowright') || keysDown.has('d')) s.playerX = Math.min(650, s.playerX + speed);
      if (keysDown.has('arrowup') || keysDown.has('w')) s.playerY = Math.max(50, s.playerY - speed);
      if (keysDown.has('arrowdown') || keysDown.has('s')) s.playerY = Math.min(500, s.playerY + speed);
    }, 16);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Mouse & Touch aiming
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameState !== 'PLAYING') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = 680 / rect.width;
    const scaleY = 540 / rect.height;
    stateRef.current.playerX = (e.clientX - rect.left) * scaleX;
    stateRef.current.playerY = Math.min(500, Math.max(50, (e.clientY - rect.top) * scaleY));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameState !== 'PLAYING') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const scaleX = 680 / rect.width;
    const scaleY = 540 / rect.height;
    stateRef.current.playerX = (touch.clientX - rect.left) * scaleX;
    stateRef.current.playerY = Math.min(500, Math.max(50, (touch.clientY - rect.top) * scaleY));
  };

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const state = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // Update Starfield
      for (const star of state.stars) {
        star.y += star.speed * (state.gameState === 'PLAYING' ? 2 : 0.8);
        if (star.y > h) {
          star.y = 0;
          star.x = Math.random() * w;
        }
      }

      if (state.gameState === 'PLAYING') {
        // Continuous auto-fire or spacebar fire
        if (time - state.lastFireTime > state.fireRate) {
          state.lastFireTime = time;
          sound.playLaser();

          if (state.weaponLevel === 1) {
            state.lasers.push({
              x: state.playerX,
              y: state.playerY - 24,
              vx: 0,
              vy: -600,
              isPlayer: true,
              color: '#38bdf8',
            });
          } else if (state.weaponLevel === 2) {
            state.lasers.push(
              { x: state.playerX - 12, y: state.playerY - 20, vx: 0, vy: -600, isPlayer: true, color: '#38bdf8' },
              { x: state.playerX + 12, y: state.playerY - 20, vx: 0, vy: -600, isPlayer: true, color: '#38bdf8' }
            );
          } else {
            // Triple spread
            state.lasers.push(
              { x: state.playerX, y: state.playerY - 24, vx: 0, vy: -600, isPlayer: true, color: '#60a5fa' },
              { x: state.playerX - 14, y: state.playerY - 18, vx: -120, vy: -580, isPlayer: true, color: '#38bdf8' },
              { x: state.playerX + 14, y: state.playerY - 18, vx: 120, vy: -580, isPlayer: true, color: '#38bdf8' }
            );
          }
        }

        // Spawn Enemies
        if (state.enemies.length < 5 + state.wave * 2 && Math.random() < 0.035) {
          const typeRoll = Math.random();
          if (typeRoll < 0.6) {
            state.enemies.push({
              x: Math.random() * (w - 80) + 40,
              y: -30,
              vx: (Math.random() - 0.5) * 80,
              vy: 70 + Math.random() * 40,
              type: 'drone',
              hp: 1,
              maxHp: 1,
              shootTimer: Math.random() * 2 + 1,
              color: '#ef4444',
              radius: 16,
            });
          } else if (typeRoll < 0.9) {
            state.enemies.push({
              x: Math.random() * (w - 100) + 50,
              y: -40,
              vx: (Math.random() - 0.5) * 120,
              vy: 50 + Math.random() * 30,
              type: 'scout',
              hp: 3,
              maxHp: 3,
              shootTimer: 1.5,
              color: '#f59e0b',
              radius: 20,
            });
          } else {
            state.enemies.push({
              x: Math.random() * (w - 120) + 60,
              y: -50,
              vx: 0,
              vy: 30,
              type: 'dreadnought',
              hp: 8,
              maxHp: 8,
              shootTimer: 1,
              color: '#8b5cf6',
              radius: 30,
            });
          }
        }

        // Update Lasers
        for (let i = state.lasers.length - 1; i >= 0; i--) {
          const l = state.lasers[i];
          l.x += l.vx * dt;
          l.y += l.vy * dt;

          if (l.y < -20 || l.y > h + 20 || l.x < -20 || l.x > w + 20) {
            state.lasers.splice(i, 1);
            continue;
          }

          // Player laser collision with enemies
          if (l.isPlayer) {
            for (let j = state.enemies.length - 1; j >= 0; j--) {
              const e = state.enemies[j];
              const dx = l.x - e.x;
              const dy = l.y - e.y;
              if (Math.hypot(dx, dy) < e.radius + 6) {
                e.hp--;
                state.lasers.splice(i, 1);
                sound.playTone(380, 'sine', 0.05, 0.1);

                // Small impact spark
                for (let p = 0; p < 4; p++) {
                  state.particles.push({
                    x: l.x,
                    y: l.y,
                    vx: (Math.random() - 0.5) * 150,
                    vy: (Math.random() - 0.5) * 150,
                    life: 0.25,
                    color: '#38bdf8',
                    size: 2,
                  });
                }

                if (e.hp <= 0) {
                  sound.playExplosion();
                  const addPoints = e.type === 'drone' ? 100 : e.type === 'scout' ? 250 : 600;
                  state.score += addPoints;
                  setScore(state.score);
                  if (onScoreUpdate) onScoreUpdate(state.score);

                  // Death explosion
                  for (let p = 0; p < 25; p++) {
                    state.particles.push({
                      x: e.x,
                      y: e.y,
                      vx: (Math.random() - 0.5) * 260,
                      vy: (Math.random() - 0.5) * 260,
                      life: 0.6,
                      color: e.color,
                      size: Math.random() * 3 + 2,
                    });
                  }

                  // Drop powerup
                  if (Math.random() < 0.2) {
                    state.powerups.push({
                      x: e.x,
                      y: e.y,
                      type: Math.random() > 0.4 ? 'spread' : 'shield',
                      vy: 80,
                    });
                  }

                  state.enemies.splice(j, 1);

                  // Check wave progression
                  if (state.score > state.wave * 1500) {
                    state.wave++;
                    setWave(state.wave);
                    sound.playSuccess();
                  }
                }
                break;
              }
            }
          } else {
            // Enemy laser hits player
            const dx = l.x - state.playerX;
            const dy = l.y - state.playerY;
            if (Math.hypot(dx, dy) < 22) {
              state.lasers.splice(i, 1);
              state.shield -= 25;
              sound.playExplosion();

              if (state.shield <= 0) {
                state.lives--;
                setLives(state.lives);
                state.shield = 100;
                if (state.lives <= 0) {
                  state.gameState = 'GAMEOVER';
                  setGameState('GAMEOVER');
                  sound.playGameOver();
                  setHighScore((prev) => {
                    const nh = Math.max(prev, state.score);
                    localStorage.setItem('cd_highscore', String(nh));
                    return nh;
                  });
                }
              }
            }
          }
        }

        // Update Enemies
        for (let i = state.enemies.length - 1; i >= 0; i--) {
          const e = state.enemies[i];
          e.x += e.vx * dt;
          e.y += e.vy * dt;

          if (e.x < e.radius || e.x > w - e.radius) e.vx *= -1;

          e.shootTimer -= dt;
          if (e.shootTimer <= 0 && e.y < h - 100) {
            e.shootTimer = e.type === 'drone' ? 2.5 : 1.6;
            state.lasers.push({
              x: e.x,
              y: e.y + e.radius,
              vx: (state.playerX - e.x) * 0.4,
              vy: 240,
              isPlayer: false,
              color: '#f43f5e',
            });
          }

          // Enemy collision with player ship
          const distToPlayer = Math.hypot(e.x - state.playerX, e.y - state.playerY);
          if (distToPlayer < e.radius + 18) {
            sound.playExplosion();
            state.enemies.splice(i, 1);
            state.lives--;
            setLives(state.lives);
            if (state.lives <= 0) {
              state.gameState = 'GAMEOVER';
              setGameState('GAMEOVER');
              sound.playGameOver();
            }
            continue;
          }

          if (e.y > h + 50) {
            state.enemies.splice(i, 1);
          }
        }

        // Update Powerups
        for (let i = state.powerups.length - 1; i >= 0; i--) {
          const p = state.powerups[i];
          p.y += p.vy * dt;
          const dist = Math.hypot(p.x - state.playerX, p.y - state.playerY);
          if (dist < 26) {
            sound.playCoin();
            if (p.type === 'spread') {
              state.weaponLevel = Math.min(3, state.weaponLevel + 1);
            } else {
              state.shield = Math.min(100, state.shield + 40);
            }
            state.powerups.splice(i, 1);
          } else if (p.y > h + 30) {
            state.powerups.splice(i, 1);
          }
        }
      }

      // Update Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 1.5;
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      // RENDER
      ctx.fillStyle = '#050814';
      ctx.fillRect(0, 0, w, h);

      // Starfield
      for (const s of state.stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Powerups
      for (const p of state.powerups) {
        ctx.fillStyle = p.type === 'spread' ? '#38bdf8' : '#10b981';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Lasers
      for (const l of state.lasers) {
        ctx.fillStyle = l.color;
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(l.x - 2, l.y - 7, 4, 14);
        ctx.shadowBlur = 0;
      }

      // Enemies
      for (const e of state.enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);

        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        if (e.type === 'drone') {
          ctx.moveTo(0, e.radius);
          ctx.lineTo(-e.radius, -e.radius);
          ctx.lineTo(0, -e.radius * 0.4);
          ctx.lineTo(e.radius, -e.radius);
          ctx.closePath();
        } else if (e.type === 'scout') {
          ctx.moveTo(0, e.radius);
          ctx.lineTo(-e.radius * 1.2, 0);
          ctx.lineTo(0, -e.radius);
          ctx.lineTo(e.radius * 1.2, 0);
          ctx.closePath();
        } else {
          // Dreadnought
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Health bar for tougher enemies
        if (e.maxHp > 1) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(-16, -e.radius - 8, 32, 4);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(-16, -e.radius - 8, (e.hp / e.maxHp) * 32, 4);
        }

        ctx.restore();
      }

      // Particles
      for (const p of state.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Player Ship
      if (state.gameState === 'PLAYING') {
        const px = state.playerX;
        const py = state.playerY;

        ctx.save();
        ctx.translate(px, py);

        // Thruster glow
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(-8, 16);
        ctx.lineTo(0, 28 + Math.random() * 8);
        ctx.lineTo(8, 16);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Hull
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(18, 16);
        ctx.lineTo(0, 10);
        ctx.lineTo(-18, 16);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.ellipse(0, -4, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      }

      // Idle dimmer
      if (state.gameState === 'IDLE') {
        ctx.fillStyle = 'rgba(10, 15, 30, 0.7)';
        ctx.fillRect(0, 0, w, h);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onScoreUpdate]);

  return (
    <div className="relative w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-950 select-none">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 px-5 py-3 bg-slate-900/85 backdrop-blur-md flex items-center justify-between border-b border-slate-800 text-white">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">SCORE</div>
            <div className="text-xl font-bold font-mono text-cyan-400">{score.toLocaleString()}</div>
          </div>
          <div className="h-6 w-[1px] bg-slate-700" />
          <div>
            <div className="text-[11px] text-slate-400 font-medium">SECTOR</div>
            <div className="text-xl font-bold font-mono text-amber-400">0{wave}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-sm transform rotate-45 transition-colors ${
                  i < lives ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={toggleMute}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={680}
        height={540}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="w-full h-[460px] md:h-[520px] object-cover block cursor-crosshair bg-slate-950"
      />

      {gameState === 'IDLE' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 backdrop-blur-sm text-white">
          <div className="w-16 h-16 rounded-2xl bg-cyan-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
            <Crosshair className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Cosmic Defender: Starhawk</h2>
          <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            Pilot your starfighter, destroy alien formations, collect shield and blaster upgrades, and survive deep space sectors.
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-600/30 transition-all hover:scale-[1.02]"
          >
            Launch Starfighter
          </button>
          <div className="mt-6 flex items-center gap-4 text-xs text-slate-400">
            <span>Mouse or <strong>WASD / Arrows</strong> to fly</span>
            <span>·</span>
            <span>Laser blasters fire automatically</span>
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/85 backdrop-blur-sm text-white">
          <div className="text-rose-500 font-bold tracking-widest text-sm mb-1 uppercase">Starfighter Destroyed</div>
          <h2 className="text-3xl font-bold text-white mb-4">Mission Failed</h2>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 w-64 mb-6">
            <div className="text-xs text-slate-400 mb-1">SECTOR SCORE</div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mb-2">{score.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Highscore: {highScore.toLocaleString()}</div>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}
    </div>
  );
};
