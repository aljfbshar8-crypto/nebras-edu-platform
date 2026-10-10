import React, { useState, useRef } from 'react';
import { EducationalStage, ExamReport, SubjectId } from '../types';
import { STAGES, SUBJECTS } from '../data/curricula';
import { MathRenderer } from './MathRenderer';
import { compressImage } from '../utils/imageCompressor';
import { apiRequest } from '../utils/apiClient';
import {
  FileCheck2,
  Camera,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  RotateCcw,
  Printer,
  Sparkles,
  HelpCircle,
  Percent
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExamGraderProps {
  selectedStage: EducationalStage;
  language: 'ar' | 'en' | 'fr';
}

export const ExamGrader: React.FC<ExamGraderProps> = ({ selectedStage, language }) => {
  const [examText, setExamText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [subject, setSubject] = useState<SubjectId>('math');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ExamReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1280, 0.8);
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

  const handleSampleExam = () => {
    setExamText(`اختبار رياضيات - المرحلة الثانوية:
السؤال 1: أوجد مشتقة الدالة f(x) = 3x^2 - 5x + 4
إجابة الطالب: f'(x) = 6x - 5

السؤال 2: احسب قيمة التكامل المحدد من 0 إلى 2 لـ (2x + 1) dx
إجابة الطالب: 5

السؤال 3: أوجد ميل المماس للمنحنى y = x^3 عند النقطة (1, 1)
إجابة الطالب: الميل = 1`);
  };

  const handleGradeExam = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!examText.trim() && !imageBase64) {
      setError('يرجى رفع صورة ورقة الاختبار أو كتابة الأسئلة وإجابات الطالب.');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const stageName = STAGES.find((s) => s.id === selectedStage)?.name || selectedStage;
      const subjectName = SUBJECTS.find((sub) => sub.id === subject)?.name || subject;

      const { data } = await apiRequest('/api/grade-exam', {
        method: 'POST',
        timeoutMs: 120000,
        retries: 2,
        body: JSON.stringify({
          imageBase64,
          examText: examText.trim(),
          subject: subjectName,
          stage: stageName,
        }),
      });

      if (!data.success) {
        throw new Error(data.error || 'فشل في تصحيح ورقة الاختبار');
      }

      setReport(data.report);

      if (data.report.percentage >= 80) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التصحيح، يرجى المحاولة ثانية.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>المصحح الأكاديمي الذكي المعتمد</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            تصحيح فوري وشامل لأوراق الاختبارات بالصور أو النصوص
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            التقط صورة لورقة إجابتك أو حلول الاختبار؛ سيقوم النظام بتصحيح كل مسألة بدقة 100%، ورصد الدرجات، وشرح مواطن الخطأ مع تقديم الحل النموذجي وخطة تقوية مخصصة.
          </p>
        </div>
      </div>

      {/* Upload & Form Container */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-7 shadow-lg space-y-5">
        {/* Subject switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 ml-1">مادة الاختبار:</span>
          {SUBJECTS.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSubject(sub.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                subject === sub.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {sub.icon} {sub.name}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleGradeExam} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Upload Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                1. صورة ورقة الاختبار أو الإجابات (من الكاميرا أو المعرض):
              </label>

              {imageBase64 ? (
                <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950 p-2 flex items-center justify-center min-h-[160px]">
                  <img
                    src={imageBase64}
                    alt="ورقة الاختبار المرفقة"
                    className="max-h-48 object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setImageBase64(null)}
                    className="absolute top-3 right-3 bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-full shadow transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/40 flex flex-col items-center justify-center min-h-[160px] gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-200">
                    انقر لالتقاط صورة أو رفع ورقة الاختبار
                  </span>
                  <span className="text-[11px] text-slate-500">
                    يدعم خط اليد والمسائل المطبوعة (JPG, PNG)
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Text Input / Instructions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 block">
                  2. أو اكتب الأسئلة وإجابات الطالب كتابياً:
                </label>
                <button
                  type="button"
                  onClick={handleSampleExam}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
                >
                  تجربة اختبار نموذجي جاهز 📝
                </button>
              </div>

              <textarea
                value={examText}
                onChange={(e) => setExamText(e.target.value)}
                placeholder="مثال:&#10;السؤال 1: أوجد قيمة sin(30) + cos(60)&#10;إجابة الطالب: 1&#10;&#10;السؤال 2: احسب تسارع جسم كتلته 5kg تؤثر عليه قوة 20N&#10;إجابة الطالب: 4 m/s²"
                className="w-full h-40 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              * يتم التصحيح وفق المعايير الأكاديمية بنسبة دقة 100% مع البراهين.
            </span>

            <button
              type="submit"
              disabled={loading || (!examText.trim() && !imageBase64)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري تدقيق وتصحيح الورقة...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-5 h-5" />
                  <span>تصحيح ورقة الاختبار فورياً</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error View */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ================= COMPREHENSIVE GRADING REPORT ================= */}
      {report && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Score Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {/* Percentage Ring / Badge */}
                <div
                  className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 shadow-lg ${
                    report.percentage >= 80
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : report.percentage >= 60
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-rose-500/20 border-rose-500 text-rose-300'
                  }`}
                >
                  <span className="text-2xl font-black">{report.percentage}%</span>
                  <span className="text-[10px] font-bold">الدرجة المئوية</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">تقرير تقييم الاختبار الأكاديمي</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-cyan-300 border border-cyan-500/30">
                      {report.overallGrade}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">
                    الدرجة المستحقة: <strong className="text-white">{report.studentMarks}</strong> من أصل{' '}
                    <strong className="text-white">{report.totalMarks}</strong>
                  </p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
                    {report.summaryFeedback}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 no-print"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة النتيجة</span>
                </button>
              </div>
            </div>
          </div>

          {/* Strengths & Improvement Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-slate-900/80 rounded-2xl border border-emerald-500/20 p-5 space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>نقاط القوة والإتقان لدى الطالب</span>
              </h3>
              <ul className="space-y-2">
                {report.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvement Plan */}
            <div className="bg-slate-900/80 rounded-2xl border border-amber-500/20 p-5 space-y-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>الخطة العلاجية والتوصيات للتحسين</span>
              </h3>
              <ul className="space-y-2">
                {report.recommendedActionPlan.map((plan, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{plan}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Itemized Questions Breakdown */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-cyan-400" />
              <span>تفصيل تصحيح الأسئلة سؤالاً بسؤال</span>
            </h3>

            <div className="space-y-4">
              {report.questions.map((q, idx) => (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-xl border transition ${
                    q.isCorrect
                      ? 'bg-slate-950/60 border-emerald-500/30'
                      : 'bg-slate-950/60 border-rose-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                          q.isCorrect
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {q.questionNumber || idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        <MathRenderer content={q.questionText} />
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          q.isCorrect
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {q.isCorrect ? 'إجابة صحيحة ✓' : 'تحتاج تصحيح ✗'}
                      </span>
                      <span className="text-slate-400">
                        الدرجة: {q.earnedMarks} / {q.maxMarks}
                      </span>
                    </div>
                  </div>

                  {/* Answers comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block font-semibold mb-1">إجابة الطالب:</span>
                      <div className="text-slate-200">
                        <MathRenderer content={q.studentAnswer || '(لم تُكتب إجابة)'} />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                      <span className="text-emerald-400 block font-semibold mb-1">الإجابة النموذجية 100%:</span>
                      <div className="text-emerald-200 font-bold">
                        <MathRenderer content={q.correctAnswer} />
                      </div>
                    </div>
                  </div>

                  {/* Explanation & Pitfall */}
                  <div className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                    <strong className="text-cyan-300 block mb-1">الشرح التربوي والتوجيه:</strong>
                    <MathRenderer content={q.explanation} />
                    {q.commonPitfall && (
                      <div className="mt-2 text-amber-300 font-medium flex items-center gap-1.5">
                        <span>⚠️ انتبه:</span>
                        <span>{q.commonPitfall}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
