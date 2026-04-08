'use client';

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Clock3, TrendingUp, HardDrive } from 'lucide-react';
import { AnalyticsService } from '../services/analyticsService';

interface AnalyticsDashboardProps {
  refreshKey: number;
}

export default function AnalyticsDashboard({ refreshKey }: AnalyticsDashboardProps) {
  void refreshKey;
  const stats = AnalyticsService.getStats();

  return (
    <section className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-xl shadow-black/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-500">
            Processing Analytics
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#1d1d1f]">
            性能监控看板
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            本地记录最近 100 次处理结果，用来观察成功率、耗时和 AI 字幕使用情况。
          </p>
        </div>
        <TrendingUp className="h-6 w-6 text-emerald-500" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          label="处理成功率"
          value={`${stats.successRate}%`}
          accent="from-green-50 to-emerald-50"
        />
        <MetricCard
          icon={<Clock3 className="h-4 w-4 text-blue-600" />}
          label="平均耗时"
          value={`${stats.avgProcessingTime}s`}
          accent="from-blue-50 to-cyan-50"
        />
        <MetricCard
          icon={<HardDrive className="h-4 w-4 text-orange-600" />}
          label="平均文件体积"
          value={`${stats.avgVideoSize}MB`}
          accent="from-orange-50 to-amber-50"
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4 text-violet-600" />}
          label="AI 字幕使用"
          value={`${stats.aiSubtitleUsage} 次`}
          accent="from-violet-50 to-fuchsia-50"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-gray-100 bg-[#fafafa] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            模式使用分布
          </p>
          <div className="mt-4 flex gap-3">
            <DistributionBar
              label={`配音 ${stats.modeDistribution.dubbing}`}
              count={stats.modeDistribution.dubbing}
              color="bg-blue-600"
            />
            <DistributionBar
              label={`Vlog ${stats.modeDistribution.vlog}`}
              count={stats.modeDistribution.vlog}
              color="bg-orange-500"
            />
          </div>
          <p className="mt-4 text-sm text-gray-500">
            总处理次数 <span className="font-semibold text-[#1d1d1f]">{stats.totalProcessed}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-[#fafafa] p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            <AlertCircle className="h-4 w-4" />
            最近失败记录
          </p>
          <div className="mt-4 space-y-3">
            {stats.recentFailures.length > 0 ? (
              stats.recentFailures.map((failure) => (
                <div key={failure.id} className="rounded-xl bg-white p-3 text-sm text-gray-600">
                  <p className="font-medium text-[#1d1d1f]">
                    {failure.mode === 'dubbing' ? '配音模式' : 'Vlog 模式'} ·{' '}
                    {Math.round(failure.processingTime)}s
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {failure.errorMessage ?? '未知错误'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">还没有失败记录，继续保持。</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${accent} p-4`}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-semibold text-gray-500">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-[#1d1d1f]">{value}</p>
    </div>
  );
}

function DistributionBar({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  const minWidthClass = count > 0 ? 'min-w-[6rem]' : 'min-w-[4rem]';

  return (
    <div
      className={`flex h-10 flex-1 items-center justify-center rounded-xl ${color} ${minWidthClass} px-4 text-xs font-bold text-white`}
    >
      {label}
    </div>
  );
}
