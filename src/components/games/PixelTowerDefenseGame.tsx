import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Shield, DollarSign, Crosshair } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Props {
  onScoreUpdate?: (score: number) => void;
}

type TowerType = 'gatling' | 'laser' | 'mortar';

interface TowerDef {
  type: TowerType;
  name: string;
  cost: number;
  range: number;
  damage: number;
  fireInterval: number; // seconds
  color: string;
}

const TOWER_SPECS: Record<TowerType, TowerDef> = {
  gatling: {
    type: 'gatling',
    name: 'Gatling Cannon',
    cost: 100,
    range: 105,
    damage: 18,
    fireInterval: 0.28,
    color: '#3b82f6',
  },
  laser: {
    type: 'laser',
    name: 'Cryo Laser',
    cost: 175,
    range: 130,
    damage: 12,
    fireInterval: 0.4,
    color: '#06b6d4',
  },
  mortar: {
    type: 'mortar',
    name: 'Plasma Mortar',
    cost: 250,
    range: 160,
    damage: 65,
    fireInterval: 1.1,
    color: '#8b5cf6',
  },
};

export const PixelTowerDefenseGame: React.FC<Props> = ({ onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>('IDLE');
  // Starts strictly at 0! No demo gold.
  const [gold, setGold] = useState(0);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [selectedTower, setSelectedTower] = useState<TowerType>('gatling');
  const [muted, setMuted] = useState(sound.getMuted());

  // Fixed path coordinates for enemies
  const pathWaypoints = [
    { x: 30, y: 120 },
    { x: 220, y: 120 },
    { x: 220, y: 360 },
    { x: 440, y: 360 },
    { x: 440, y: 160 },
    { x: 650, y: 160 },
  ];

  const stateRef = useRef({
    gameState: 'IDLE' as 'IDLE' | 'PLAYING' | 'GAMEOVER' | 'VICTORY',
    gold: 0,
    lives: 20,
    wave: 1,
    score: 0,
    waveSpawned: 0,
    waveMax: 15,
    waveActive: true,
    spawnTimer: 0,
    selectedTower: 'gatling' as TowerType,
    towers: [] as {
      x: number;
      y: number;
      type: TowerType;
      level: number;
      targetId: number | null;
      lastShot: number;
      angle: number;
    }[],
    enemies: [] as {
      id: number;
      wpIndex: number;
      x: number;
      y: number;
      speed: number;
      hp: number;
      maxHp: number;
      goldValue: number;
      color: string;
      radius: number;
    }[],
    projectiles: [] as {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      color: string;
      life: number;
    }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    enemyIdCounter: 1,
  });

  stateRef.current.selectedTower = selectedTower;

  const startGame = () => {
    stateRef.current = {
      gameState: 'PLAYING',
      gold: 0,
      lives: 20,
      wave: 1,
      score: 0,
      waveSpawned: 0,
      waveMax: 15,
      waveActive: true,
      spawnTimer: 0,
      selectedTower: 'gatling',
      towers: [],
      enemies: [],
      projectiles: [],
      particles: [],
      enemyIdCounter: 1,
    };
    setGameState('PLAYING');
    setGold(0);
    setLives(20);
    setWave(1);
    setScore(0);
    sound.playClick();
  };

  const handleMineGold = () => {
    stateRef.current.gold += 25;
    setGold(stateRef.current.gold);
    sound.playCoin();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 680 / rect.width;
    const scaleY = 520 / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check distance to path (cannot build on the road)
    for (let i = 0; i < pathWaypoints.length - 1; i++) {
      const p1 = pathWaypoints[i];
      const p2 = pathWaypoints[i + 1];
      const dist = distToSegment({ x: clickX, y: clickY }, p1, p2);
      if (dist < 38) {
        sound.playTone(200, 'sawtooth', 0.08, 0.1);
        return; // Too close to road!
      }
    }

    // Check distance to other towers
    for (const t of stateRef.current.towers) {
      if (Math.hypot(t.x - clickX, t.y - clickY) < 40) {
        // Upgrade tower if enough gold
        const spec = TOWER_SPECS[t.type];
        const upgradeCost = Math.round(spec.cost * 0.8);
        if (stateRef.current.gold >= upgradeCost) {
          stateRef.current.gold -= upgradeCost;
          setGold(stateRef.current.gold);
          t.level++;
          sound.playCoin();
        }
        return;
      }
    }

    // Place new tower
    const spec = TOWER_SPECS[stateRef.current.selectedTower];
    if (stateRef.current.gold >= spec.cost) {
      stateRef.current.gold -= spec.cost;
      setGold(stateRef.current.gold);
      stateRef.current.towers.push({
        x: clickX,
        y: clickY,
        type: stateRef.current.selectedTower,
        level: 1,
        targetId: null,
        lastShot: 0,
        angle: 0,
      });
      sound.playClick();
    } else {
      sound.playTone(180, 'sawtooth', 0.1, 0.15); // Not enough gold
    }
  };

  // Helper point to line segment distance
  function distToSegment(
    p: { x: number; y: number },
    v: { x: number; y: number },
    w: { x: number; y: number }
  ) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  // Main Loop
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

      if (state.gameState === 'PLAYING') {
        // Spawn Wave Enemies
        if (state.waveActive && state.waveSpawned < state.waveMax) {
          state.spawnTimer += dt;
          if (state.spawnTimer >= 1.2 - Math.min(0.7, state.wave * 0.05)) {
            state.spawnTimer = 0;
            state.waveSpawned++;
            const isBoss = state.waveSpawned === state.waveMax && state.wave % 3 === 0;

            state.enemies.push({
              id: state.enemyIdCounter++,
              wpIndex: 0,
              x: pathWaypoints[0].x,
              y: pathWaypoints[0].y,
              speed: isBoss ? 45 : 70 + state.wave * 4,
              hp: isBoss ? 200 + state.wave * 60 : 40 + state.wave * 15,
              maxHp: isBoss ? 200 + state.wave * 60 : 40 + state.wave * 15,
              goldValue: isBoss ? 80 : 15 + state.wave * 2,
              color: isBoss ? '#f43f5e' : state.waveSpawned % 2 === 0 ? '#fb923c' : '#38bdf8',
              radius: isBoss ? 16 : 10,
            });
          }
        }

        // Check if wave finished
        if (state.waveSpawned >= state.waveMax && state.enemies.length === 0) {
          state.wave++;
          setWave(state.wave);
          state.waveSpawned = 0;
          state.waveMax = 12 + state.wave * 3;
          state.gold += 100;
          setGold(state.gold);
          sound.playSuccess();
        }

        // Update Enemies
        for (let i = state.enemies.length - 1; i >= 0; i--) {
          const e = state.enemies[i];
          const targetWp = pathWaypoints[e.wpIndex + 1];

          if (!targetWp) {
            // Reached base!
            state.enemies.splice(i, 1);
            state.lives--;
            setLives(state.lives);
            sound.playExplosion();

            if (state.lives <= 0) {
              state.gameState = 'GAMEOVER';
              setGameState('GAMEOVER');
              sound.playGameOver();
            }
            continue;
          }

          const dx = targetWp.x - e.x;
          const dy = targetWp.y - e.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 4) {
            e.wpIndex++;
          } else {
            e.x += (dx / dist) * e.speed * dt;
            e.y += (dy / dist) * e.speed * dt;
          }
        }

        // Update Towers & Shooting
        for (const t of state.towers) {
          const spec = TOWER_SPECS[t.type];
          const effectiveRange = spec.range + (t.level - 1) * 20;
          const effectiveDamage = spec.damage * (1 + (t.level - 1) * 0.5);

          // Find target enemy in range
          let target = null;
          for (const e of state.enemies) {
            if (Math.hypot(e.x - t.x, e.y - t.y) <= effectiveRange) {
              target = e;
              break;
            }
          }

          if (target) {
            t.angle = Math.atan2(target.y - t.y, target.x - t.x);

            if (time - t.lastShot >= spec.fireInterval * 1000) {
              t.lastShot = time;
              sound.playLaser();

              target.hp -= effectiveDamage;

              // Laser beam / mortar projectile effect
              state.projectiles.push({
                x: t.x,
                y: t.y,
                targetX: target.x,
                targetY: target.y,
                color: spec.color,
                life: 0.12,
              });

              if (target.hp <= 0) {
                // Enemy slain
                const killedIdx = state.enemies.findIndex((item) => item.id === target!.id);
                if (killedIdx !== -1) {
                  const dead = state.enemies[killedIdx];
                  state.enemies.splice(killedIdx, 1);
                  state.gold += dead.goldValue;
                  state.score += dead.goldValue * 10;
                  setGold(state.gold);
                  setScore(state.score);
                  if (onScoreUpdate) onScoreUpdate(state.score);

                  // Death particles
                  for (let p = 0; p < 12; p++) {
                    state.particles.push({
                      x: dead.x,
                      y: dead.y,
                      vx: (Math.random() - 0.5) * 160,
                      vy: (Math.random() - 0.5) * 160,
                      life: 0.4,
                      color: dead.color,
                    });
                  }
                }
              }
            }
          }
        }

        // Update Projectiles & Particles
        for (let i = state.projectiles.length - 1; i >= 0; i--) {
          state.projectiles[i].life -= dt;
          if (state.projectiles[i].life <= 0) state.projectiles.splice(i, 1);
        }

        for (let i = state.particles.length - 1; i >= 0; i--) {
          const p = state.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt * 2;
          if (p.life <= 0) state.particles.splice(i, 1);
        }
      }

      // RENDER
      // Background ground (dark grid matrix)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Grid pattern
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Path
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 42;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pathWaypoints[0].x, pathWaypoints[0].y);
      for (let i = 1; i < pathWaypoints.length; i++) {
        ctx.lineTo(pathWaypoints[i].x, pathWaypoints[i].y);
      }
      ctx.stroke();

      // Inner road line
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Base / Citadel Sanctuary at the end
      const lastWp = pathWaypoints[pathWaypoints.length - 1];
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(lastWp.x, lastWp.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Projectiles (Lasers)
      for (const p of state.projectiles) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.targetX, p.targetY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Towers
      for (const t of state.towers) {
        const spec = TOWER_SPECS[t.type];
        ctx.save();
        ctx.translate(t.x, t.y);

        // Base
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = spec.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Rotating turret barrel
        ctx.rotate(t.angle);
        ctx.fillStyle = spec.color;
        ctx.fillRect(0, -4, 20, 8);

        // Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Level indicator
        if (t.level > 1) {
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(`+${t.level}`, -6, -18);
        }

        ctx.restore();
      }

      // Enemies
      for (const e of state.enemies) {
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Health bar
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(e.x - 12, e.y - e.radius - 6, 24, 4);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(e.x - 12, e.y - e.radius - 6, (e.hp / e.maxHp) * 24, 4);
      }

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
          <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>{gold}</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400 font-bold font-mono">
            <Shield className="w-4 h-4 text-rose-400" />
            <span>{lives} HP</span>
          </div>
          <div className="text-xs text-slate-300">
            Wave <span className="font-bold text-blue-400 font-mono">{wave}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted(sound.toggleMute())}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={680}
        height={520}
        onClick={handleCanvasClick}
        className="w-full h-[440px] md:h-[480px] object-cover block cursor-crosshair bg-slate-950"
      />

      {/* Lower Tactical Deck for selecting towers */}
      {gameState === 'PLAYING' && (
        <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-white">
          <div className="flex items-center gap-2">
            {(['gatling', 'laser', 'mortar'] as TowerType[]).map((type) => {
              const spec = TOWER_SPECS[type];
              const isSelected = selectedTower === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedTower(type)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600/30 border-blue-500 text-white shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: spec.color }} />
                  <span>{spec.name}</span>
                  <span className="text-amber-400 font-mono">${spec.cost}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleMineGold}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1"
            >
              <DollarSign className="w-3.5 h-3.5" /> Mine Gold (+25)
            </button>
            <div className="text-xs text-slate-400 hidden sm:block">
              Click green space to deploy
            </div>
          </div>
        </div>
      )}

      {gameState === 'IDLE' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 backdrop-blur-sm text-white">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Pixel Citadel: Tower Defense</h2>
          <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            Construct defense towers along the invasion route to safeguard the citadel core. Upgrade units and counter mechanized boss waves.
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            Deploy Defenses
          </button>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/85 backdrop-blur-sm text-white">
          <div className="text-rose-500 font-bold tracking-widest text-sm mb-1 uppercase">Citadel Breached</div>
          <h2 className="text-3xl font-bold text-white mb-4">Sanctuary Overrun</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-64 mb-6">
            <div className="text-xs text-slate-400 mb-1">FINAL SCORE</div>
            <div className="text-2xl font-bold font-mono text-blue-400 mb-1">{score.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Waves Cleared: {wave - 1}</div>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}
    </div>
  );
};
