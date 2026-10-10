/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EducationalStage, SolutionData, UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { QuestionSolver } from './components/QuestionSolver';
import { ExamGrader } from './components/ExamGrader';
import { InteractiveQuiz } from './components/InteractiveQuiz';
import { MathGrapher } from './components/MathGrapher';
import { SavedSolutions } from './components/SavedSolutions';
import { StudentCommunity } from './components/StudentCommunity';
import { TeacherHub } from './components/TeacherHub';
import { EngineerDashboard } from './components/EngineerDashboard';
import { AuthModal } from './components/AuthModal';
import { TrialCountdownBanner } from './components/TrialCountdownBanner';
import { TrialExpiredModal } from './components/TrialExpiredModal';
import { CompanyBrandLogo } from './components/CompanyBrandLogo';
import { INITIAL_USERS } from './data/usersData';
import { startKeepAlivePing } from './utils/apiClient';
import {
  Sparkles,
  ShieldCheck,
  BookCheck,
  Award,
  Phone,
  Lock,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'solver' | 'grader' | 'quiz' | 'grapher' | 'saved' | 'community' | 'teacher' | 'engineer'
  >('solver');

  // Theme state (إضاءة ليلية وعادية)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('nebras_theme') !== 'light';
  });

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('nebras_is_logged_in') === 'true';
  });

  // Trial countdown timer state (3 minutes = 180 seconds)
  // Lockout enforced: after time expires, user cannot continue without logging in
  const TOTAL_TRIAL_SECONDS = 180;
  const [trialSecondsLeft, setTrialSecondsLeft] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('nebras_trial_seconds_left');
      return stored !== null ? Math.max(0, parseInt(stored, 10)) : TOTAL_TRIAL_SECONDS;
    } catch {
      return TOTAL_TRIAL_SECONDS;
    }
  });

  const [isTrialExpired, setIsTrialExpired] = useState<boolean>(() => {
    if (localStorage.getItem('nebras_is_logged_in') === 'true') return false;
    try {
      const stored = localStorage.getItem('nebras_trial_seconds_left');
      return stored !== null && parseInt(stored, 10) <= 0;
    } catch {
      return false;
    }
  });

  // Current User (طالب / معلم / مهندس)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('nebras_current_user');
      return stored ? JSON.parse(stored) : INITIAL_USERS[3]; // default student
    } catch {
      return INITIAL_USERS[3];
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Educational stage and curriculum states with localStorage persistence
  const [selectedStage, setSelectedStage] = useState<EducationalStage>(() => {
    return (localStorage.getItem('nebras_stage') as EducationalStage) || 'high';
  });

  const [selectedCurriculum, setSelectedCurriculum] = useState<string>(() => {
    return localStorage.getItem('nebras_curriculum') || 'general';
  });

  const [language, setLanguage] = useState<'ar' | 'en' | 'fr'>('ar');

  // Saved solutions bookmarks
  const [savedSolutions, setSavedSolutions] = useState<SolutionData[]>(() => {
    try {
      const stored = localStorage.getItem('nebras_saved_solutions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Active solution loaded in solver
  const [activeSolutionToView, setActiveSolutionToView] = useState<SolutionData | null>(null);

  // Keep-alive ping loop to prevent Render backend from sleeping
  useEffect(() => {
    const stopPing = startKeepAlivePing(10);
    return stopPing;
  }, []);

  // Countdown timer ticker for trial preview mode
  useEffect(() => {
    if (isLoggedIn) {
      setIsTrialExpired(false);
      return;
    }

    if (trialSecondsLeft <= 0) {
      setIsTrialExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTrialSecondsLeft((prev) => {
        const next = prev - 1;
        localStorage.setItem('nebras_trial_seconds_left', next.toString());
        if (next <= 0) {
          setIsTrialExpired(true);
        }
        return Math.max(0, next);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoggedIn, trialSecondsLeft]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('nebras_stage', selectedStage);
  }, [selectedStage]);

  useEffect(() => {
    localStorage.setItem('nebras_curriculum', selectedCurriculum);
  }, [selectedCurriculum]);

  useEffect(() => {
    localStorage.setItem('nebras_saved_solutions', JSON.stringify(savedSolutions));
  }, [savedSolutions]);

  useEffect(() => {
    localStorage.setItem('nebras_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('nebras_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleToggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleSaveSolution = (sol: SolutionData) => {
    setSavedSolutions((prev) => {
      const exists = prev.some((s) => s.id === sol.id || s.extractedQuestion === sol.extractedQuestion);
      if (exists) {
        return prev.filter((s) => s.id !== sol.id && s.extractedQuestion !== sol.extractedQuestion);
      }
      return [sol, ...prev];
    });
  };

  const handleRemoveSolution = (id: string) => {
    setSavedSolutions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSelectSavedSolution = (sol: SolutionData) => {
    setActiveSolutionToView(sol);
    setActiveTab('solver');
  };

  const handleSendDrawingToSolver = (dataUrl: string) => {
    setActiveTab('solver');
    window.dispatchEvent(
      new CustomEvent('nebras_load_drawing', {
        detail: { dataUrl },
      })
    );
  };

  const handleUserLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setIsTrialExpired(false);
    localStorage.setItem('nebras_is_logged_in', 'true');

    if (user.role === 'teacher') {
      setActiveTab('teacher');
    } else if (user.role === 'engineer') {
      setActiveTab('engineer');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('nebras_is_logged_in');
    setTrialSecondsLeft(TOTAL_TRIAL_SECONDS);
    localStorage.setItem('nebras_trial_seconds_left', TOTAL_TRIAL_SECONDS.toString());
    setIsTrialExpired(false);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-150 flex flex-col selection:bg-orange-500/30 selection:text-orange-200 ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedStage={selectedStage}
        setSelectedStage={setSelectedStage}
        selectedCurriculum={selectedCurriculum}
        setSelectedCurriculum={setSelectedCurriculum}
        language={language}
        setLanguage={setLanguage}
        savedCount={savedSolutions.length}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      {/* Timed Trial Countdown Banner */}
      <TrialCountdownBanner
        isLoggedIn={isLoggedIn}
        secondsLeft={trialSecondsLeft}
        totalDurationSeconds={TOTAL_TRIAL_SECONDS}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        darkMode={darkMode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Permission Notice Banner for Student trying to access teacher or engineer features */}
        {currentUser.role === 'student' && (activeTab === 'teacher' || activeTab === 'engineer') && (
          <div className="p-6 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 mb-6 text-center space-y-3">
            <Lock className="w-8 h-8 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold">
              هذه الخدمة مخصصة لحسابات المعلمين والمهندسين فقط
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              أنت مسجل حالياً بحساب طالب. للاستفادة من ميزة رفع المقررات وتوليد الاختبارات أو لوحة الإشراف، قم بتبديل حسابك إلى معلم أو مهندس.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs shadow-md"
            >
              تسجيل الدخول كمعلم أو مهندس الآن
            </button>
          </div>
        )}

        {/* 1. Solver */}
        {activeTab === 'solver' && (
          <QuestionSolver
            selectedStage={selectedStage}
            setSelectedStage={setSelectedStage}
            selectedCurriculum={selectedCurriculum}
            setSelectedCurriculum={setSelectedCurriculum}
            language={language}
            onSaveSolution={handleSaveSolution}
            savedSolutions={savedSolutions}
            initialSolution={activeSolutionToView}
          />
        )}

        {/* 2. Exam Grader */}
        {activeTab === 'grader' && (
          <ExamGrader
            selectedStage={selectedStage}
            language={language}
          />
        )}

        {/* 3. Interactive Quiz */}
        {activeTab === 'quiz' && (
          <InteractiveQuiz
            selectedStage={selectedStage}
            selectedCurriculum={selectedCurriculum}
            language={language}
          />
        )}

        {/* 4. Grapher & Scratchpad */}
        {activeTab === 'grapher' && (
          <MathGrapher onSendDrawingToSolver={handleSendDrawingToSolver} />
        )}

        {/* 5. Student Community */}
        {activeTab === 'community' && (
          <StudentCommunity
            selectedStage={selectedStage}
            currentLanguage={language}
          />
        )}

        {/* 6. Teacher Hub (Course Upload & Exam Generator) */}
        {activeTab === 'teacher' && (currentUser.role === 'teacher' || currentUser.role === 'engineer') && (
          <TeacherHub
            currentUser={currentUser}
            selectedStage={selectedStage}
            darkMode={darkMode}
          />
        )}

        {/* 7. Engineer Dashboard (Super Admin Panel & All Clients) */}
        {activeTab === 'engineer' && currentUser.role === 'engineer' && (
          <EngineerDashboard
            currentUser={currentUser}
            darkMode={darkMode}
          />
        )}

        {/* 8. Saved Solutions */}
        {activeTab === 'saved' && (
          <SavedSolutions
            solutions={savedSolutions}
            onRemoveSolution={handleRemoveSolution}
            onSelectSolution={handleSelectSavedSolution}
          />
        )}
      </main>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleUserLogin}
        darkMode={darkMode}
      />

      {/* Mandatory Trial Expired Lockout Modal (Cannot proceed without login) */}
      <TrialExpiredModal
        isOpen={isTrialExpired && !isLoggedIn}
        onLogin={handleUserLogin}
        darkMode={darkMode}
        trialDurationMinutes={3}
      />

      {/* Trust & Company Branding Footer */}
      <footer
        className={`border-t mt-12 py-8 text-xs transition ${
          darkMode
            ? 'bg-slate-900/80 border-slate-800 text-slate-400'
            : 'bg-white border-slate-200 text-slate-600'
        } no-print`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
            {/* Trust item 1 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <strong className={`block font-bold mb-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  دقة علمية ورياضية بنسبة 100%
                </strong>
                <p className="leading-relaxed">
                  تعتمد المنصة على التحقق بالبراهين الرياضية القطعية والاستناد المباشر إلى النظريات والقوانين المعتمدة عالمياً.
                </p>
              </div>
            </div>

            {/* Trust item 2 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 shrink-0">
                <BookCheck className="w-4 h-4" />
              </div>
              <div>
                <strong className={`block font-bold mb-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  مطابقة المناهج والمعايير الوزارية
                </strong>
                <p className="leading-relaxed">
                  رفع المقررات الرسمية للأساتذة وتوليد نماذج اختبارات متوافقة مع وزارات التعليم العربية والدولية.
                </p>
              </div>
            </div>

            {/* Trust item 3 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <strong className={`block font-bold mb-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  منظومة برمجية متطورة ودعم متواصل
                </strong>
                <p className="leading-relaxed">
                  تطوير ودعم مباشر من المهندس / بشار العجف على مدار الساعة.
                </p>
              </div>
            </div>
          </div>

          {/* Official Company Branding & Support Footer */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <CompanyBrandLogo size="md" darkMode={darkMode} />
            </div>

            {/* Customer Service / Engineer Phone Badge */}
            <div className="flex items-center gap-2 p-2.5 px-4 rounded-2xl bg-orange-500/10 border border-orange-500/30">
              <Phone className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                خدمة العملاء / المهندس:
              </span>
              <a
                href="tel:782487375"
                className="text-orange-600 dark:text-orange-400 font-black text-sm ltr font-mono hover:underline"
              >
                782487375
              </a>
            </div>

            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-center lg:text-right">
              <span>جميع الحقوق محفوظة لـ</span>
              <strong className={darkMode ? 'text-white' : 'text-slate-900'}>
                المهندس / بشار العجف
              </strong>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
