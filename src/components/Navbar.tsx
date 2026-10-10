import React, { useState, useRef, useEffect } from 'react';
import { EducationalStage, UserProfile } from '../types';
import { STAGES, CURRICULA } from '../data/curricula';
import { CompanyBrandLogo } from './CompanyBrandLogo';
import { 
  Sparkles, 
  Camera, 
  FileCheck2, 
  HelpCircle, 
  LineChart, 
  Bookmark, 
  Languages, 
  GraduationCap,
  ChevronDown,
  Users,
  Sun,
  Moon,
  BookOpen,
  ShieldAlert,
  LogIn,
  LogOut,
  UserCheck,
  ShieldCheck,
  ExternalLink,
  Settings
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'solver' | 'grader' | 'quiz' | 'grapher' | 'saved' | 'community' | 'teacher' | 'engineer';
  setActiveTab: (tab: 'solver' | 'grader' | 'quiz' | 'grapher' | 'saved' | 'community' | 'teacher' | 'engineer') => void;
  selectedStage: EducationalStage;
  setSelectedStage: (stage: EducationalStage) => void;
  selectedCurriculum: string;
  setSelectedCurriculum: (curriculum: string) => void;
  language: 'ar' | 'en' | 'fr';
  setLanguage: (lang: 'ar' | 'en' | 'fr') => void;
  savedCount: number;
  currentUser: UserProfile;
  onOpenAuthModal: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedStage,
  setSelectedStage,
  selectedCurriculum,
  setSelectedCurriculum,
  language,
  setLanguage,
  savedCount,
  currentUser,
  onOpenAuthModal,
  darkMode,
  onToggleTheme,
  isLoggedIn = false,
  onLogout,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserButtonClick = () => {
    if (!isLoggedIn) {
      onOpenAuthModal();
      return;
    }
    // If user is already logged in, toggle profile menu instead of reopening auth modal
    setIsProfileMenuOpen((prev) => !prev);
  };

  const handleNavigateToUserArea = () => {
    setIsProfileMenuOpen(false);
    if (currentUser.role === 'engineer') {
      setActiveTab('engineer');
    } else if (currentUser.role === 'teacher') {
      setActiveTab('teacher');
    } else {
      setActiveTab('community');
    }
  };

  const inactiveBtnClass = darkMode
    ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
    : 'text-slate-700 hover:bg-slate-200/70 hover:text-slate-950 font-bold';

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-150 border-b backdrop-blur-md ${
        darkMode
          ? 'bg-slate-900/90 border-slate-800 text-white'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-4">
          
          {/* Logo & Company Identity */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setActiveTab('solver')}
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight">نِبْرَاس</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    EduAI
                  </span>
                </div>
                <p className={`text-[11px] hidden sm:block ${darkMode ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>
                  منصة التعلم الذاتي والمقررات
                </p>
              </div>
            </div>

            {/* Sub-divider & Company Brand Stamp */}
            <div className={`hidden xl:flex items-center pl-2 mr-2 border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <CompanyBrandLogo size="sm" darkMode={darkMode} />
            </div>
          </div>

          {/* Quick Curriculum & Stage Selectors */}
          <div
            className={`hidden lg:flex items-center gap-2 p-1.5 rounded-xl border ${
              darkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {/* Stage Selector */}
            <div className="relative group flex items-center">
              <GraduationCap className="w-4 h-4 text-cyan-500 mr-2 ml-1" />
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value as EducationalStage)}
                className="bg-transparent text-xs sm:text-sm font-semibold outline-none cursor-pointer pr-1 py-1"
                title="اختر المرحلة الدراسية"
              >
                {STAGES.map((stg) => (
                  <option key={stg.id} value={stg.id} className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                    {stg.icon} {stg.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={`h-4 w-px mx-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-300'}`} />

            {/* Curriculum Selector */}
            <div className="relative group flex items-center">
              <select
                value={selectedCurriculum}
                onChange={(e) => setSelectedCurriculum(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold outline-none cursor-pointer py-1"
                title="اختر المنهج الدراسي"
              >
                {CURRICULA.map((cur) => (
                  <option key={cur.id} value={cur.id} className={darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                    {cur.country}: {cur.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
            </div>
          </div>

          {/* Right Action Icons: Light/Dark Theme, Language, Profile Role */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Theme Toggle (إضاءة ليلية وعادية) */}
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-xl border transition shadow-sm ${
                darkMode
                  ? 'bg-slate-800/90 border-slate-700 text-amber-300 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
              }`}
              title={darkMode ? 'تفعيل الوضع النهاري (إضاءة عادية)' : 'تفعيل الوضع الليلي'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-800" />}
            </button>

            {/* Language Toggle */}
            <div
              className={`flex items-center gap-1 rounded-xl p-1 border text-xs ${
                darkMode ? 'border-slate-700/60 bg-slate-800/60' : 'border-slate-300 bg-slate-100'
              }`}
            >
              <Languages className="w-3 h-3 text-slate-400 ml-1" />
              <button
                onClick={() => setLanguage('ar')}
                className={`px-1.5 py-0.5 rounded transition ${
                  language === 'ar' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-500'
                }`}
              >
                عربي
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 rounded transition ${
                  language === 'en' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-500'
                }`}
              >
                EN
              </button>
            </div>

            {/* Bookmarks */}
            <button
              onClick={() => setActiveTab('saved')}
              className={`relative p-2 rounded-xl border transition ${
                activeTab === 'saved'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                  : darkMode
                  ? 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-950'
              }`}
              title="المسائل المحفوظة"
            >
              <Bookmark className="w-4 h-4" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {savedCount}
                </span>
              )}
            </button>

            {/* User Account / Role Profile Chip with Dropdown */}
            {!isLoggedIn ? (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md transition transform active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>تسجيل حساب رسمي</span>
              </button>
            ) : (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={handleUserButtonClick}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition text-xs font-bold ${
                    currentUser.role === 'engineer'
                      ? 'bg-orange-500/15 dark:bg-orange-600/20 border-orange-500/50 text-orange-700 dark:text-orange-300 hover:bg-orange-500/25'
                      : currentUser.role === 'teacher'
                      ? 'bg-emerald-500/15 dark:bg-emerald-600/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                      : 'bg-cyan-500/15 dark:bg-cyan-600/20 border-cyan-500/50 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/25'
                  }`}
                  title="حسابك الرسمي المعتمد • انقر لعرض الخيارات أو إدارة الحساب"
                >
                  <span className="text-sm">{currentUser.avatar}</span>
                  <span className="hidden sm:inline truncate max-w-[110px]">{currentUser.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-black/10 dark:bg-black/40 flex items-center gap-1">
                    <span>{currentUser.role === 'engineer' ? 'مهندس' : currentUser.role === 'teacher' ? 'معلم' : 'طالب'}</span>
                    {currentUser.isOfficialVerified && (
                      <span className="text-emerald-500 font-bold" title="حساب رسمي معتمد وموثق">✓ رسمي</span>
                    )}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Options Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className={`absolute left-0 mt-2 w-64 rounded-2xl shadow-2xl border p-2 z-50 animate-fadeIn ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    {/* User Info Header */}
                    <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-lg">
                        {currentUser.avatar}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="font-bold text-xs truncate flex items-center gap-1">
                          <span>{currentUser.name}</span>
                          {currentUser.isOfficialVerified && (
                            <span className="text-emerald-500 font-bold text-[10px]">✓</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                          {currentUser.email}
                        </div>
                      </div>
                    </div>

                    {/* Official Status Badge */}
                    <div className="px-2.5 py-1.5 my-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>حساب رسمي موثق ومفعل</span>
                    </div>

                    {/* Quick Navigation to User Portal */}
                    <button
                      onClick={handleNavigateToUserArea}
                      className="w-full text-right px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        {currentUser.role === 'engineer' ? (
                          <>
                            <ShieldAlert className="w-4 h-4 text-orange-500" />
                            <span>الانتقال للوحة تحكم المهندس</span>
                          </>
                        ) : currentUser.role === 'teacher' ? (
                          <>
                            <BookOpen className="w-4 h-4 text-emerald-500" />
                            <span>الانتقال لبوابة المعلم والمقررات</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4 text-cyan-500" />
                            <span>الانتقال إلى مجتمع الطلاب</span>
                          </>
                        )}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* Switch / Re-verify Account */}
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full text-right px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      <span>تبديل الحساب أو تسجيل حساب آخر</span>
                    </button>

                    {/* Logout Option */}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-right px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج من الحساب</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar with Role Access Control */}
        <div className={`flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none border-t text-xs sm:text-sm ${
          darkMode ? 'border-slate-800/60' : 'border-slate-200'
        }`}>
          {/* 1. Solver */}
          <button
            onClick={() => setActiveTab('solver')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              activeTab === 'solver'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : inactiveBtnClass
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>حل وشرح المسائل</span>
          </button>

          {/* 2. Exam Grader */}
          <button
            onClick={() => setActiveTab('grader')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              activeTab === 'grader'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : inactiveBtnClass
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>المصحح الفوري للاختبارات</span>
          </button>

          {/* 3. Quiz */}
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                : inactiveBtnClass
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>بنك الاختبارات التفاعلي</span>
          </button>

          {/* 4. Grapher */}
          <button
            onClick={() => setActiveTab('grapher')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              activeTab === 'grapher'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                : inactiveBtnClass
            }`}
          >
            <LineChart className="w-4 h-4" />
            <span>المسودة والرسم البياني</span>
          </button>

          {/* 5. Student Community */}
          <button
            onClick={() => setActiveTab('community')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
              activeTab === 'community'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : inactiveBtnClass
            }`}
          >
            <Users className="w-4 h-4" />
            <span>مجتمع الطلاب والتعاون</span>
          </button>

          {/* 6. TEACHER EXCLUSIVE TAB */}
          {(currentUser.role === 'teacher' || currentUser.role === 'engineer') && (
            <button
              onClick={() => setActiveTab('teacher')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === 'teacher'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                  : 'text-emerald-700 dark:text-emerald-300 border border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>بوابة المعلم (رفع المقررات وتوليد الاختبارات)</span>
              <span className="text-[10px] bg-emerald-600 text-white font-black px-1.5 rounded">خاص بالمعلم</span>
            </button>
          )}

          {/* 7. ENGINEER EXCLUSIVE TAB */}
          {currentUser.role === 'engineer' && (
            <button
              onClick={() => setActiveTab('engineer')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === 'engineer'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                  : 'text-orange-800 dark:text-orange-300 border border-orange-500/50 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/50'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>لوحة المهندس والعملاء</span>
              <span className="text-[10px] bg-orange-600 text-white font-black px-1.5 rounded">الإدارة</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
