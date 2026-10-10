import React, { useState, useRef, useEffect } from 'react';
import { EducationalStage, SubjectId, UploadedCourse, CourseExam, UserProfile } from '../types';
import { INITIAL_COURSES } from '../data/usersData';
import { SUBJECTS, STAGES } from '../data/curricula';
import { MathRenderer } from './MathRenderer';
import { compressImage } from '../utils/imageCompressor';
import { apiRequest } from '../utils/apiClient';
import {
  BookOpen,
  Upload,
  FileText,
  Sparkles,
  PlusCircle,
  FileCheck2,
  Printer,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  X,
  Loader2,
  Trash2,
  Download,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TeacherHubProps {
  currentUser: UserProfile;
  selectedStage: EducationalStage;
  darkMode: boolean;
}

export const TeacherHub: React.FC<TeacherHubProps> = ({ currentUser, selectedStage, darkMode }) => {
  const [courses, setCourses] = useState<UploadedCourse[]>(() => {
    try {
      const stored = localStorage.getItem('nebras_teacher_courses');
      return stored ? JSON.parse(stored) : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  });

  const [activeTab, setActiveTab] = useState<'courses' | 'generate-exam' | 'grade-submissions'>('courses');

  // Course Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSubject, setCourseSubject] = useState<SubjectId>('math');
  const [courseContentText, setCourseContentText] = useState('');
  const [courseFileName, setCourseFileName] = useState('');
  const [courseFileImage, setCourseFileImage] = useState<string | null>(null);
  const [isAnalyzingCourse, setIsAnalyzingCourse] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Exam Generator State
  const [selectedCourseForExam, setSelectedCourseForExam] = useState<UploadedCourse>(courses[0] || INITIAL_COURSES[0]);
  const [examDifficulty, setExamDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [examType, setExamType] = useState<'mcq' | 'problems' | 'mixed' | 'essay'>('mixed');
  const [examQuestionsCount, setExamQuestionsCount] = useState<number>(5);
  const [teacherSpecialNotes, setTeacherSpecialNotes] = useState('');
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<CourseExam | null>(null);

  // Student Grading State
  const [gradingExamText, setGradingExamText] = useState('');
  const [studentAnswersText, setStudentAnswersText] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [gradingReport, setGradingReport] = useState<any | null>(null);

  // Non-blocking progress indicator for generating exam
  const [examProgressStep, setExamProgressStep] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Local File Reading with Image Compression & Non-blocking Chunking
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCourseFileName(file.name);
    setUploadError(null);

    if (file.type.startsWith('image/')) {
      try {
        const compressed = await compressImage(file, 1280, 0.8);
        setCourseFileImage(compressed.dataUrl);
      } catch {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setCourseFileImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } else {
      // Text / Markdown / Document reading in non-blocking fashion
      const reader = new FileReader();
      reader.onload = (ev) => {
        const full = (ev.target?.result as string) || '';
        // If file is very large, limit to first 25,000 characters to prevent browser freezing
        setCourseContentText(full.slice(0, 25000));
      };
      reader.readAsText(file);
    }
  };

  // Analyze & Save Course via Gemini with 120s Timeout
  const handleUploadCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim() || (!courseContentText.trim() && !courseFileImage)) {
      setUploadError('يرجى إدخال عنوان المقرر وإرفاق محتواه كملف أو نص.');
      return;
    }

    setIsAnalyzingCourse(true);
    setUploadError(null);

    try {
      const { data } = await apiRequest('/api/analyze-course-document', {
        method: 'POST',
        timeoutMs: 120000,
        body: JSON.stringify({
          title: courseTitle.trim(),
          subject: courseSubject,
          stage: selectedStage,
          fileContent: courseContentText,
          imageBase64: courseFileImage,
        }),
      });

      if (!data.success) {
        throw new Error(data.error || 'تعذر تحليل المقرر');
      }

      const newCourse: UploadedCourse = {
        id: 'crs-' + Date.now(),
        title: courseTitle.trim(),
        subject: courseSubject,
        stage: selectedStage,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        fileName: courseFileName || 'وثيقة_المقرر.txt',
        fileSize: 'محلل ومحفوظ',
        extractedSummary: data.analysis.summary,
        chapters: data.analysis.chapters || ['الوحدة الأولى: المبادئ العامة', 'الوحدة الثانية: التطبيقات'],
        uploadDate: new Date().toLocaleDateString('ar-SA'),
        fullContent: courseContentText,
        examsGeneratedCount: 0,
      };

      const updated = [newCourse, ...courses];
      setCourses(updated);
      setSelectedCourseForExam(newCourse);
      localStorage.setItem('nebras_teacher_courses', JSON.stringify(updated));

      setIsUploadModalOpen(false);
      setCourseTitle('');
      setCourseContentText('');
      setCourseFileImage(null);
      setCourseFileName('');

      confetti({ particleCount: 60, spread: 60 });
    } catch (err: any) {
      setUploadError(err.message || 'حدث خطأ أثناء معالجة ملف المقرر.');
    } finally {
      setIsAnalyzingCourse(false);
    }
  };

  // Generate Custom Exam from Course with Step Feedback & 120s Timeout
  const handleGenerateExam = async () => {
    if (!selectedCourseForExam) return;

    setIsGeneratingExam(true);
    setGeneratedExam(null);
    setExamProgressStep('التحقق من حالة السيرفر واستدعاء الذكاء الاصطناعي...');

    const stepTimer1 = setTimeout(() => {
      setExamProgressStep('تحليل فصول المقرر واستنباط مخرجات التعلم...');
    }, 2500);

    const stepTimer2 = setTimeout(() => {
      setExamProgressStep('صياغة الأسئلة وضبط صيغ LaTeX والمعادلات بدقة...');
    }, 7000);

    try {
      const { data } = await apiRequest('/api/generate-exam-from-course', {
        method: 'POST',
        timeoutMs: 120000,
        retries: 2,
        body: JSON.stringify({
          courseTitle: selectedCourseForExam.title,
          courseSummary: selectedCourseForExam.extractedSummary,
          chapters: selectedCourseForExam.chapters,
          difficulty: examDifficulty,
          examType: examType,
          questionsCount: examQuestionsCount,
          teacherNotes: teacherSpecialNotes,
        }),
      });

      if (!data.success) {
        throw new Error(data.error || 'فشل في توليد الاختبار');
      }

      const examResult: CourseExam = {
        id: 'exm-' + Date.now(),
        courseId: selectedCourseForExam.id,
        courseTitle: selectedCourseForExam.title,
        title: data.exam.title,
        examType: data.exam.examType,
        difficulty: data.exam.difficulty,
        durationMinutes: data.exam.durationMinutes,
        totalMarks: data.exam.totalMarks,
        questions: data.exam.questions,
        createdAt: new Date().toLocaleDateString('ar-SA'),
        teacherName: currentUser.name,
      };

      setGeneratedExam(examResult);
      confetti({ particleCount: 70, spread: 70 });
    } catch (err: any) {
      alert(err.message || 'حدث خطأ في توليد الاختبار.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsGeneratingExam(false);
      setExamProgressStep('');
    }
  };

  // Grade student exam answers against the course rubric
  const handleGradeSubmissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentAnswersText.trim()) return;

    setIsGrading(true);
    setGradingReport(null);

    try {
      const res = await fetch('/api/grade-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examText: `مقرر: ${selectedCourseForExam.title}\nإجابات الطالب المستلمة:\n${studentAnswersText}`,
          subject: selectedCourseForExam.subject,
          stage: selectedStage,
        }),
      });

      const data = await res.json();
      if (data.success && data.report) {
        setGradingReport(data.report);
      }
    } catch {
      alert('تعذر استكمال التصحيح.');
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Teacher Hub Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-teal-950/40 border border-emerald-500/30 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>بوابة المعلم الأكاديمية والمقررات الرسمية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            رفع المقررات الدراسية وتوليد الاختبارات والتصحيح الاحترافي
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            مرحباً بك {currentUser.name} ({currentUser.institution || 'معلم معتمد'}). ارفع مقررك الدراسي كملف، استخرج وحداته تلقائياً، أنشئ نماذج اختبارات معتمدة بمستويات دقيقة، وصحح إجابات الطلاب فورياً.
          </p>
        </div>

        <div className="mt-4 sm:mt-0 sm:absolute sm:top-8 sm:left-8 flex flex-col gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition transform active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>رفع مقرر دراسي جديد (ملف)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'courses'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>المقررات المرفوعة ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('generate-exam')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'generate-exam'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>توليد اختبار من المقرر الدراسي</span>
        </button>

        <button
          onClick={() => setActiveTab('grade-submissions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'grade-submissions'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>تصحيح أوراق الطلاب بنموذج الإجابة</span>
        </button>
      </div>

      {/* ================= SECTION 1: UPLOADED COURSES LIST ================= */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-sm hover:border-emerald-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">
                      {SUBJECTS.find((s) => s.id === course.subject)?.name || course.subject}
                    </span>
                    <span className="text-[11px] text-slate-400">{course.uploadDate}</span>
                  </div>

                  <h3 className="font-bold text-white text-base sm:text-lg leading-snug">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {course.extractedSummary}
                  </p>

                  {/* Chapters List */}
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                    <span className="font-bold text-slate-300 block mb-1">فصول ووحدات المقرر المعتمدة:</span>
                    {course.chapters.slice(0, 3).map((ch, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{ch}</span>
                      </div>
                    ))}
                    {course.chapters.length > 3 && (
                      <span className="text-[11px] text-cyan-400 font-bold block pt-1">
                        + {course.chapters.length - 3} فصول إضافية
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    الملف: <strong className="text-slate-200">{course.fileName}</strong>
                  </span>

                  <button
                    onClick={() => {
                      setSelectedCourseForExam(course);
                      setActiveTab('generate-exam');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>توليد اختبار لهذا المقرر</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SECTION 2: GENERATE EXAM FROM COURSE ================= */}
      {activeTab === 'generate-exam' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>إعدادات وتوليد الاختبار الرسمي من المقرر</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Select Course */}
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">المقرر المستهدف:</label>
                <select
                  value={selectedCourseForExam?.id}
                  onChange={(e) => {
                    const found = courses.find((c) => c.id === e.target.value);
                    if (found) setSelectedCourseForExam(found);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">مستوى صعوبة الامتحان:</label>
                <select
                  value={examDifficulty}
                  onChange={(e) => setExamDifficulty(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                >
                  <option value="easy">سهل (تأسيسي ومباشر)</option>
                  <option value="medium">متوسط (مطابق للاختبارات الوزارية الرسمية)</option>
                  <option value="hard">متقدم (قدرات عليا وتفكير ناقد)</option>
                </select>
              </div>

              {/* Exam Type */}
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">نوع الأسئلة المطلوبة:</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                >
                  <option value="mixed">شامل ومتنوع (اختيارات ومسائل ومقالي)</option>
                  <option value="mcq">اختيار من متعدد فقط (MCQ)</option>
                  <option value="problems">مسائل حسابية وبراهين خطوة بخطوة</option>
                  <option value="essay">أسئلة مقالية وتفسير نظري</option>
                </select>
              </div>

              {/* Question count */}
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">عدد الأسئلة:</label>
                <select
                  value={examQuestionsCount}
                  onChange={(e) => setExamQuestionsCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                >
                  <option value={5}>5 أسئلة (اختبار قصير - Quiz)</option>
                  <option value={10}>10 أسئلة (اختبار فصلي - Midterm)</option>
                  <option value={15}>15 سؤالاً (اختبار نهائي شامل)</option>
                </select>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="font-bold text-slate-300 block mb-1.5 text-xs">
                توجيهات وملاحظات المعلم الخاصة بالاختبار (اختياري):
              </label>
              <input
                type="text"
                value={teacherSpecialNotes}
                onChange={(e) => setTeacherSpecialNotes(e.target.value)}
                placeholder="مثال: التركيز على قاعدة السلسلة وتطبيقات المساحات وتجنب الأسئلة المحفوظة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Progress indicator during AI Exam generation */}
            {isGeneratingExam && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>{examProgressStep || 'جاري معالجة وتوليد الاختبار...'}</span>
                  </div>
                  <span className="font-mono text-emerald-400">مهلة آمنة 120 ثانية</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full w-2/3 animate-pulse" />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleGenerateExam}
                disabled={isGeneratingExam}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-black text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition"
              >
                {isGeneratingExam ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري صياغة وبناء الاختبار وفق المعايير الوزارية...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>توليد الاختبار الرسمي ونموذج الإجابة الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Render Generated Exam */}
          {generatedExam && (
            <div className="bg-slate-900/90 rounded-2xl border border-emerald-500/40 p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-emerald-400 block mb-1">
                    {generatedExam.courseTitle}
                  </span>
                  <h3 className="text-xl font-black text-white">{generatedExam.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span>المعلم: {generatedExam.teacherName}</span>
                    <span>•</span>
                    <span>الزمن: {generatedExam.durationMinutes} دقيقة</span>
                    <span>•</span>
                    <span>الدرجة الكلية: {generatedExam.totalMarks} درجة</span>
                  </div>
                </div>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold no-print"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة ورقة الاختبار</span>
                </button>
              </div>

              {/* Exam Questions */}
              <div className="space-y-5">
                {generatedExam.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="text-sm sm:text-base font-bold text-white leading-relaxed">
                          <MathRenderer content={q.question} />
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-900 text-cyan-300 shrink-0">
                        ({q.marks} درجات)
                      </span>
                    </div>

                    {/* MCQ Options if available */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-9 pt-1">
                        {q.options.map((opt, optI) => (
                          <div
                            key={optI}
                            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300"
                          >
                            <span className="font-bold text-slate-400 ml-2">
                              {String.fromCharCode(65 + optI)})
                            </span>
                            <MathRenderer content={opt} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Model Answer & Rubric for Teacher */}
                    <div className="mr-9 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>الإجابة النموذجية المعتمدة وتوزيع الدرجات:</span>
                      </div>
                      <div className="text-slate-200 pr-6">
                        <MathRenderer content={q.correctAnswer} />
                      </div>
                      <div className="text-slate-300 text-[11px] pr-6 pt-1 leading-relaxed">
                        {q.modelAnswerExplanation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION 3: PROFESSIONAL SUBMISSION GRADER ================= */}
      {activeTab === 'grade-submissions' && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <span>تصحيح أوراق إجابات الطلاب وفق بنك أسئلة المقرر</span>
          </h2>

          <form onSubmit={handleGradeSubmissions} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                الصق إجابات الطالب أو نص ورقة الاختبار:
              </label>
              <textarea
                value={studentAnswersText}
                onChange={(e) => setStudentAnswersText(e.target.value)}
                placeholder="السؤال 1: ...&#10;إجابة الطالب: ...&#10;السؤال 2: ...&#10;إجابة الطالب: ..."
                className="w-full h-36 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isGrading || !studentAnswersText.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md disabled:opacity-50"
              >
                {isGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck2 className="w-4 h-4" />}
                <span>رصد الدرجات وإصدار تقرير التصحيح النموذجي</span>
              </button>
            </div>
          </form>

          {/* Report Display */}
          {gradingReport && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-white text-base">تقرير رصد درجات الطالب</h4>
                <span className="text-emerald-400 font-black text-lg">
                  {gradingReport.studentMarks} / {gradingReport.totalMarks} ({gradingReport.percentage}%)
                </span>
              </div>
              <p className="text-xs text-slate-300">{gradingReport.summaryFeedback}</p>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: UPLOAD NEW COURSE FILE ================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                <span>رفع وتدقيق مقرر دراسي جديد (ملف)</span>
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadCourse} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">عنوان المقرر والمرحلة:</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="مثال: مقرر الكيمياء العضوية - الصف الثاني ثانوي"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">المادة الدراسية:</label>
                <select
                  value={courseSubject}
                  onChange={(e) => setCourseSubject(e.target.value as SubjectId)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File upload input */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  1. اختر ملف المقرر (PDF, TXT, صور صفحات الكتاب):
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.json,image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/60 text-slate-300 hover:text-white flex items-center justify-center gap-2 transition"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>{courseFileName ? `تم اختيار: ${courseFileName}` : 'استعراض واختيار ملف من جهازك'}</span>
                </button>
              </div>

              {/* Or manual text input */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  2. أو الصق نصوص وفصول المقرر هنا مباشرة:
                </label>
                <textarea
                  value={courseContentText}
                  onChange={(e) => setCourseContentText(e.target.value)}
                  placeholder="الصق مفردات المنهج، الفصول، المسائل النموذجية، ونواتج التعلم..."
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzingCourse}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  {isAnalyzingCourse ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري استخراج وتحليل الفصول بالذكاء الاصطناعي...</span>
                    </>
                  ) : (
                    <span>تحليل وحفظ المقرر</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
