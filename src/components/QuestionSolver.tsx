import React, { useState, useRef, useEffect } from 'react';
import { EducationalStage, SolutionData, SubjectId } from '../types';
import { STAGES, CURRICULA, SUBJECTS, SAMPLE_QUESTIONS } from '../data/curricula';
import { MathRenderer } from './MathRenderer';
import { compressImage } from '../utils/imageCompressor';
import { apiRequest } from '../utils/apiClient';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Volume2,
  VolumeX,
  Share2,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  HelpCircle,
  Award,
  Layers,
  ArrowRight,
  X,
  Loader2,
  Copy,
  Printer
} from 'lucide-react';

interface QuestionSolverProps {
  selectedStage: EducationalStage;
  setSelectedStage: (s: EducationalStage) => void;
  selectedCurriculum: string;
  setSelectedCurriculum: (c: string) => void;
  language: 'ar' | 'en' | 'fr';
  onSaveSolution: (solution: SolutionData) => void;
  savedSolutions: SolutionData[];
  initialSolution?: SolutionData | null;
}

export const QuestionSolver: React.FC<QuestionSolverProps> = ({
  selectedStage,
  setSelectedStage,
  selectedCurriculum,
  setSelectedCurriculum,
  language,
  onSaveSolution,
  savedSolutions,
  initialSolution,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('math');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState<SolutionData | null>(initialSolution || null);
  const [error, setError] = useState<string | null>(null);
  const [validationNotice, setValidationNotice] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<number>(1);

  // Clear validation guidance when user types or selects a photo
  useEffect(() => {
    if (prompt.trim() || imageBase64) {
      setValidationNotice(null);
      setError(null);
    }
  }, [prompt, imageBase64]);

  // Progressive loading stage ticker (prevents perception of freeze or timeout)
  useEffect(() => {
    if (!loading) {
      setLoadingStage(1);
      return;
    }
    const timer = setInterval(() => {
      setLoadingStage((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(timer);
  }, [loading]);

  // Stepper state for self-learning mode
  const [visibleStepsCount, setVisibleStepsCount] = useState<number>(1);
  const [revealedAllSteps, setRevealedAllSteps] = useState(false);

  // Interactive practice clone question state
  const [selectedPracticeOption, setSelectedPracticeOption] = useState<number | null>(null);
  const [isPracticeSubmitted, setIsPracticeSubmitted] = useState(false);
  const [showPracticeHint, setShowPracticeHint] = useState(false);

  // Audio voice explanation state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Camera video ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Listen to initialSolution changes
  useEffect(() => {
    if (initialSolution) {
      setSolution(initialSolution);
      setVisibleStepsCount(initialSolution.steps.length);
      setRevealedAllSteps(true);
    }
  }, [initialSolution]);

  // Listen to drawing from scratchpad
  useEffect(() => {
    const handleDrawingEvent = (e: any) => {
      if (e.detail?.dataUrl) {
        setImageBase64(e.detail.dataUrl);
        setPrompt('حل هذه المسألة الهندسية/الرياضية المرسومة باليد بدقة تامة مع استخراج المعطيات والخطوات.');
      }
    };
    window.addEventListener('nebras_load_drawing', handleDrawingEvent);
    return () => window.removeEventListener('nebras_load_drawing', handleDrawingEvent);
  }, []);

  // Clipboard paste support for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            compressImage(blob, 1280, 0.8)
              .then((res) => setImageBase64(res.dataUrl))
              .catch(() => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  setImageBase64(event.target?.result as string);
                };
                reader.readAsDataURL(blob);
              });
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Handle live camera toggle
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera stream error, fallback to native file capture:', err);
      setIsCameraActive(false);
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setImageBase64(dataUrl);
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const removeImage = () => {
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1024, 0.85);
        setImageBase64(compressed.dataUrl);
      } catch {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImageBase64(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Submit question
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() && !imageBase64) {
      setValidationNotice('يرجى كتابة مسألة أو إرفاق صورة أولاً للبدء في الحل والشرح بالخطوات.');
      setError(null);
      return;
    }

    setValidationNotice(null);
    setLoading(true);
    setLoadingStage(1);
    setError(null);
    setSolution(null);
    setSelectedPracticeOption(null);
    setIsPracticeSubmitted(false);
    setShowPracticeHint(false);

    try {
      const stageName = STAGES.find((s) => s.id === selectedStage)?.name || selectedStage;
      const curriculumName = CURRICULA.find((c) => c.id === selectedCurriculum)?.name || selectedCurriculum;
      const subjectName = SUBJECTS.find((sub) => sub.id === selectedSubject)?.name || selectedSubject;

      const { data } = await apiRequest('/api/solve-question', {
        method: 'POST',
        timeoutMs: 120000,
        retries: 2,
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageBase64: imageBase64,
          stage: stageName,
          curriculum: curriculumName,
          subject: subjectName,
          language,
        }),
      });

      if (!data.success) {
        throw new Error(data.error || 'فشل في حل المسألة');
      }

      const fullSolution: SolutionData = {
        ...data.solution,
        id: 'sol-' + Date.now(),
        timestamp: Date.now(),
        userImage: imageBase64 || undefined,
        language,
      };

      setSolution(fullSolution);
      setVisibleStepsCount(1);
      setRevealedAllSteps(false);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال بالنظام، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Audio voice explanation
  const handlePlayVoice = async () => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if (!solution) return;

    setAudioLoading(true);
    const textToSpeak = `الجواب النهائي لمسألة ${solution.topic}: ${solution.finalAnswer}. الخطوة الأولى: ${
      solution.steps[0]?.explanation || ''
    }. القانون المعتمد: ${solution.primaryLaws[0]?.name || ''}`;

    try {
      const res = await fetch('/api/explain-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textToSpeak }),
      });

      const data = await res.json();
      if (data.success && data.audioBase64) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0))],
          { type: 'audio/wav' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => {
          fallbackSpeechSynthesis(textToSpeak);
        };
        await audio.play();
        setIsPlayingAudio(true);
      } else {
        fallbackSpeechSynthesis(textToSpeak);
      }
    } catch {
      fallbackSpeechSynthesis(textToSpeak);
    } finally {
      setAudioLoading(false);
    }
  };

  const fallbackSpeechSynthesis = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  // Quick math symbols inserter
  const insertMathSymbol = (sym: string) => {
    setPrompt((prev) => prev + sym);
  };

  const isSaved = solution ? savedSolutions.some((s) => s.id === solution.id || s.extractedQuestion === solution.extractedQuestion) : false;

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/60 p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>محرك الاستدلال الرياضي والعلمي المتقدم</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              صوّر أي مسألة أو اطرح سؤالك.. حل فوري خطوة بخطوة بدقة 100%
            </h1>
            <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
              يدعم قراءة خط اليد والرموز المعقدة والرسوم البيانية، مع تقديم براهين قاطعة، وقوانين علمية معتمدة، ومسائل تدريبية لترسيخ الفهم الذاتي.
            </p>
          </div>

          {/* Current Stage Badge */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>المرحلة المحددة:</span>
              <strong className="text-white">
                {STAGES.find((s) => s.id === selectedStage)?.name}
              </strong>
            </div>
            <div className="text-xs text-slate-400">
              المنهج: <span className="text-cyan-300 font-medium">{CURRICULA.find((c) => c.id === selectedCurriculum)?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Solver Input Form */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-7 shadow-lg">
        {/* Subject pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 ml-2 whitespace-nowrap">المادة:</span>
          {SUBJECTS.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                selectedSubject === sub.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
              }`}
            >
              <span>{sub.icon}</span>
              <span>{sub.name}</span>
            </button>
          ))}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="اكتب مسألتك هنا، أو معادلة رياضية (مثال: أوجد مشتقة f(x) = x^3 - 5x + 2 أو حل معادلة تفاضلية أو احسب محصلة القوى...)"
              className="w-full h-32 sm:h-36 bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder-slate-500 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition resize-none leading-relaxed"
            />

            {/* Quick Math Toolbar */}
            <div className="flex flex-wrap items-center gap-1 mt-2 text-xs">
              <span className="text-slate-400 ml-1 text-[11px]">رموز رياضية سريعة:</span>
              {[
                { label: '√x', val: '\\sqrt{x}' },
                { label: 'x²', val: '^2' },
                { label: '∫ dx', val: '\\int f(x) dx' },
                { label: 'a/b', val: '\\frac{a}{b}' },
                { label: 'π', val: '\\pi' },
                { label: 'θ', val: '\\theta' },
                { label: '∑', val: '\\sum' },
                { label: 'lim', val: '\\lim_{x \\to 0}' },
                { label: '∞', val: '\\infty' },
                { label: '±', val: '\\pm' },
                { label: '≤', val: '\\le' },
                { label: '≥', val: '\\ge' },
              ].map((sym) => (
                <button
                  type="button"
                  key={sym.label}
                  onClick={() => insertMathSymbol(sym.val)}
                  className="px-2 py-1 bg-slate-800/90 hover:bg-cyan-900/60 text-slate-300 hover:text-cyan-300 rounded font-mono text-xs border border-slate-700/50 transition"
                >
                  {sym.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload / Preview / Camera row */}
          <div className="space-y-3">
            {imageBase64 && (
              <div className="relative inline-block rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-md">
                <img
                  src={imageBase64}
                  alt="السؤال المرفق"
                  className="max-h-48 max-w-full sm:max-w-md object-contain rounded-lg p-1"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-rose-600/90 hover:bg-rose-500 text-white p-1 rounded-full shadow-lg transition"
                  title="إزالة الصورة بالكامل"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[11px] text-cyan-400 border border-cyan-500/20">
                  تم إرفاق صورة المسألة
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Camera Button */}
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700/60 transition shadow-sm"
                >
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>التقاط بالكاميرا</span>
                </button>

                {/* Upload Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700/60 transition shadow-sm"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>رفع صورة / سحب وإفلات</span>
                </button>

                <span className="text-xs text-slate-400 hidden sm:inline">
                  (أو يمكنك لصق الصورة بـ Ctrl+V)
                </span>
              </div>

              {/* Submit Button with Strict Input Protection */}
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                {(!prompt.trim() && !imageBase64) && (
                  <span className="text-[11px] text-slate-400 hidden lg:inline">
                    💡 أدخل المسألة أو التقط صورة لتفعيل زر الحل
                  </span>
                )}
                <button
                  type="submit"
                  disabled={loading || (!prompt.trim() && !imageBase64)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm sm:text-base shadow-lg transition ${
                    !prompt.trim() && !imageBase64
                      ? 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60 shadow-none'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20 active:scale-95'
                  }`}
                  title={!prompt.trim() && !imageBase64 ? 'يرجى كتابة مسألة أو إرفاق صورة أولاً' : 'حل وشرح المسألة بالخطوات'}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري التحليل والاستدلال...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>حل وشرح المسألة بالخطوات</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Live Camera Modal */}
        {isCameraActive && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Camera className="w-5 h-5 text-cyan-400" />
                  <span>صوّر المسألة أو ورقة الاختبار</span>
                </h3>
                <button
                  onClick={stopCamera}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-4 border-2 border-dashed border-cyan-400/60 rounded-lg pointer-events-none flex items-center justify-center">
                  <span className="bg-slate-950/60 px-2 py-1 rounded text-cyan-300 text-xs">
                    ضع المسألة داخل هذا الإطار
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-cyan-500/20"
                >
                  التقاط الصورة الآن
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sample Questions Pills */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <p className="text-xs font-semibold text-slate-400 mb-2">أمثلة سريعة للتجربة الفورية:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map((sq, i) => (
              <button
                key={i}
                onClick={() => {
                  setPrompt(sq.question);
                  setSelectedSubject(sq.subject as SubjectId);
                  setSelectedStage(sq.stage as EducationalStage);
                  setValidationNotice(null);
                  setError(null);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/50 transition flex items-center gap-1.5"
              >
                <span>💡</span>
                <span>{sq.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Guidance Notice (Replaces harsh red box on empty submit) */}
      {validationNotice && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="text-xl">💡</span>
            <span className="font-medium">{validationNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationNotice(null)}
            className="text-amber-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 font-semibold"
          >
            حسناً
          </button>
        </div>
      )}

      {/* Progressive Multi-stage Loading Card (Eliminates perceived UI freezing) */}
      {loading && (
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base">
                  نظام نبراس يعالج المسألة الآن...
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  معالجة غير متزامنة خفيفة وسريعة بدون تجميد المتصفح
                </p>
              </div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              المرحلة {loadingStage} من 4
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 h-2.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${loadingStage * 25}%` }}
            />
          </div>

          {/* Visual Stages Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div
              className={`p-2.5 rounded-xl border text-center transition ${
                loadingStage >= 1
                  ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 font-bold shadow-sm'
                  : 'bg-slate-800/40 border-slate-800 text-slate-500'
              }`}
            >
              1. استخراج المعطيات
            </div>
            <div
              className={`p-2.5 rounded-xl border text-center transition ${
                loadingStage >= 2
                  ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 font-bold shadow-sm'
                  : 'bg-slate-800/40 border-slate-800 text-slate-500'
              }`}
            >
              2. القوانين والنظريات
            </div>
            <div
              className={`p-2.5 rounded-xl border text-center transition ${
                loadingStage >= 3
                  ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 font-bold shadow-sm'
                  : 'bg-slate-800/40 border-slate-800 text-slate-500'
              }`}
            >
              3. صياغة البرهان والـ LaTeX
            </div>
            <div
              className={`p-2.5 rounded-xl border text-center transition ${
                loadingStage >= 4
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 font-bold shadow-sm'
                  : 'bg-slate-800/40 border-slate-800 text-slate-500'
              }`}
            >
              4. التحقق والمسألة التدريبية
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-200 text-xs font-semibold hover:bg-rose-500/30 transition"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* ================= SOLUTION RESULT VIEW ================= */}
      {solution && (
        <div className="space-y-6 animate-fadeIn">
          {/* Solution Banner & Action Header */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">تم الحل بنجاح وبدقة 100%</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      معتمد علمياً
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {solution.subject} • {solution.topic}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Voice, Bookmark, Print */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Voice Read Aloud */}
                <button
                  onClick={handlePlayVoice}
                  disabled={audioLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    isPlayingAudio
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                  title="استمع للشرح صوتياً"
                >
                  {audioLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  ) : isPlayingAudio ? (
                    <VolumeX className="w-4 h-4 text-amber-400 animate-pulse" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  )}
                  <span>{isPlayingAudio ? 'إيقاف الصوت' : 'استمع للشرح'}</span>
                </button>

                {/* Bookmark */}
                <button
                  onClick={() => onSaveSolution(solution)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    isSaved
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="حفظ في المفضلة"
                >
                  {isSaved ? <BookmarkCheck className="w-4 h-4 text-cyan-400" /> : <Bookmark className="w-4 h-4" />}
                  <span>{isSaved ? 'تم الحفظ' : 'حفظ'}</span>
                </button>

                {/* Print button */}
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white no-print"
                  title="طباعة الحل"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Extracted question text */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/40 p-4 rounded-xl">
              <span className="text-xs font-bold text-slate-400 block mb-1">السؤال المستخرج:</span>
              <MathRenderer content={solution.extractedQuestion} className="text-sm font-medium text-slate-200" />
            </div>

            {/* Final Answer Highlight */}
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/40">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide block mb-1">
                الجواب النهائي المعتمد:
              </span>
              <MathRenderer
                content={solution.finalAnswer}
                className="text-base sm:text-lg font-extrabold text-emerald-200"
              />
            </div>
          </div>

          {/* Primary Laws & Scientific Axioms Reference */}
          {solution.primaryLaws && solution.primaryLaws.length > 0 && (
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-lg">
              <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4" />
                <span>القوانين والنظريات العلمية المعتمدة (مرجعية الحل 100%)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {solution.primaryLaws.map((law, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{law.name}</div>
                      {law.formula && (
                        <div className="mt-2 py-1.5 px-2 bg-slate-900/80 rounded border border-slate-800/60 overflow-x-auto">
                          <MathRenderer content={`$$${law.formula}$$`} block={true} />
                        </div>
                      )}
                    </div>
                    {law.source && (
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                        <span>المصدر:</span>
                        <span className="text-slate-300 font-medium">{law.source}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-Step Educational Stepper */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  <span>الشرح التفصيلي خطوة بخطوة</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تفكيك منطقي كامل للحل لتمكين التعلم الذاتي
                </p>
              </div>

              {/* Reveal toggle for active self-learning */}
              <div className="flex items-center gap-2">
                {!revealedAllSteps && visibleStepsCount < solution.steps.length && (
                  <button
                    onClick={() => setVisibleStepsCount((prev) => Math.min(prev + 1, solution.steps.length))}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-md shadow-cyan-600/20"
                  >
                    <span>أظهر الخطوة التالية ({visibleStepsCount + 1}/{solution.steps.length})</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setRevealedAllSteps(true);
                    setVisibleStepsCount(solution.steps.length);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60"
                >
                  إظهار كافة الخطوات
                </button>
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-4 pt-2">
              {solution.steps.slice(0, revealedAllSteps ? solution.steps.length : visibleStepsCount).map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3 transition"
                >
                  {/* Step Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 text-xs font-black flex items-center justify-center">
                        {step.stepNumber || idx + 1}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-white">{step.title}</h4>
                    </div>
                  </div>

                  {/* Step Explanation */}
                  <div className="text-sm text-slate-300 leading-relaxed pr-8">
                    {step.explanation}
                  </div>

                  {/* Step Math LaTeX */}
                  {step.mathLatex && (
                    <div className="pr-8">
                      <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80 overflow-x-auto text-cyan-200">
                        <MathRenderer content={`$$${step.mathLatex}$$`} block={true} />
                      </div>
                    </div>
                  )}

                  {/* Step Tip / Warning */}
                  {step.tip && (
                    <div className="mr-8 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                      <span className="font-bold">⚠️ تنبيه تعليمي:</span>
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Prompt for student if not all steps revealed */}
            {!revealedAllSteps && visibleStepsCount < solution.steps.length && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-slate-950 border border-blue-800/40 text-center space-y-2">
                <p className="text-xs text-blue-300 font-medium">
                  💡 تلميح للتعلم الذاتي: فكّر في الخطوة القادمة وحاول تطبيقها في مسودتك قبل كشف الحل!
                </p>
                <button
                  onClick={() => setVisibleStepsCount((prev) => prev + 1)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  كشف الخطوة التالية الآن
                </button>
              </div>
            )}

            {/* Verification Note */}
            {solution.verification && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">التحقق من صحة الحل (Verification):</strong>
                  <span>{solution.verification}</span>
                </div>
              </div>
            )}
          </div>

          {/* Practice Question Clone to cement understanding */}
          {solution.practiceQuestion && (
            <div className="bg-gradient-to-br from-indigo-950/30 via-slate-900 to-purple-950/30 rounded-2xl border border-indigo-500/30 p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      تحقق من فهمك الذاتي (مسألة تدريبية مماثلة)
                    </h3>
                    <p className="text-xs text-slate-400">
                      اختبر قدرتك على تطبيق نفس المفهوم بمفردك
                    </p>
                  </div>
                </div>

                {solution.practiceQuestion.hint && (
                  <button
                    onClick={() => setShowPracticeHint(!showPracticeHint)}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                  >
                    {showPracticeHint ? 'إخفاء التلميح' : 'أحتاج تلميحاً 💡'}
                  </button>
                )}
              </div>

              {/* Hint */}
              {showPracticeHint && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
                  {solution.practiceQuestion.hint}
                </div>
              )}

              {/* Practice Question Text */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <MathRenderer
                  content={solution.practiceQuestion.questionText}
                  className="text-sm font-semibold text-slate-100"
                />
              </div>

              {/* Practice Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {solution.practiceQuestion.options.map((opt, oIdx) => {
                  const isSelected = selectedPracticeOption === oIdx;
                  const isCorrect = oIdx === solution.practiceQuestion?.correctIndex;

                  let optClass = 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 text-slate-200';
                  if (isPracticeSubmitted) {
                    if (isCorrect) {
                      optClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold';
                    } else if (isSelected && !isCorrect) {
                      optClass = 'bg-rose-500/20 border-rose-500 text-rose-200';
                    }
                  } else if (isSelected) {
                    optClass = 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold';
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={isPracticeSubmitted}
                      onClick={() => setSelectedPracticeOption(oIdx)}
                      className={`p-3.5 rounded-xl border text-right transition flex items-center justify-between text-xs sm:text-sm ${optClass}`}
                    >
                      <MathRenderer content={opt} />
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-xs flex items-center justify-center shrink-0 mr-2">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Submit Answer */}
              {!isPracticeSubmitted ? (
                <div className="flex justify-end pt-2">
                  <button
                    disabled={selectedPracticeOption === null}
                    onClick={() => setIsPracticeSubmitted(true)}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20"
                  >
                    تأكيد إجابتي
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <div
                    className={`p-4 rounded-xl border ${
                      selectedPracticeOption === solution.practiceQuestion.correctIndex
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      {selectedPracticeOption === solution.practiceQuestion.correctIndex ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>إجابة صحيحة وممتازة! أحسنت الفهم.</span>
                        </>
                      ) : (
                        <>
                          <X className="w-5 h-5 text-rose-400" />
                          <span>إجابة غير صحيحة، لا بأس فالأخطاء طريق التعلم.</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {solution.practiceQuestion.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
