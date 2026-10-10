import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { CompanyBrandLogo } from './CompanyBrandLogo';
import {
  Clock,
  Lock,
  CheckCircle2,
  User,
  Mail,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  LogIn
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TrialExpiredModalProps {
  isOpen: boolean;
  onLogin: (user: UserProfile) => void;
  darkMode: boolean;
  trialDurationMinutes: number;
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
    return { valid: false, reason: 'اسم الحساب في البريد قصير جداً.' };
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

export const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({
  isOpen,
  onLogin,
  darkMode,
  trialDurationMinutes,
}) => {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [institution, setInstitution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitOfficialAuth = (e: React.FormEvent) => {
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
      setError('كلمة المرور يجب أن لا تقل عن 4 خانات لتأمين الحساب الرسمي.');
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

      const loggedUser: UserProfile = {
        id: 'usr-' + Date.now(),
        name: cleanName || (isEngineerDetected ? 'المهندس / بشار العجف' : role === 'teacher' ? 'أ. المعلم' : 'الطالب'),
        email: cleanEmail,
        role: resolvedRole,
        institution: institution.trim() || (isEngineerDetected ? 'مكتب المهندس / بشار العجف البرمجي' : 'المؤسسة التعليمية'),
        stage: 'high',
        createdAt: new Date().toLocaleDateString('ar-SA'),
        avatar: resolvedRole === 'engineer' ? '👨‍💻' : resolvedRole === 'teacher' ? '👨‍🏫' : '🎒',
        status: 'active',
        phone: isEngineerDetected ? '782487375' : undefined,
        isOfficialVerified: true,
        verifiedAt: new Date().toLocaleDateString('ar-SA'),
        solvedCount: isEngineerDetected ? 380 : 0,
      };

      onLogin(loggedUser);
      confetti({ particleCount: 80, spread: 80 });
    } catch (err: any) {
      setError('حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة ثانية.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmailFormatValid = email.trim().length > 3 && validateOfficialEmail(email).valid;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border transition relative space-y-6 ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-white shadow-cyan-500/10'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        {/* Lock & Expiration Icon Badge */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border-2 border-amber-500/40 mx-auto flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-black">
              <Clock className="w-3.5 h-3.5" />
              <span>انتهت فترة التجربة المجانية المؤقتة ({trialDurationMinutes} دقائق)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              تسجيل الدخول بالحساب الرسمي للمتابعة
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              يجب فقط أن يكون البريد الإلكتروني رسمياً ومعتمداً مع كلمة المرور للدخول المباشر دون الحاجة لأي رمز تحقق.
            </p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Official Credentials Form */}
        <form onSubmit={handleSubmitOfficialAuth} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">نوع الحساب:</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  role === 'student' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                <span>🎒</span>
                <span>حساب طالب</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  role === 'teacher' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                <span>👨‍🏫</span>
                <span>حساب معلم</span>
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الاسم الكامل:</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك الكريم..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>

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
              * الشرط الوحيد: أن يكون البريد رسمياً وحقيقياً (يمنع استخدام البريد الوهمي أو المؤقت).
            </p>
          </div>

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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-sm shadow-lg shadow-emerald-500/20 transition transform active:scale-95 flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'جاري التحقق والتفعيل...' : 'تأكيد الحساب الرسمي والمتابعة فوراً'}</span>
          </button>
        </form>

        {/* Company & Support Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <CompanyBrandLogo size="sm" darkMode={darkMode} />
          <div>
            <span>الدعم الفني والتحقق: </span>
            <strong className="text-orange-500 font-mono ltr font-bold">782487375</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
