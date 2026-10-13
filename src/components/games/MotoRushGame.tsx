import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Bike } from 'lucide-react';
import { sound } from '../../utils/audio';
import { playerWallet } from '../../utils/wallet';

export const MotoRushGame: React.FC<{ onScoreUpdate?: (score: number) => void }> = ({ onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'CRASHED'>('IDLE');
  const [distance, setDistance] = useState(0);
  const [coins, setCoins] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [muted, setMuted] = useState(sound.getMuted());

  const stateRef = useRef({
    gameState: 'IDLE' as 'IDLE' | 'PLAYING' | 'CRASHED',
    bikeX: 140,
    bikeY: 300,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    distance: 0,
    coins: 0,
    gas: false,
    brake: false,
    tiltLeft: false,
    tiltRight: false,
    coinsList: [] as { x: number; y: number; collected: boolean }[],
  });

  const getGroundHeight = (x: number) => {
    return 360 + Math.sin(x * 0.005) * 50 + Math.cos(x * 0.012) * 25 + Math.sin(x * 0.002) * 40;
  };

  const startGame = () => {
    const initCoins = [];
    for (let x = 300; x < 6000; x += 180 + Math.random() * 100) {
      initCoins.push({ x, y: getGroundHeight(x) - 40, collected: false });
    }

    stateRef.current = {
      gameState: 'PLAYING',
      bikeX: 140,
      bikeY: getGroundHeight(140) - 20,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVelocity: 0,
      distance: 0,
      coins: 0,
      gas: false,
      brake: false,
      tiltLeft: false,
      tiltRight: false,
      coinsList: initCoins,
    };

    setGameState('PLAYING');
    setDistance(0);
    setCoins(0);
    sound.playClick();
  };

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (s.gameState !== 'PLAYING') return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') s.gas = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') s.brake = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.tiltLeft = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.tiltRight = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') s.gas = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') s.brake = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.tiltLeft = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.tiltRight = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
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

      if (state.gameState === 'PLAYING') {
        // Physics update
        const groundY = getGroundHeight(state.bikeX);
        const isOnGround = state.bikeY >= groundY - 14;

        if (state.gas) {
          state.vx += isOnGround ? 280 * dt : 60 * dt;
          sound.playTone(180 + state.vx * 0.3, 'sawtooth', 0.04, 0.04);
        }
        if (state.brake) {
          state.vx = Math.max(0, state.vx - 300 * dt);
        }

        // Tilt in air or ground
        if (state.tiltLeft) state.angularVelocity -= 4.5 * dt;
        if (state.tiltRight) state.angularVelocity += 4.5 * dt;

        state.angle += state.angularVelocity * dt;
        state.angularVelocity *= 0.94; // damping

        // Gravity
        state.vy += 650 * dt;
        state.bikeX += state.vx * dt;
        state.bikeY += state.vy * dt;

        state.distance = Math.floor(state.bikeX - 140);
        setDistance(state.distance);
        if (onScoreUpdate) onScoreUpdate(state.distance + state.coins * 50);

        // Ground collision & terrain slope alignment
        if (isOnGround) {
          state.bikeY = groundY - 14;
          state.vy = 0;
          // Friction
          state.vx *= 0.985;

          // Ground slope
          const slope = (getGroundHeight(state.bikeX + 10) - getGroundHeight(state.bikeX - 10)) / 20;
          const targetAngle = Math.atan(slope);
          state.angle += (targetAngle - state.angle) * 8 * dt;

          // Check if head crashed into ground (upside down)
          const angleNorm = Math.abs(state.angle % (Math.PI * 2));
          if (angleNorm > 1.8 && angleNorm < 4.5) {
            sound.playExplosion();
            state.gameState = 'CRASHED';
            setGameState('CRASHED');
            setHighScore((prev) => Math.max(prev, state.distance));
          }
        }

        // Check coin pickup
        for (const c of state.coinsList) {
          if (!c.collected && Math.hypot(c.x - state.bikeX, c.y - state.bikeY) < 32) {
            c.collected = true;
            sound.playCoin();
            state.coins++;
            setCoins(state.coins);
            playerWallet.addCoins(1);
          }
        }
      }

      // RENDER
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Camera follows bikeX
      const camX = state.bikeX - w * 0.3;

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Distant mountains
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 30) {
        const mx = x + camX * 0.3;
        const my = 260 + Math.sin(mx * 0.003) * 60;
        ctx.lineTo(x, my);
      }
      ctx.lineTo(w, h);
      ctx.fill();

      // Rolling Hills Ground
      ctx.fillStyle = '#15803d'; // Green grass
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 15) {
        const worldX = x + camX;
        const gy = getGroundHeight(worldX);
        ctx.lineTo(x, gy);
      }
      ctx.lineTo(w, h);
      ctx.fill();

      // Earth layer under grass
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 15) {
        const worldX = x + camX;
        const gy = getGroundHeight(worldX) + 16;
        ctx.lineTo(x, gy);
      }
      ctx.lineTo(w, h);
      ctx.fill();

      // Coins
      for (const c of state.coinsList) {
        if (!c.collected && c.x > camX - 30 && c.x < camX + w + 30) {
          const screenX = c.x - camX;
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(screenX, c.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Draw Dirt Bike & Rider
      const bikeScreenX = state.bikeX - camX;
      const bikeScreenY = state.bikeY;

      ctx.save();
      ctx.translate(bikeScreenX, bikeScreenY);
      ctx.rotate(state.angle);

      // Wheels
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(-16, 6, 8, 0, Math.PI * 2);
      ctx.arc(16, 6, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Chassis frame
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-16, 6);
      ctx.lineTo(0, -4);
      ctx.lineTo(16, 6);
      ctx.moveTo(0, -4);
      ctx.lineTo(-6, -14);
      ctx.lineTo(10, -14);
      ctx.stroke();

      // Rider body
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-8, -26, 10, 14);

      // Helmet
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(-3, -32, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      if (state.gameState === 'IDLE') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.fillRect(0, 0, w, h);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onScoreUpdate]);

  return (
    <div className="relative w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 select-none">
      <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[11px] text-slate-400">DISTANCE</div>
            <div className="text-xl font-bold font-mono text-cyan-400">{distance}m</div>
          </div>
          <div className="h-6 w-[1px] bg-slate-700" />
          <div>
            <div className="text-[11px] text-slate-400">COINS</div>
            <div className="text-xl font-bold font-mono text-amber-400">{coins}</div>
          </div>
        </div>

        <button onClick={() => setMuted(sound.toggleMute())} className="p-1.5 text-slate-400 hover:text-white">
          {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <canvas ref={canvasRef} width={680} height={460} className="w-full h-[400px] object-cover block bg-sky-500" />

      {gameState === 'IDLE' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 backdrop-blur-sm text-white">
          <div className="w-16 h-16 rounded-2xl bg-rose-600 flex items-center justify-center mb-4 shadow-lg">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Moto Rush: Stunt Trials</h2>
          <p className="text-sm text-slate-300 max-w-sm mb-6">
            Throttle across rolling hills, balance your dirt bike in mid-air, and collect gold coins without flipping!
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-lg"
          >
            Start Stunt Ride
          </button>
        </div>
      )}

      {gameState === 'CRASHED' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/85 backdrop-blur-sm text-white">
          <h2 className="text-3xl font-bold mb-2 text-rose-500">Wipeout!</h2>
          <div className="text-xl text-slate-300 mb-6">You rode {distance} meters and grabbed {coins} coins.</div>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-lg flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Ride Again
          </button>
        </div>
      )}

      {/* Mobile controls */}
      {gameState === 'PLAYING' && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between md:hidden">
          <div className="flex gap-2">
            <button
              onTouchStart={() => (stateRef.current.tiltLeft = true)}
              onTouchEnd={() => (stateRef.current.tiltLeft = false)}
              className="w-14 h-12 bg-slate-800 text-white font-bold rounded-lg"
            >
              ⟲
            </button>
            <button
              onTouchStart={() => (stateRef.current.tiltRight = true)}
              onTouchEnd={() => (stateRef.current.tiltRight = false)}
              className="w-14 h-12 bg-slate-800 text-white font-bold rounded-lg"
            >
              ⟳
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onTouchStart={() => (stateRef.current.brake = true)}
              onTouchEnd={() => (stateRef.current.brake = false)}
              className="w-14 h-12 bg-rose-700 text-white font-bold rounded-lg"
            >
              Brake
            </button>
            <button
              onTouchStart={() => (stateRef.current.gas = true)}
              onTouchEnd={() => (stateRef.current.gas = false)}
              className="w-14 h-12 bg-emerald-600 text-white font-bold rounded-lg"
            >
              Gas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
