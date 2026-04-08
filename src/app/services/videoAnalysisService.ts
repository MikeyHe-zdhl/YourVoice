export interface VideoAnalysis {
  tags: string[];
  titleSuggestions: string[];
  bgmRecommendation: string;
  summary: string;
}

export class VideoAnalysisService {
  static async analyzeVideo(videoFile: File): Promise<VideoAnalysis> {
    const fileName = videoFile.name.toLowerCase();
    const tags: string[] = [];

    if (matches(fileName, ['travel', 'trip', 'journey', '旅行'])) {
      tags.push('旅行');
    }
    if (matches(fileName, ['food', 'cooking', 'recipe', '美食'])) {
      tags.push('美食');
    }
    if (matches(fileName, ['tech', 'ai', 'product', '科技'])) {
      tags.push('科技');
    }
    if (matches(fileName, ['citywalk', 'daily', 'life', 'vlog', '生活'])) {
      tags.push('Vlog');
    }

    if (tags.length === 0) {
      tags.push('生活', '记录');
    }

    const primaryTag = tags[0];
    const today = new Intl.DateTimeFormat('zh-CN').format(new Date());

    return {
      tags,
      titleSuggestions: [
        `${primaryTag}日记 | ${today}`,
        `我的${primaryTag}故事`,
        `${primaryTag}分享 | YourVoice Vlog`,
      ],
      bgmRecommendation: recommendBgm(tags),
      summary: `这是一段偏向 ${tags.join(' / ')} 的视频内容，适合搭配更聚焦主题氛围的字幕和配乐包装。`,
    };
  }
}

function matches(fileName: string, keywords: string[]): boolean {
  return keywords.some((keyword) => fileName.includes(keyword));
}

function recommendBgm(tags: string[]): string {
  if (tags.includes('旅行')) {
    return '轻快清透';
  }
  if (tags.includes('美食')) {
    return '温暖治愈';
  }
  if (tags.includes('科技')) {
    return '电子感 / 节奏感';
  }
  return '舒缓日常';
}
