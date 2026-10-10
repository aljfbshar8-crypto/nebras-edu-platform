import React, { useState } from 'react';
import { EducationalStage, UserProfile, UserRole } from '../types';
import { CompanyBrandLogo } from './CompanyBrandLogo';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  LogIn, 
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLogin: (user: UserProfile) => void;
  darkMode: boolean;
}

// Function to validate official email (rejects invalid structures and disposable domains)
const validateOfficialEmail = (email: string): { valid: boolean; reason?: string } => {
  const clean = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return { valid: false, reason: 'يرجى إدخال صيغة بريد إلكتروني رسمية وصحيحة (مثال: name@example.com).' };
  }

  const [username, domain] = clean.split('@');
  if (!username || username.length < 2) {
    return { valid: false, reason: 'اسم الحساب في البريد الإلكتروني قصير جداً.' };
  }

  const disposableDomains = [
    'tempmail', '10minutemail', 'mailinator', 'guerrillamail', 'throwawaymail',
    'yopmail', 'trashmail', 'sharklasers', 'dispostable', 'fakeinbox', 'getairmail'
  ];

  if (disposableDomains.some(d => domain.includes(d))) {
    return { valid: false, reason: 'لا يُقبل البريد المؤقت أو الوهمي؛ يجب أن يكون البريد رسمياً ومعتمداً.' };
  }

  return { valid: true };
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  darkMode,
}) => {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [academicDegree, setAcademicDegree] = useState('المرحلة الثانوية');
  const [institution, setInstitution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isEmailFormatValid = email.trim().length > 3 && validateOfficialEmail(email).valid;

  // Direct login / registration via email & password without any OTP code
  const handleSubmitAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    // Check official email requirement
    const emailValidation = validateOfficialEmail(cleanEmail);
    if (!emailValidation.valid) {
      setError(emailValidation.reason || 'يجب أن يكون البريد الإلكتروني رسمياً ومعتمداً.');
      return;
    }

    if (cleanPassword.length < 4) {
      setError('يرجى إدخال كلمة مرور صالحة (4 خانات على الأقل).');
      return;
    }

    setIsSubmitting(true);

    try {
      // Silent Automatic Recognition of the Engineer / Director
      const isEngineerDetected =
        cleanEmail === 'aljfbshar8@gmail.com' ||
        cleanEmail === 'engineer@smartsystems.com' ||
        cleanEmail.includes('engineer') ||
        cleanEmail.includes('admin') ||
        cleanEmail.includes('782487375') ||
        cleanName.includes('بشار') ||
        cleanName.includes('العجف') ||
        cleanName.includes('المهندس') ||
        cleanName.startsWith('م.');

      const resolvedRole: UserRole = isEngineerDetected ? 'engineer' : role;

      const officialUser: UserProfile = {
        id: 'usr-' + Date.now(),
        name: cleanName || (isEngineerDetected ? 'المهندس / بشار العجف' : role === 'teacher' ? 'أ. المعلم' : 'طالب المنصة'),
        email: cleanEmail,
        role: resolvedRole,
        institution: institution.trim() || (isEngineerDetected ? 'مكتب المهندس / بشار العجف البرمجي' : 'المؤسسة التعليمية'),
        stage: (academicDegree === 'المرحلة الابتدائية' ? 'primary' : academicDegree === 'المرحلة المتوسطة' ? 'middle' : 'high') as EducationalStage,
        createdAt: new Date().toLocaleDateString('ar-SA'),
        avatar: resolvedRole === 'engineer' ? '👨‍💻' : resolvedRole === 'teacher' ? '👨‍🏫' : '🎒',
        status: 'active',
        phone: isEngineerDetected ? '782487375' : undefined,
        isOfficialVerified: true,
        verifiedAt: new Date().toLocaleDateString('ar-SA'),
        solvedCount: isEngineerDetected ? 380 : 0,
      };

      onLogin(officialUser);
      confetti({ particleCount: 75, spread: 75 });
      onClose();
    } catch (err: any) {
      setError('تعذر تسجيل الدخول، يرجى التحقق من البيانات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border transition relative ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-white shadow-cyan-500/10'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Company Header */}
        <div className="text-center space-y-2 mb-5">
          <div className="flex justify-center">
            <CompanyBrandLogo size="md" darkMode={darkMode} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-black">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>تسجيل مباشر - يشترط فقط بريد رسمي</span>
          </div>
          <h2 className="text-lg font-black tracking-tight">
            تسجيل الدخول / إنشاء الحساب
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            يجب فقط أن يكون الإيميل رسمياً مع كلمة المرور للدخول المباشر، دون الحاجة لأي رمز تحقق.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 mb-4 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Official Credentials Form */}
        <form onSubmit={handleSubmitAuth} className="space-y-3.5 text-xs">
          {/* Role Selector Tabs */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              نوع الحساب:
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  role === 'student'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🎒</span>
                <span>حساب طالب</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  role === 'teacher'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>👨‍🏫</span>
                <span>حساب معلم</span>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              الاسم الكامل:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'teacher' ? 'أ. أحمد المحمدي' : 'سارة خالد'}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                البريد الإلكتروني الرسمي المعتمد:
              </label>
              {isEmailFormatValid && (
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  بريد رسمي مقبول
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-white outline-none focus:border-cyan-500 ltr font-mono"
                required
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              * الشرط الوحيد: أن يكون الإيميل رسمياً ومعتمداً (يُمنع استخدام البريد المؤقت أو الوهمي).
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              كلمة المرور:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pr-9 pl-10 py-2.5 text-slate-900 dark:text-white outline-none focus:border-cyan-500 ltr font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Academic Stage & Institution */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المرحلة:</label>
              <div className="relative">
                <select
                  value={academicDegree}
                  onChange={(e) => setAcademicDegree(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500 text-xs"
                >
                  <option value="المرحلة الابتدائية">الابتدائية</option>
                  <option value="المرحلة المتوسطة">المتوسطة</option>
                  <option value="المرحلة الثانوية">الثانوية</option>
                  <option value="المرحلة الجامعية">الجامعية</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المؤسسة:</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="اسم المدرسة/الجامعة"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/20 transition transform active:scale-95 flex items-center justify-center gap-2 mt-3 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول / إنشاء الحساب مباشرة'}</span>
          </button>
        </form>

        {/* Footer Support Notice */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-center text-slate-500 dark:text-slate-400">
          <span>خدمة العملاء والدعم الفني: </span>
          <strong className="text-orange-500 font-mono ltr font-bold">782487375</strong>
        </div>
      </div>
    </div>
  );
};
