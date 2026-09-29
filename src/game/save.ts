import { PlayerSaveData, CarStats } from './types';

const STORAGE_KEY = 'street_drift_3d_save_f1_v1';

export const DEFAULT_CARS: Record<string, CarStats> = {
  street: {
    id: 'street',
    name: 'F1 Scuderia Corsa',
    subtitle: 'Monoposto V6 Turbo-Híbrido de 1000cv com downforce aerodinâmico',
    price: 0,
    unlocked: true,
    color: '#ef4444', // Rosso Corsa
    maxSpeed: 8.5, // ~330 km/h
    acceleration: 8.8,
    handling: 8.2,
    driftFactor: 7.2,
    braking: 8.5,
    upgrades: {
      engine: 0,
      tires: 0,
      suspension: 0,
      steering: 0,
      brakes: 0,
    },
  },
  racer: {
    id: 'racer',
    name: 'F1 Silver Star W15',
    subtitle: 'Monstro de velocidade em retas longas atingindo 350+ km/h',
    price: 4500,
    unlocked: false,
    color: '#06b6d4', // Petronas Cyan
    maxSpeed: 9.6, // ~355 km/h
    acceleration: 9.2,
    handling: 8.0,
    driftFactor: 7.5,
    braking: 9.0,
    upgrades: {
      engine: 0,
      tires: 0,
      suspension: 0,
      steering: 0,
      brakes: 0,
    },
  },
  drifter: {
    id: 'drifter',
    name: 'F1 Bullspec RB20',
    subtitle: 'Efeito solo extremo de Adrian Newey com agilidade cirúrgica em curvas',
    price: 9000,
    unlocked: false,
    color: '#1e3a8a', // Dark Navy Red Bull style
    maxSpeed: 9.0, // ~345 km/h
    acceleration: 9.5,
    handling: 9.8,
    driftFactor: 8.5,
    braking: 9.2,
    upgrades: {
      engine: 0,
      tires: 0,
      suspension: 0,
      steering: 0,
      brakes: 0,
    },
  },
};

export const INITIAL_SAVE: PlayerSaveData = {
  cash: 1500,
  level: 1,
  totalScore: 0,
  bestScore: 0,
  selectedCarId: 'street',
  selectedTrackId: 'industrial',
  cars: DEFAULT_CARS,
  unlockedTracks: ['industrial'],
  trackRecords: {
    industrial: 0,
    mountain: 0,
    downtown: 0,
  },
  settings: {
    masterVolume: 0.8,
    engineVolume: 0.7,
    sfxVolume: 0.8,
    steeringSensitivity: 1.0,
    quality: 'high',
    showFps: true,
    touchControls: false,
  },
};

export class SaveManager {
  private static instance: SaveManager;
  private data: PlayerSaveData;

  private constructor() {
    this.data = this.loadGame();
  }

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public loadGame(): PlayerSaveData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Deep merge with initial save to ensure missing fields exist
        return {
          ...INITIAL_SAVE,
          ...parsed,
          cars: {
            ...INITIAL_SAVE.cars,
            ...parsed.cars,
          },
          settings: {
            ...INITIAL_SAVE.settings,
            ...(parsed.settings || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Erro ao carregar save game, usando padrões:', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_SAVE));
  }

  public saveGame(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
  }

  public getData(): PlayerSaveData {
    return this.data;
  }

  public updateData(updater: (prev: PlayerSaveData) => PlayerSaveData): void {
    this.data = updater(this.data);
    this.saveGame();
  }

  public addCash(amount: number): number {
    this.data.cash = Math.max(0, this.data.cash + amount);
    this.saveGame();
    return this.data.cash;
  }

  public recordScore(score: number, trackId: string): { isNewRecord: boolean; cashEarned: number } {
    let isNewRecord = false;
    if (score > (this.data.trackRecords[trackId] || 0)) {
      this.data.trackRecords[trackId] = score;
      isNewRecord = true;
    }
    if (score > this.data.bestScore) {
      this.data.bestScore = score;
    }

    this.data.totalScore += score;
    // Calculate level based on total score
    this.data.level = Math.max(1, Math.floor(Math.sqrt(this.data.totalScore / 5000)) + 1);

    // Calculate cash earned based on drift score
    // Minimum 100, up to thousands
    let cashEarned = 0;
    if (score > 0) {
      if (score < 5000) {
        cashEarned = Math.round(500 + score * 0.15);
      } else if (score < 20000) {
        cashEarned = Math.round(1250 + (score - 5000) * 0.2);
      } else {
        cashEarned = Math.round(4250 + (score - 20000) * 0.25);
      }
      if (isNewRecord) {
        cashEarned += 1000; // Bonus for personal best
      }
      this.addCash(cashEarned);
    }

    this.saveGame();
    return { isNewRecord, cashEarned };
  }

  public resetGame(): void {
    this.data = JSON.parse(JSON.stringify(INITIAL_SAVE));
    this.saveGame();
  }
}
