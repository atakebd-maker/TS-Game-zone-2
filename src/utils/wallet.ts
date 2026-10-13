export interface CoinRewardEvent {
  amount: number;
  source?: string;
  total: number;
}

class PlayerWallet {
  private coins: number = 0;
  private listeners: ((coins: number) => void)[] = [];
  private rewardListeners: ((event: CoinRewardEvent) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      // Clean up legacy keys that might have had demo/dummy coins
      try {
        localStorage.removeItem('novaplay_coins');
      } catch {}

      const saved = localStorage.getItem('ts_game_zone_coins');
      // STRICT RULE: Starts at 0! No demo or starter coins allowed.
      this.coins = saved ? Math.max(0, parseInt(saved, 10) || 0) : 0;
    }
  }

  public getCoins(): number {
    return this.coins;
  }

  public addCoins(amount: number, source?: string): number {
    if (amount <= 0) return this.coins;
    const rounded = Math.round(amount);
    this.coins += rounded;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ts_game_zone_coins', String(this.coins));
      } catch {}
    }

    this.notify();
    this.notifyReward({ amount: rounded, source, total: this.coins });
    return this.coins;
  }

  public resetCoins(): void {
    this.coins = 0;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ts_game_zone_coins', '0');
      } catch {}
    }
    this.notify();
  }

  public subscribe(cb: (coins: number) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public onReward(cb: (event: CoinRewardEvent) => void): () => void {
    this.rewardListeners.push(cb);
    return () => {
      this.rewardListeners = this.rewardListeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.coins));
  }

  private notifyReward(event: CoinRewardEvent) {
    this.rewardListeners.forEach((l) => l(event));
  }
}

export const playerWallet = new PlayerWallet();
