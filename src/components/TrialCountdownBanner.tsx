import React from 'react';
import { Timer, Lock, LogIn, Sparkles, CheckCircle2 } from 'lucide-react';

interface TrialCountdownBannerProps {
  isLoggedIn: boolean;
  secondsLeft: number;
  totalDurationSeconds: number;
  onOpenLogin: () => void;
  darkMode: boolean;
}

export const TrialCountdownBanner: React.FC<TrialCountdownBannerProps> = ({
  isLoggedIn,
  secondsLeft,
  totalDurationSeconds,
  onOpenLogin,
  darkMode,
}) => {
  if (isLoggedIn) {
    return null;
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const percentage = Math.max(0, Math.min(100, (secondsLeft / totalDurationSeconds) * 100));
  const isUrgent = secondsLeft <= 60;

  return (
    <div
      className={`border-b transition-colors relative z-30 px-4 py-2.5 shadow-sm ${
        isUrgent
          ? 'bg-gradient-to-r from-rose-950/80 via-amber-950/70 to-slate-900 border-rose-500/40 text-rose-200'
          : darkMode
          ? 'bg-slate-900/90 border-slate-800 text-slate-200'
          : 'bg-amber-50 border-amber-200 text-amber-950'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              isUrgent
                ? 'bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/40'
                : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
            }`}
          >
            <Timer className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xs sm:text-sm">
                وضع التجربة المجانية المؤقتة:
              </span>
              <span
                className={`font-black font-mono px-2 py-0.5 rounded-lg border text-xs sm:text-sm ${
                  isUrgent
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}
              >
                {formattedTime} متبقية
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              لا يمكن الاستمرار إلا بحساب رسمي موثق؛ عند انتهاء الوقت سيطلب منك تأكيد البريد وكلمة المرور.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Mini progress line on desktop */}
          <div className="hidden md:block w-28 bg-black/20 dark:bg-slate-950 h-2 rounded-full overflow-hidden border border-black/10 dark:border-slate-800">
            <div
              className={`h-full transition-all duration-1000 ${
                isUrgent ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-emerald-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition transform active:scale-95 whitespace-nowrap"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>توثيق حساب رسمي للمتابعة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
