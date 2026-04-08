'use client';

import { useMemo, useState } from 'react';
import { Check, Edit2, FileDown, X } from 'lucide-react';
import { SubtitleService, type SubtitleSegment } from '../services/subtitleService';

interface SubtitleEditorProps {
  segments: SubtitleSegment[];
  onUpdate: (segments: SubtitleSegment[]) => void;
  onApply: () => void;
}

export default function SubtitleEditor({
  segments,
  onUpdate,
  onApply,
}: SubtitleEditorProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const statsLabel = useMemo(() => `${segments.length} 条字幕`, [segments.length]);

  const startEdit = (segment: SubtitleSegment) => {
    setEditingId(segment.id);
    setEditText(segment.text);
  };

  const saveEdit = () => {
    if (editingId === null) {
      return;
    }

    const updated = segments.map((segment) =>
      segment.id === editingId ? { ...segment, text: editText.trim() } : segment
    );
    onUpdate(updated);
    setEditingId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const downloadSrt = () => {
    const srtContent = SubtitleService.convertToSRT(segments);
    const url = URL.createObjectURL(new Blob([srtContent], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'yourvoice-ai-subtitles.srt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="bg-white rounded-[2rem] p-8 shadow-xl shadow-black/5 border border-gray-100 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-500">
            AI Subtitle Studio
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#1d1d1f]">
            智能字幕编辑器
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            已生成 {statsLabel}，可以先校对文本，再一键应用到视频合成流程。
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadSrt}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <FileDown className="h-4 w-4" />
            导出 SRT
          </button>
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Check className="h-4 w-4" />
            应用到视频
          </button>
        </div>
      </div>

      <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-2">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className="rounded-2xl border border-gray-100 bg-[#fafafa] p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-xs font-medium text-gray-400">
                  {formatEditorTime(segment.start)} - {formatEditorTime(segment.end)}
                </p>

                {editingId === segment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(event) => setEditText(event.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-blue-200 bg-white p-3 text-sm text-gray-800 outline-none ring-0 transition focus:border-blue-400"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-300"
                      >
                        <X className="h-3.5 w-3.5" />
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-gray-700">{segment.text}</p>
                )}
              </div>

              {editingId !== segment.id && (
                <button
                  type="button"
                  onClick={() => startEdit(segment)}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-white hover:text-blue-600"
                  aria-label={`编辑第 ${segment.id} 条字幕`}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatEditorTime(seconds: number): string {
  const total = Math.max(seconds, 0);
  const mins = Math.floor(total / 60);
  const secs = Math.floor(total % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
