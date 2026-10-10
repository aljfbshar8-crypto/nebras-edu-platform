import React, { useState } from 'react';
import { EducationalStage, QuizData, QuizQuestion, SubjectId } from '../types';
import { STAGES, CURRICULA, SUBJECTS } from '../data/curricula';
import { MathRenderer } from './MathRenderer';
import { apiRequest } from '../utils/apiClient';
import {
  HelpCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  Award,
  RotateCcw,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InteractiveQuizProps {
  selectedStage: EducationalStage;
  selectedCurriculum: string;
  language: 'ar' | 'en' | 'fr';
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({
  selectedStage,
  selectedCurriculum,
  language,
}) => {
  const [subject, setSubject] = useState<SubjectId>('math');
  const [topic, setTopic] = useState('حساب التفاضل والتكامل وتطبيقات القيم العظمى');
  const [difficulty, setDifficulty] = useState('متوسط');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [quizFinished, setQuizFinished] = useState(false);

  // Suggested topics based on stage & subject
  const suggestedTopics = [
    'التفاضل والتكامل وحساب المساحات',
    'الهندسة التحليلية وحساب المثلثات',
    'الجبر الخطي والمصفوفات والأنظمة الخطية',
    'الاحتمالات والإحصاء والتوزيع الطبيعي',
    'قوانين نيوتن وحفظ كمية الحركة (فيزياء)',
    'الكيمياء الحرارية وسرعة التفاعلات',
  ];

  const handleGenerateQuiz = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setQuiz(null);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowHint({});
    setQuizFinished(false);

    try {
      const stageName = STAGES.find((s) => s.id === selectedStage)?.name || selectedStage;
      const curriculumName = CURRICULA.find((c) => c.id === selectedCurriculum)?.name || selectedCurriculum;
      const subjectName = SUBJECTS.find((sub) => sub.id === subject)?.name || subject;

      const { data } = await apiRequest('/api/generate-quiz', {
        method: 'POST',
        timeoutMs: 120000,
        retries: 2,
        body: JSON.stringify({
          subject: subjectName,
          stage: stageName,
          curriculum: curriculumName,
          topic: topic.trim(),
          difficulty,
          questionCount,
          language,
        }),
      });

      if (!data.success) {
        throw new Error(data.error || 'فشل في إنشاء الاختبار');
      }

      setQuiz(data.quiz);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في إنشاء الاختبار.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId: number, optionIdx: number) => {
    if (userAnswers[qId] !== undefined) return; // already answered
    const nextAnswers = { ...userAnswers, [qId]: optionIdx };
    setUserAnswers(nextAnswers);

    // If last question answered, trigger confetti if high score
    if (quiz && Object.keys(nextAnswers).length === quiz.questions.length) {
      calculateAndTriggerFinish(nextAnswers);
    }
  };

  const calculateAndTriggerFinish = (answers: Record<number, number>) => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q) => {
      if (answers[q.id] === q.correctIndex) correct++;
    });
    const percent = Math.round((correct / quiz.questions.length) * 100);
    if (percent >= 70) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
    setQuizFinished(true);
  };

  const currentQ: QuizQuestion | undefined = quiz?.questions[currentQuestionIndex];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-orange-950/40 border border-amber-500/30 p-6 sm:p-8 shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>منصة الاختبارات الذاتية التفاعلية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            أنشئ اختبارك الذاتي المخصص في أي موضوع ومنهج
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            اختبارات تفاعلية فورية تولّد بدقة أكاديمية لمطابقة مستواك الدراسي مع تلميحات ذكية وشروحات خطوة بخطوة لكل مسألة.
          </p>
        </div>
      </div>

      {/* Generator Configuration Panel */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-7 shadow-lg space-y-5">
        <form onSubmit={handleGenerateQuiz} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subject */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">المادة:</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectId)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-200 focus:border-amber-500 outline-none"
              >
                {SUBJECTS.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.icon} {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">مستوى الصعوبة:</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-200 focus:border-amber-500 outline-none"
              >
                <option value="سهل - تأسيسي">سهل (تأسيسي وتثبيت مفاهيم)</option>
                <option value="متوسط - مطابق للاختبارات الوزارية">متوسط (مطابق للاختبارات المدرسية)</option>
                <option value="متقدم - قدرات وأولمبياد وتفكير ناقد">متقدم (قدرات وتفكير ناقد)</option>
              </select>
            </div>

            {/* Question Count */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">عدد الأسئلة:</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-200 focus:border-amber-500 outline-none"
              >
                <option value={3}>3 أسئلة (سريع)</option>
                <option value={5}>5 أسئلة (نموذجي)</option>
                <option value={8}>8 أسئلة (شامل)</option>
                <option value={10}>10 أسئلة (اختبار كامل)</option>
              </select>
            </div>

            {/* Stage info readonly */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">المرحلة والمنهج:</label>
              <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 truncate">
                {STAGES.find((s) => s.id === selectedStage)?.name}
              </div>
            </div>
          </div>

          {/* Topic input */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              الموضوع أو الوحدة الدراسية المحددة:
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: نظرية فيثاغورس، إيجاد النهايات، قانون كيرشوف، المتطابقات المثلثية..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none transition"
            />

            {/* Suggested topics */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 ml-1">اقتراحات:</span>
              {suggestedTopics.map((top, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopic(top)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition"
                >
                  {top}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition transform active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري إعداد الاختبار الأكاديمي...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>توليد الاختبار وبدء التدريب الآن</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* ================= INTERACTIVE QUIZ RUNNER ================= */}
      {quiz && currentQ && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Quiz Bar */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-400 block mb-0.5">{quiz.title}</span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {quiz.subject} • {quiz.topic}
              </h2>
            </div>

            {/* Stepper info */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs font-bold text-slate-300">
                السؤال {currentQuestionIndex + 1} من {quiz.questions.length}
              </span>
              <div className="w-32 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-7 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  {currentQuestionIndex + 1}
                </span>
                <div className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                  <MathRenderer content={currentQ.question} />
                </div>
              </div>

              {currentQ.hint && (
                <button
                  onClick={() => setShowHint({ ...showHint, [currentQ.id]: !showHint[currentQ.id] })}
                  className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>تلميح</span>
                </button>
              )}
            </div>

            {/* Hint alert */}
            {showHint[currentQ.id] && currentQ.hint && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                <span>💡 تلميح استرشادي:</span>
                <span>{currentQ.hint}</span>
              </div>
            )}

            {/* Answer Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = userAnswers[currentQ.id] === optIdx;
                const isAnswered = userAnswers[currentQ.id] !== undefined;
                const isCorrect = optIdx === currentQ.correctIndex;

                let optClass = 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 text-slate-200';
                if (isAnswered) {
                  if (isCorrect) {
                    optClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold';
                  } else if (isSelected && !isCorrect) {
                    optClass = 'bg-rose-500/20 border-rose-500 text-rose-200';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(currentQ.id, optIdx)}
                    className={`p-4 rounded-xl border text-right transition flex items-center justify-between text-xs sm:text-sm ${optClass}`}
                  >
                    <MathRenderer content={option} />
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-xs flex items-center justify-center shrink-0 mr-2">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Step-by-step feedback once answered */}
            {userAnswers[currentQ.id] !== undefined && (
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                    userAnswers[currentQ.id] === currentQ.correctIndex
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {userAnswers[currentQ.id] === currentQ.correctIndex ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>إجابة صحيحة ورائعة!</span>
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5 text-rose-400" />
                      <span>
                        إجابة خاطئة. الإجابة الصحيحة هي: ({String.fromCharCode(65 + currentQ.correctIndex)}){' '}
                        {currentQ.options[currentQ.correctIndex]}
                      </span>
                    </>
                  )}
                </div>

                {/* Step by step solution */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
                  <span className="font-bold text-cyan-400 block">خطوات الحل والتوضيح:</span>
                  <ul className="space-y-1.5 text-slate-300">
                    {currentQ.stepByStepSolution.map((st, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <MathRenderer content={st} />
                      </li>
                    ))}
                  </ul>

                  {currentQ.lawUsed && (
                    <div className="pt-2 text-[11px] text-slate-400">
                      القانون المعتمد: <strong className="text-slate-200">{currentQ.lawUsed}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السؤال السابق</span>
              </button>

              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <span>السؤال التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setQuizFinished(true)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>عرض النتيجة النهائية</span>
                </button>
              )}
            </div>
          </div>

          {/* Final Quiz Score Modal / Banner */}
          {quizFinished && (
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-white">انتهى الاختبار الذاتي بنجاح!</h3>
              <p className="text-sm text-slate-300">
                أجبت على {Object.values(userAnswers).filter((ans, i) => ans === quiz.questions[i]?.correctIndex).length}{' '}
                من أصل {quiz.questions.length} أسئلة بشكل صحيح.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setUserAnswers({});
                    setCurrentQuestionIndex(0);
                    setQuizFinished(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة المحاولة لنفس الأسئلة</span>
                </button>
                <button
                  onClick={() => handleGenerateQuiz()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>توليد اختبار جديد بأسئلة جديدة</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
