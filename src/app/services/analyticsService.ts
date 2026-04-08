export interface ProcessingRecord {
  id: string;
  timestamp: string;
  mode: 'dubbing' | 'vlog';
  videoSize: number;
  duration: number;
  processingTime: number;
  success: boolean;
  errorMessage?: string;
  features: {
    hasSubtitle: boolean;
    hasBGM: boolean;
    aiSubtitleGenerated: boolean;
  };
}

const STORAGE_KEY = 'yourvoice_analytics';

export class AnalyticsService {
  static recordProcessing(record: Omit<ProcessingRecord, 'id' | 'timestamp'>) {
    if (typeof window === 'undefined') {
      return;
    }

    const fullRecord: ProcessingRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };

    const history = this.getHistory();
    history.push(fullRecord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-100)));
  }

  static getHistory(): ProcessingRecord[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ProcessingRecord[]) : [];
    } catch {
      return [];
    }
  }

  static getStats() {
    const history = this.getHistory();
    const successful = history.filter((record) => record.success);
    const failures = history.filter((record) => !record.success);

    const totalProcessed = history.length;
    const successRate = totalProcessed
      ? Math.round((successful.length / totalProcessed) * 100)
      : 0;
    const avgProcessingTime = successful.length
      ? Math.round(
          successful.reduce((sum, record) => sum + record.processingTime, 0) /
            successful.length
        )
      : 0;
    const avgVideoSize = history.length
      ? Math.round(
          history.reduce((sum, record) => sum + record.videoSize, 0) / history.length
        )
      : 0;

    return {
      totalProcessed,
      successRate,
      avgProcessingTime,
      avgVideoSize,
      modeDistribution: {
        dubbing: history.filter((record) => record.mode === 'dubbing').length,
        vlog: history.filter((record) => record.mode === 'vlog').length,
      },
      aiSubtitleUsage: history.filter((record) => record.features.aiSubtitleGenerated).length,
      recentFailures: failures.slice(-5).reverse(),
    };
  }
}
