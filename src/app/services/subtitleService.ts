import OpenAI from 'openai';
import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

const client = apiKey
  ? new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    })
  : null;

export interface SubtitleSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface WhisperSegment {
  start?: number;
  end?: number;
  text?: string;
}

interface WhisperVerboseResponse {
  segments?: WhisperSegment[];
  text?: string;
}

export class SubtitleService {
  static async extractAudio(videoFile: File, ffmpeg: FFmpeg): Promise<Blob> {
    await ffmpeg.writeFile('subtitle_input_video.mp4', await fetchFile(videoFile));
    await ffmpeg.exec([
      '-i',
      'subtitle_input_video.mp4',
      '-vn',
      '-acodec',
      'libmp3lame',
      '-q:a',
      '2',
      'subtitle_audio.mp3',
    ]);

    const data = await ffmpeg.readFile('subtitle_audio.mp3');
    return new Blob([toBlobPart(data)], { type: 'audio/mpeg' });
  }

  static async generateSubtitles(
    audioBlob: Blob,
    language: 'zh' | 'en' | 'ja' = 'zh'
  ): Promise<SubtitleSegment[]> {
    if (!client) {
      throw new Error('缺少 OpenAI API Key，请先配置 NEXT_PUBLIC_OPENAI_API_KEY');
    }

    try {
      const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' });
      const response = (await client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language,
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      })) as WhisperVerboseResponse;

      if (response.segments?.length) {
        return response.segments.map((segment, index) => ({
          id: index + 1,
          start: segment.start ?? 0,
          end: segment.end ?? segment.start ?? 0,
          text: (segment.text ?? '').trim(),
        }));
      }

      const fallbackText = (response.text ?? '').trim();
      if (!fallbackText) {
        return [];
      }

      return [
        {
          id: 1,
          start: 0,
          end: 5,
          text: fallbackText,
        },
      ];
    } catch (error) {
      console.error('字幕生成失败:', error);
      throw new Error('AI 字幕生成失败，请检查 API 配置和音频内容');
    }
  }

  static convertToSRT(segments: SubtitleSegment[]): string {
    return segments
      .map((segment, index) => {
        const startTime = this.formatSrtTime(segment.start);
        const endTime = this.formatSrtTime(segment.end);
        return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
      })
      .join('\n');
  }

  static convertToVTT(segments: SubtitleSegment[]): string {
    const content = segments
      .map((segment, index) => {
        const startTime = this.formatVttTime(segment.start);
        const endTime = this.formatVttTime(segment.end);
        return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
      })
      .join('\n');

    return `WEBVTT\n\n${content}`;
  }

  private static formatSrtTime(seconds: number): string {
    return this.formatTime(seconds, ',');
  }

  private static formatVttTime(seconds: number): string {
    return this.formatTime(seconds, '.');
  }

  private static formatTime(seconds: number, separator: ',' | '.'): string {
    const normalized = Math.max(seconds, 0);
    const hours = Math.floor(normalized / 3600);
    const minutes = Math.floor((normalized % 3600) / 60);
    const secs = Math.floor(normalized % 60);
    const ms = Math.floor((normalized % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}${separator}${String(ms).padStart(3, '0')}`;
  }
}

function toBlobPart(data: Uint8Array | string): ArrayBuffer {
  const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
