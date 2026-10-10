import React, { useState } from 'react';
import { SolutionData } from '../types';
import { MathRenderer } from './MathRenderer';
import { Bookmark, Trash2, Search, Printer, CheckCircle2, BookOpen } from 'lucide-react';

interface SavedSolutionsProps {
  solutions: SolutionData[];
  onRemoveSolution: (id: string) => void;
  onSelectSolution: (solution: SolutionData) => void;
}

export const SavedSolutions: React.FC<SavedSolutionsProps> = ({
  solutions,
  onRemoveSolution,
  onSelectSolution,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = solutions.filter(
    (s) =>
      s.extractedQuestion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              سجل المسائل والمحفوظات التعليمية
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              جميع المسائل التي قمت بحلها وحفظها للرجوع إليها ومراجعتها لاحقاً
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في المسائل المحفوظة..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">لا توجد مسائل محفوظة حالياً</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            عند حل أي مسألة في قسم "حل وشرح المسائل"، انقر على زر "حفظ" لتظهر هنا وتتمكن من مراجعتها في أي وقت.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sol) => (
            <div
              key={sol.id}
              className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-3 hover:border-indigo-500/40 transition shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-xs font-bold text-cyan-400">
                    {sol.subject} • {sol.topic}
                  </span>
                  <button
                    onClick={() => sol.id && onRemoveSolution(sol.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                    title="حذف من المحفوظات"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2.5 line-clamp-3 text-sm text-slate-200 font-medium">
                  <MathRenderer content={sol.extractedQuestion} />
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <span className="text-emerald-400 font-bold block mb-0.5">الجواب النهائي:</span>
                  <MathRenderer content={sol.finalAnswer} className="text-emerald-200 font-bold" />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {sol.timestamp ? new Date(sol.timestamp).toLocaleDateString('ar-SA') : 'محفوظ'}
                </span>

                <button
                  onClick={() => onSelectSolution(sol)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition"
                >
                  عرض تفاصيل الحل الكامل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
