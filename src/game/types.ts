export interface CarStats {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  unlocked: boolean;
  color: string;
  // Base stats (1 to 10 scale)
  maxSpeed: number; // km/h base scale
  acceleration: number;
  handling: number;
  driftFactor: number;
  braking: number;
  // Upgrade levels (0 to 5)
  upgrades: {
    engine: number;
    tires: number;
    suspension: number;
    steering: number;
    brakes: number;
  };
}

export interface TrackData {
  id: string;
  name: string;
  theme: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  unlocked: boolean;
  price: number;
  bestScore: number;
  description: string;
  thumbnailColor: string;
}

export interface PlayerSaveData {
  cash: number;
  level: number;
  totalScore: number;
  bestScore: number;
  selectedCarId: string;
  selectedTrackId: string;
  cars: Record<string, CarStats>;
  unlockedTracks: string[];
  trackRecords: Record<string, number>;
  settings: {
    masterVolume: number;
    engineVolume: number;
    sfxVolume: number;
    steeringSensitivity: number;
    quality: 'low' | 'medium' | 'high';
    showFps: boolean;
    touchControls: boolean;
  };
}

export interface InputState {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 to 1
  handbrake: boolean;
  reset: boolean;
}

export interface DriftEventState {
  isDrifting: boolean;
  angle: number; // degrees
  speedKmh: number;
  score: number;
  combo: number;
  comboTimer: number; // 0 to 1 ratio remaining
  multiplier: number;
  calloutText: string;
  calloutType: 'drift' | 'amazing' | 'perfect' | 'lost' | null;
  proximityBonus: boolean;
  slipRatio: number;
}
