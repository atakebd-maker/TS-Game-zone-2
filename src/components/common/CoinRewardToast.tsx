import React, { useState, useEffect } from 'react';
import { playerWallet, CoinRewardEvent } from '../../utils/wallet';
import { sound } from '../../utils/audio';
import { Sparkles } from 'lucide-react';

export const CoinRewardToast: React.FC = () => {
  const [toast, setToast] = useState<{ id: number; amount: number; source?: string } | null>(null);

  useEffect(() => {
    return playerWallet.onReward((event: CoinRewardEvent) => {
      sound.playCoin();
      setToast({
        id: Date.now(),
        amount: event.amount,
        source: event.source,
      });

      const timer = setTimeout(() => {
        setToast((current) => (current && Date.now() - current.id >= 2400 ? null : current));
      }, 2500);

      return () => clearTimeout(timer);
    });
  }, []);

  if (!toast) return null;

  return (
    <aside
      aria-label="Coin Reward Notification"
      className="fixed bottom-6 right-6 z-50 pointer-events-none animate-bounce"
    >
      <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black px-5 py-3 rounded-2xl shadow-2xl border-2 border-yellow-200 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center text-xl shadow-inner">
          🪙
        </div>
        <div>
          <div className="text-sm font-black flex items-center gap-1.5 leading-tight">
            <span>+{toast.amount} COINS EARNED!</span>
            <Sparkles className="w-4 h-4 text-amber-900 fill-current" />
          </div>
          <div className="text-[11px] font-bold text-amber-950/80">
            {toast.source ? `From ${toast.source}` : 'Added to your TS Game Zone wallet!'}
          </div>
        </div>
      </div>
    </aside>
  );
};
