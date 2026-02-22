export interface GameStats {
  totalQuestions: number;
  recentAnswers: boolean[]; // 直近100問の正誤記録
  maxConsecutiveCorrect: number;
  currentConsecutiveCorrect: number;
  bestAccuracy: number; // 100問の正答率の最高記録
  totalCorrect: number;
  averageScore: number;
}

export interface GameSettings {
  answerTime: number;
  targetConsecutive: number;
}

export interface GameStatsMap {
  [key: string]: GameStats;
}

export const MAX_RECENT_ANSWERS = 100;

export const initializeStats = (): GameStats => ({
  totalQuestions: 0,
  recentAnswers: [],
  maxConsecutiveCorrect: 0,
  currentConsecutiveCorrect: 0,
  bestAccuracy: 0,
  totalCorrect: 0,
  averageScore: 0,
});

// 設定の組み合わせからキーを生成
export const generateSettingsKey = (settings: GameSettings): string => {
  return `${settings.answerTime}-${settings.targetConsecutive}`;
};

export const updateStats = (stats: GameStats, isCorrect: boolean): GameStats => {
  const newRecentAnswers = [...stats.recentAnswers, isCorrect];

  // 直近100問のみ保持
  if (newRecentAnswers.length > MAX_RECENT_ANSWERS) {
    newRecentAnswers.shift();
  }

  const newCurrentConsecutiveCorrect = isCorrect ? stats.currentConsecutiveCorrect + 1 : 0;

  const newMaxConsecutiveCorrect = Math.max(stats.maxConsecutiveCorrect, newCurrentConsecutiveCorrect);

  // 100問の正答率を計算（空の配列の場合は0%）
  const currentAccuracy = calculateAccuracy({ ...stats, recentAnswers: newRecentAnswers });
  const newBestAccuracy = Math.max(stats.bestAccuracy, currentAccuracy);

  const newTotalCorrect = stats.totalCorrect + (isCorrect ? 1 : 0);
  const newTotalQuestions = stats.totalQuestions + 1;
  const newAverageScore = Math.round((newTotalCorrect / newTotalQuestions) * 100);

  return {
    totalQuestions: newTotalQuestions,
    recentAnswers: newRecentAnswers,
    maxConsecutiveCorrect: newMaxConsecutiveCorrect,
    currentConsecutiveCorrect: newCurrentConsecutiveCorrect,
    bestAccuracy: newBestAccuracy,
    totalCorrect: newTotalCorrect,
    averageScore: newAverageScore,
  };
};

export const calculateAccuracy = (stats: GameStats): number => {
  if (stats.recentAnswers.length === 0) return 0;

  const correctCount = stats.recentAnswers.filter((answer) => answer).length;
  return Math.round((correctCount / stats.recentAnswers.length) * 100);
};

export const getStatsFromStorage = (): GameStatsMap => {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem("engGameStatsMap");
    if (stored) {
      const statsMap = JSON.parse(stored);

      // 古いデータ形式を新しい形式に移行
      Object.keys(statsMap).forEach((key) => {
        if (!statsMap[key].hasOwnProperty("bestAccuracy")) {
          statsMap[key].bestAccuracy = 0;
        }
        if (!statsMap[key].hasOwnProperty("totalCorrect")) {
          statsMap[key].totalCorrect = 0;
        }
        if (!statsMap[key].hasOwnProperty("averageScore")) {
          statsMap[key].averageScore = 0;
        }
      });

      return statsMap;
    }
  } catch (error) {
    console.error("Failed to load game stats:", error);
  }

  return {};
};

export const saveStatsToStorage = (statsMap: GameStatsMap): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("engGameStatsMap", JSON.stringify(statsMap));
  } catch (error) {
    console.error("Failed to save game stats:", error);
  }
};

// 特定の設定での統計情報を取得（存在しない場合は初期化）
export const getStatsForSettings = (statsMap: GameStatsMap, settings: GameSettings): GameStats => {
  const key = generateSettingsKey(settings);
  return statsMap[key] || initializeStats();
};

// 特定の設定での統計情報を更新
export const updateStatsForSettings = (statsMap: GameStatsMap, settings: GameSettings, isCorrect: boolean): GameStatsMap => {
  const key = generateSettingsKey(settings);
  const currentStats = statsMap[key] || initializeStats();
  const updatedStats = updateStats(currentStats, isCorrect);

  return {
    ...statsMap,
    [key]: updatedStats,
  };
};

// PWA用の統計管理クラス
export class PWAStatsManager {
  private db: IDBDatabase | null = null;
  private readonly dbName = "EngGameStatsDB";
  private readonly storeName = "stats";
  private readonly version = 1;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error("Failed to open stats IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          store.createIndex("lastUpdated", "lastUpdated", { unique: false });
        }
      };
    });
  }

  async saveStats(statsMap: GameStatsMap): Promise<void> {
    if (!this.db) {
      throw new Error("Stats database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const data = {
        id: "current",
        statsMap,
        lastUpdated: new Date().toISOString(),
        version: "1.0.0",
      };

      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error("Failed to save stats:", request.error);
        reject(request.error);
      };
    });
  }

  async loadStats(): Promise<GameStatsMap> {
    if (!this.db) {
      throw new Error("Stats database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get("current");

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.statsMap);
        } else {
          resolve({});
        }
      };

      request.onerror = () => {
        console.error("Failed to load stats:", request.error);
        reject(request.error);
      };
    });
  }
}

// 統合統計管理クラス
export class UnifiedStatsManager {
  private pwaManager: PWAStatsManager | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    // PWA環境かチェック
    const isPWA = window.matchMedia("(display-mode: standalone)").matches;
    const hasServiceWorker = "serviceWorker" in navigator;
    const hasIndexedDB = "indexedDB" in window;

    if (isPWA && hasServiceWorker && hasIndexedDB) {
      this.pwaManager = new PWAStatsManager();
      await this.pwaManager.init();
    }

    this.initialized = true;
  }

  async saveStats(statsMap: GameStatsMap): Promise<void> {
    await this.init();

    if (this.pwaManager) {
      // PWA: IndexedDB
      await this.pwaManager.saveStats(statsMap);
    } else {
      // Web: ローカルストレージ
      saveStatsToStorage(statsMap);
    }
  }

  async loadStats(): Promise<GameStatsMap> {
    await this.init();

    if (this.pwaManager) {
      // PWA: IndexedDB
      return await this.pwaManager.loadStats();
    } else {
      // Web: ローカルストレージ
      return getStatsFromStorage();
    }
  }
}

// シングルトンインスタンス
let unifiedStatsManager: UnifiedStatsManager | null = null;

export const getUnifiedStatsManager = (): UnifiedStatsManager => {
  if (!unifiedStatsManager) {
    unifiedStatsManager = new UnifiedStatsManager();
  }
  return unifiedStatsManager;
};

// 便利な関数
export const saveStats = async (statsMap: GameStatsMap): Promise<void> => {
  const manager = getUnifiedStatsManager();
  await manager.saveStats(statsMap);
};

export const loadStats = async (): Promise<GameStatsMap> => {
  const manager = getUnifiedStatsManager();
  return await manager.loadStats();
};