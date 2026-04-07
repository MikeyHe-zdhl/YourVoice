'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  FileText, 
  Music, 
  Video, 
  Sparkles, 
  Loader2, 
  Download, 
  CheckCircle2, 
  Layers, 
  Mic2, 
  Volume2, 
  Plus,
  Settings2
} from 'lucide-react';
import type { FFmpeg as FFmpegType } from '@ffmpeg/ffmpeg';

type ProcessingMode = 'dubbing' | 'vlog';

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<ProcessingMode>('dubbing');
  
  // Form States
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [bgmFiles, setBgmFiles] = useState<File[]>([]);
  const [bgmVolume, setBgmVolume] = useState(30);
  const [syncOffset, setSyncOffset] = useState(0);
  
  const [outputVideo, setOutputVideo] = useState<string | null>(null);
  const [vttUrl, setVttUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const ffmpegRef = useRef<FFmpegType | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initFFmpeg();
  }, []);

  const initFFmpeg = async () => {
    try {
      setStatus('正在加载视频处理引擎...');
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      
      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });

      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      setLoaded(true);
      setStatus('引擎准备就绪');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      setStatus('引擎加载失败，请刷新页面重试');
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      setOutputVideo(null); 
      setVttUrl(null);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleSubtitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSubtitleFile(e.target.files[0]);
    }
  };

  const handleBgmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBgmFiles([e.target.files[0]]);
    }
  };

  const processVideo = async () => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg || !loaded) {
      alert('引擎尚未就绪，请稍后');
      return;
    }

    if (!videoFile) {
      alert('请上传视频文件');
      return;
    }

    if (mode === 'dubbing' && !audioFile) {
      alert('请上传配音文件');
      return;
    }

    const { fetchFile } = await import('@ffmpeg/util');
    setProcessing(true);
    setProgress(0);
    setStatus('正在读取素材文件...');

    try {
      await ffmpeg.writeFile('input_video.mp4', await fetchFile(videoFile));
      
      if (mode === 'dubbing') {
        // --- DUBBING MODE ---
        await ffmpeg.writeFile('input_audio.mp3', await fetchFile(audioFile!));
        
        let ffmpegArgs = [
          '-i', 'input_video.mp4',
          '-i', 'input_audio.mp3'
        ];

        if (subtitleFile) {
          await ffmpeg.writeFile('input_sub.srt', await fetchFile(subtitleFile));
          
          // Task A: Generate VTT for web preview
          setStatus('正在生成预览字幕 (VTT)...');
          await ffmpeg.exec(['-i', 'input_sub.srt', 'preview.vtt']);
          const vttData = await ffmpeg.readFile('preview.vtt');
          const vttBlobUrl = URL.createObjectURL(new Blob([(vttData as any).buffer], { type: 'text/vtt' }));
          setVttUrl(vttBlobUrl);

          // Task B: Synthesis with subtitle stream
          setStatus('正在合成视频、配音与字幕...');
          ffmpegArgs.push('-i', 'input_sub.srt');
          ffmpegArgs.push(
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-c:s', 'mov_text',
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-map', '2:s:0',
            '-shortest',
            'output.mp4'
          );
        } else {
          setStatus('正在合成视频与配音...');
          ffmpegArgs.push(
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-shortest',
            'output.mp4'
          );
        }
        await ffmpeg.exec(ffmpegArgs);

      } else {
        // --- VLOG MODE ---
        if (bgmFiles[0]) {
          await ffmpeg.writeFile('input_bgm.mp3', await fetchFile(bgmFiles[0]));
          setStatus('正在混合音轨中...');
          const volumeValue = (bgmVolume / 100).toFixed(2);
          await ffmpeg.exec([
            '-i', 'input_video.mp4',
            '-i', 'input_bgm.mp3',
            '-filter_complex', `[1:a]volume=${volumeValue}[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[a]`,
            '-map', '0:v',
            '-map', '[a]',
            '-c:v', 'copy',
            '-c:a', 'aac',
            'output.mp4'
          ]);
        }
      }

      setStatus('读取合成后的文件...');
      const data = await ffmpeg.readFile('output.mp4');
      const url = URL.createObjectURL(new Blob([(data as any).buffer], { type: 'video/mp4' }));
      setOutputVideo(url);
      setStatus('合成完成！');
    } catch (error) {
      console.error('FFmpeg processing error:', error);
      alert('处理过程中发生错误，请查看控制台。');
      setStatus('处理出错');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-blue-100">
      <nav className="border-b border-gray-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1d1d1f] rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">YourVoice</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${loaded ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {loaded ? 'Engine Active' : 'Initializing...'}
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-black to-gray-500 bg-clip-text text-transparent">
            YourVoice
          </h1>
          <p className="text-lg text-gray-500 font-light tracking-wide">
            让每一个视频都拥有属于您的完美声音。
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gray-200/50 p-1 rounded-2xl flex relative overflow-hidden backdrop-blur-sm">
              <div 
                className={`absolute inset-y-1 transition-all duration-300 ease-out bg-white rounded-xl shadow-sm w-[calc(50%-4px)]
                  ${mode === 'dubbing' ? 'translate-x-0' : 'translate-x-full'}`}
              ></div>
              <button onClick={() => setMode('dubbing')} className={`relative flex-1 py-2.5 text-sm font-semibold transition-colors duration-200 z-10 flex items-center justify-center gap-2 ${mode === 'dubbing' ? 'text-black' : 'text-gray-500 hover:text-gray-700'}`}>
                <Mic2 className="w-4 h-4" /> 企业宣传 (配音)
              </button>
              <button onClick={() => setMode('vlog')} className={`relative flex-1 py-2.5 text-sm font-semibold transition-colors duration-200 z-10 flex items-center justify-center gap-2 ${mode === 'vlog' ? 'text-black' : 'text-gray-500 hover:text-gray-700'}`}>
                <Layers className="w-4 h-4" /> 个人 Vlog (BGM)
              </button>
            </div>

            <section className="bg-white rounded-[2rem] p-8 shadow-xl shadow-black/5 border border-gray-100 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {mode === 'dubbing' ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider ml-1">📹 上传无声/待处理视频</label>
                    <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all hover:border-blue-400 hover:bg-blue-50/20 group ${videoFile ? 'border-blue-200 bg-blue-50/10' : 'border-gray-100'}`}>
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="video/mp4" onChange={handleVideoChange} />
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${videoFile ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-blue-500'}`}>
                          <Video className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{videoFile ? videoFile.name : '选择 MP4 视频'}</p>
                          <p className="text-xs text-gray-400">点击或拖拽上传</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider ml-1">🎵 上传独立配音文件</label>
                    <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all hover:border-blue-400 hover:bg-blue-50/20 group ${audioFile ? 'border-blue-200 bg-blue-50/10' : 'border-gray-100'}`}>
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="audio/*" onChange={handleAudioChange} />
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${audioFile ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-blue-500'}`}>
                          <Music className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{audioFile ? audioFile.name : '选择音频文件'}</p>
                          <p className="text-xs text-gray-400">支持 MP3 / WAV</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">📝 上传字幕文件</label>
                      {subtitleFile && <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-md uppercase">已就绪</span>}
                    </div>
                    <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all hover:border-blue-400 hover:bg-blue-50/20 group ${subtitleFile ? 'border-blue-200 bg-blue-50/10' : 'border-gray-100'}`}>
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".srt" onChange={handleSubtitleChange} />
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${subtitleFile ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-blue-500'}`}>
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{subtitleFile ? subtitleFile.name : '点击上传 SRT 字幕 (可选)'}</p>
                          <p className="text-xs text-gray-400">支持自动封装进 MP4</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Settings2 className="w-4 h-4 text-gray-400" /> 音画同步偏移
                      </div>
                      <span className="text-xs font-mono text-blue-500">{syncOffset}ms</span>
                    </div>
                    <input type="range" min="-1000" max="1000" step="10" value={syncOffset} onChange={(e) => setSyncOffset(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider ml-1">📹 上传 Vlog 原片 (含原声)</label>
                    <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all hover:border-blue-400 hover:bg-blue-50/20 group ${videoFile ? 'border-blue-200 bg-blue-50/10' : 'border-gray-100'}`}>
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="video/mp4" onChange={handleVideoChange} />
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${videoFile ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-blue-500'}`}>
                          <Video className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{videoFile ? videoFile.name : '选择 Vlog 原片'}</p>
                          <p className="text-xs text-gray-400">保留现场环境音</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider ml-1">🎵 上传 BGM 背景音乐</label>
                    <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all hover:border-blue-400 hover:bg-blue-50/20 group ${bgmFiles.length > 0 ? 'border-blue-200 bg-blue-50/10' : 'border-gray-100'}`}>
                      <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="audio/*" onChange={handleBgmChange} />
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${bgmFiles.length > 0 ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-blue-500'}`}>
                          <Plus className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{bgmFiles.length > 0 ? bgmFiles[0].name : '选择背景音乐'}</p>
                          <p className="text-xs text-gray-400">自动无缝混合</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Volume2 className="w-4 h-4 text-gray-400" /> BGM 音量调节
                      </div>
                      <span className="text-xs font-mono text-blue-500">{bgmVolume}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={bgmVolume} onChange={(e) => setBgmVolume(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4">
                <button onClick={processVideo} disabled={!loaded || !videoFile || processing} className={`w-full h-16 rounded-[1.25rem] font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-2xl group ${processing || !loaded || !videoFile ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none' : 'bg-[#1d1d1f] text-white hover:bg-black shadow-black/20 hover:shadow-blue-500/10'}`}>
                  {processing ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12 text-blue-400" />}
                  {processing ? '正在合成影片中...' : `生成 YourVoice 视频`}
                </button>
                {(processing || status) && (
                  <div className="px-2">
                    <div className="flex justify-between text-[11px] font-medium text-gray-400 mb-2">
                      <span className="flex items-center gap-2">{processing && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />}{status}</span>
                      {processing && <span className="text-blue-500">{progress}%</span>}
                    </div>
                    {processing && <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} /></div>}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7">
            <div className="sticky top-24 space-y-8">
              <div className="bg-black rounded-[3rem] aspect-video w-full flex flex-col items-center justify-center border-[12px] border-[#1d1d1f] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                {outputVideo ? (
                  <video ref={videoRef} src={outputVideo} controls className="w-full h-full object-contain" autoPlay>
                    {vttUrl && <track kind="subtitles" src={vttUrl} srcLang="zh" label="中文" default />}
                  </video>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#2d2d2f,black)] opacity-60"></div>
                    <div className="z-10 flex flex-col items-center gap-5">
                      <div className="w-20 h-20 bg-white/5 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/10 shadow-2xl transition-all group-hover:scale-110 group-hover:bg-white/10 group-hover:border-white/20">
                        <Play className="w-8 h-8 text-white fill-white ml-1.5" />
                      </div>
                      <span className="text-white/20 font-medium tracking-[0.2em] uppercase text-[10px]">{status || 'Preview Ready'}</span>
                    </div>
                  </>
                )}
              </div>
              
              {outputVideo ? (
                <div className="flex gap-4 animate-in slide-in-from-top-4 duration-500">
                  <a href={outputVideo} download="yourvoice_creation.mp4" className="flex-[2] h-16 bg-blue-600 text-white rounded-[1.25rem] flex items-center justify-center gap-3 font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"><Download className="w-5 h-5" /> 下载成品视频</a>
                  <button onClick={() => { setOutputVideo(null); setVideoFile(null); setAudioFile(null); setSubtitleFile(null); setBgmFiles([]); setVttUrl(null); setStatus('引擎准备就绪'); }} className="flex-1 h-16 bg-white border border-gray-200 rounded-[1.25rem] font-bold hover:bg-gray-50 transition-all active:scale-95">重置</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mb-3" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">字幕封装</h3>
                    <p className="text-[13px] text-gray-600 leading-relaxed">支持 SRT 字幕自动封装进 MP4，并实时生成网页 VTT 轨道进行预览。</p>
                  </div>
                  <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Sparkles className="w-5 h-5 text-orange-400 mb-3" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">智能处理</h3>
                    <p className="text-[13px] text-gray-600 leading-relaxed">YourVoice 引擎会自动优化音视频与字幕的同步对齐效果。</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-32 py-16 border-t border-gray-200/60 bg-white/50 backdrop-blur-sm text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[13px] text-gray-400 font-medium tracking-wide italic">"Your Voice, Your Story, Your World."</p>
          <p className="mt-4 text-[11px] text-gray-300 font-bold uppercase tracking-[0.3em]">© 2026 YourVoice AI Localization Lab.</p>
        </div>
      </footer>
    </main>
  );
}
