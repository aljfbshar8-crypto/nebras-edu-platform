import React, { useState } from 'react';
import { UserProfile, UserRole, EducationalStage } from '../types';
import { INITIAL_USERS } from '../data/usersData';
import { CompanyBrandLogo } from './CompanyBrandLogo';
import {
  ShieldAlert,
  Users,
  Search,
  Plus,
  Phone,
  Activity,
  Edit3,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Building2,
  Mail,
  X,
  Lock,
  Save,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EngineerDashboardProps {
  currentUser: UserProfile;
  darkMode: boolean;
}

export const EngineerDashboard: React.FC<EngineerDashboardProps> = ({
  currentUser,
  darkMode,
}) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem('nebras_all_clients');
      return stored ? JSON.parse(stored) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Edit Client Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Server Keep-Alive Health State
  const [serverHealth, setServerHealth] = useState<{ status: string; uptime: number; latency: number } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const checkHealthNow = async () => {
    setIsCheckingHealth(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const latency = Math.round(performance.now() - start);
      const data = await res.json();
      setServerHealth({
        status: data.status || 'ok',
        uptime: data.uptime || 0,
        latency,
      });
    } catch {
      setServerHealth({
        status: 'error',
        uptime: 0,
        latency: 0,
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('student');
  const [newUserStage, setNewUserStage] = useState<EducationalStage>('high');
  const [newUserInstitution, setNewUserInstitution] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.institution && u.institution.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery));
    return matchesRole && matchesSearch;
  });

  // Toggle user status
  const toggleUserStatus = (userId: string) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          status: (u.status === 'active' ? 'suspended' : 'active') as 'active' | 'suspended',
        };
      }
      return u;
    });
    setUsers(updated);
    localStorage.setItem('nebras_all_clients', JSON.stringify(updated));
  };

  // Save edited user
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updated = users.map((u) => (u.id === editingUser.id ? editingUser : u));
    setUsers(updated);
    localStorage.setItem('nebras_all_clients', JSON.stringify(updated));
    setEditingUser(null);
    confetti({ particleCount: 40, spread: 50 });
  };

  // Add new client/user
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const created: UserProfile = {
      id: 'usr-' + Date.now(),
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      stage: newUserStage,
      institution: newUserInstitution.trim() || 'المؤسسة التعليمية',
      phone: newUserPhone.trim() || '782487375',
      createdAt: new Date().toLocaleDateString('ar-SA'),
      avatar: newUserRole === 'engineer' ? '👨‍💻' : newUserRole === 'teacher' ? '👨‍🏫' : '🎒',
      status: 'active',
      solvedCount: 0,
    };

    const updated = [created, ...users];
    setUsers(updated);
    localStorage.setItem('nebras_all_clients', JSON.stringify(updated));
    setIsAddUserModalOpen(false);

    setNewUserName('');
    setNewUserEmail('');
    setNewUserInstitution('');
    setNewUserPhone('');
    confetti({ particleCount: 50, spread: 60 });
  };

  const studentCount = users.filter((u) => u.role === 'student').length;
  const teacherCount = users.filter((u) => u.role === 'teacher').length;
  const engineerCount = users.filter((u) => u.role === 'engineer').length;

  const cardBg = darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const tableBg = darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const headerBg = darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Engineer Super Admin Banner */}
      <div className={`rounded-3xl border-2 p-6 sm:p-8 shadow-xl relative overflow-hidden transition ${
        darkMode
          ? 'bg-gradient-to-br from-orange-950/60 via-slate-900 to-slate-950 border-orange-500/40 text-white'
          : 'bg-gradient-to-br from-orange-50 via-white to-amber-50/50 border-orange-300 text-slate-900'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-bold mb-3">
              <ShieldAlert className="w-4 h-4" />
              <span>لوحة تحكم وإدارة العملاء • كامل الصلاحيات والتحكم</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              إدارة العملاء وتعديل البيانات الأكاديمية
            </h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed max-w-2xl text-slate-600 dark:text-slate-300">
              مرحباً بك {currentUser.name}. تتيح لك هذه اللوحة استعراض جميع العملاء والطلاب والمعلمين، وتعديل بياناتهم الأكاديمية (الاسم، الإيميل، المرحلة، الهاتف، والمؤسسة)، وإدارة الصلاحيات بكفاءة تامة.
            </p>
          </div>

          {/* Company Branding & Customer Service Card */}
          <div className={`border-2 rounded-2xl p-4.5 sm:p-5 shadow-lg w-full lg:w-auto shrink-0 flex flex-col gap-3 ${
            darkMode ? 'bg-slate-950/90 border-orange-500/50' : 'bg-white border-orange-300'
          }`}>
            <CompanyBrandLogo size="md" darkMode={darkMode} />
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-4">
              <span className="text-slate-500 dark:text-slate-400 font-bold">خدمة العملاء والمهندس:</span>
              <a
                href="tel:782487375"
                className="text-orange-600 dark:text-orange-400 font-black text-sm flex items-center gap-1.5 hover:underline ltr font-mono"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>782487375</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border space-y-1 ${cardBg}`}>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي العملاء والمسجلين</span>
          <div className="text-2xl sm:text-3xl font-black">{users.length}</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <Activity className="w-3 h-3" /> نشط في النظام
          </span>
        </div>

        <div className={`p-5 rounded-2xl border space-y-1 ${cardBg}`}>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الطلاب المسجلون</span>
          <div className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400">{studentCount}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">يتعلمون ذاتياً</span>
        </div>

        <div className={`p-5 rounded-2xl border space-y-1 ${cardBg}`}>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">المعلمون والأساتذة</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{teacherCount}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">يرفعون مقررات</span>
        </div>

        <div className={`p-5 rounded-2xl border space-y-1 ${cardBg}`}>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">المهندسون والمدراء</span>
          <div className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400">{engineerCount}</div>
          <span className="text-[11px] text-orange-600 dark:text-orange-300 font-bold">صلاحيات كاملة</span>
        </div>
      </div>

      {/* Server Health, Render Keep-Alive & Infrastructure Diagnostics */}
      <div className={`rounded-3xl border p-6 space-y-4 shadow-xl ${cardBg}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-base font-black">
                مركز صحة الخادم والاستضافة (Render Keep-Alive & API Health)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مراقبة حالة السيرفر، معالجة مشكلة الاستيقاظ التلقائي (Cold Start)، والتحقق من آلية الإبقاء حياً (Ping Loop).
            </p>
          </div>

          <button
            onClick={checkHealthNow}
            disabled={isCheckingHealth}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
          >
            <Activity className={`w-3.5 h-3.5 text-emerald-400 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            <span>{isCheckingHealth ? 'جاري الفحص...' : 'فحص استجابة السيرفر الآن'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold">حالة اتصال الواجهة الخلفية (Backend)</span>
            <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>{serverHealth ? (serverHealth.status === 'ok' ? 'نشط ومتصل 100%' : 'خطأ في الاتصال') : 'متصل ونشط'}</span>
            </div>
            {serverHealth && (
              <span className="text-[10px] text-slate-400 font-mono">
                زمن الاستجابة: {serverHealth.latency} ms • التشغيل: {serverHealth.uptime} ثانية
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold">آلية الإبقاء حياً (Keep-Alive Ping)</span>
            <div className="font-bold text-cyan-400 flex items-center gap-1.5 text-sm">
              <Activity className="w-4 h-4" />
              <span>مفعلة تلقائياً كل 10 دقائق</span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              نقطة النهاية: <code className="text-orange-400">/api/health</code> لمنع سكون Render
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold">مهلة الطلبات (Request Timeout)</span>
            <div className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4" />
              <span>120 ثانية (معدلة ومحمية)</span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              ضغط الصور تلقائياً عبر المتصفح لمنع تجاوز المهلة
            </span>
          </div>
        </div>
      </div>

      {/* All Users / Clients Management Table */}
      <div className={`rounded-3xl border p-6 space-y-5 shadow-xl ${cardBg}`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              <span>قائمة العملاء مع إمكانية تعديل البيانات الأكاديمية</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              يمكنك البحث عن أي عميل بالاسم أو الإيميل، وتعديل درجته الأكاديمية ومؤسسته وصلاحياته
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md whitespace-nowrap transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عميل جديد</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، الإيميل، المرحلة، أو المؤسسة..."
              className="w-full rounded-xl pr-10 pl-4 py-2 text-xs outline-none border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 ml-1 font-bold">تصفية:</span>
            {(['all', 'student', 'teacher', 'engineer'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  roleFilter === r
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {r === 'all' ? 'الكل' : r === 'student' ? 'طلاب' : r === 'teacher' ? 'معلمون' : 'مهندسون'}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className={`overflow-x-auto rounded-2xl border ${tableBg}`}>
          <table className="w-full text-right text-xs">
            <thead className={`font-bold border-b ${headerBg}`}>
              <tr>
                <th className="py-3 px-4">العميل / الاسم</th>
                <th className="py-3 px-4">البريد الإلكتروني</th>
                <th className="py-3 px-4">الدور</th>
                <th className="py-3 px-4">المرحلة / الدرجة الأكاديمية</th>
                <th className="py-3 px-4">المؤسسة / المدرسة</th>
                <th className="py-3 px-4">الهاتف</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">إجراءات المدير</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                  <td className="py-3.5 px-4 font-bold flex items-center gap-2">
                    <span className="text-xl">{user.avatar}</span>
                    <span>{user.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono ltr text-slate-600 dark:text-slate-300">{user.email}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        user.role === 'engineer'
                          ? 'bg-orange-500/10 text-orange-600 dark:text-orange-300 border border-orange-500/30'
                          : user.role === 'teacher'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {user.role === 'engineer' ? 'مهندس' : user.role === 'teacher' ? 'معلم' : 'طالب'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                    {user.stage === 'primary'
                      ? 'الابتدائية'
                      : user.stage === 'middle'
                      ? 'المتوسطة'
                      : user.stage === 'university'
                      ? 'الجامعية'
                      : 'الثانوية'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{user.institution || 'مؤسسة عامة'}</td>
                  <td className="py-3.5 px-4 font-mono ltr text-slate-600 dark:text-slate-400">{user.phone || '782487375'}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        user.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {user.status === 'active' ? '● نشط' : '● موقوف'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingUser(user)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center gap-1 border border-blue-500/30 transition"
                        title="تعديل بيانات العميل الأكاديمية"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>

                      {/* Toggle status */}
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                          user.status === 'active'
                            ? 'bg-rose-600/10 text-rose-600 hover:bg-rose-600/20'
                            : 'bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20'
                        }`}
                      >
                        {user.status === 'active' ? 'تجميد' : 'تفعيل'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: EDIT CLIENT / USER DATA ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border transition animate-fadeIn ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-500" />
                <span>تعديل بيانات العميل أو المستخدم</span>
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-rose-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الاسم الكامل:</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full rounded-xl p-2.5 outline-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full rounded-xl p-2.5 outline-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-blue-500 ltr font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Academic Degree / Stage */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    المرحلة / الدرجة الأكاديمية:
                  </label>
                  <select
                    value={editingUser.stage || 'high'}
                    onChange={(e) => setEditingUser({ ...editingUser, stage: e.target.value as EducationalStage })}
                    className="w-full rounded-xl p-2.5 outline-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-blue-500"
                  >
                    <option value="primary">المرحلة الابتدائية</option>
                    <option value="middle">المرحلة المتوسطة / الإعدادية</option>
                    <option value="high">المرحلة الثانوية</option>
                    <option value="university">المرحلة الجامعية والدراسات العليا</option>
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الدور والصلاحية:</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full rounded-xl p-2.5 outline-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-blue-500"
                  >
                    <option value="student">طالب (خدمات التعلم الذاتي فقط)</option>
                    <option value="teacher">معلم (رفع المقررات وتوليد الاختبارات)</option>
                    <option value="engineer">مهندس (كامل الصلاحيات والإدارة)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المؤسسة / المدرسة:</label>
                  <input
                    type="text"
                    value={editingUser.institution || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, institution: e.target.value })}
                    className="w-full rounded-xl p-2.5 outline-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full rounded-xl p-2.5 outline-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-blue-500 ltr font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">حالة الحساب:</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                  className="w-full rounded-xl p-2.5 outline-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-blue-500"
                >
                  <option value="active">نشط ومفعل</option>
                  <option value="suspended">موقوف ومجمد</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CLIENT ================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border transition animate-fadeIn ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-500" />
                <span>إضافة عميل / حساب جديد</span>
              </h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-rose-500">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="مثال: د. إبراهيم الزبيري"
                  className="w-full rounded-xl p-2.5 outline-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="ibrahim@school.edu"
                  className="w-full rounded-xl p-2.5 outline-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-orange-500 ltr font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الدور والصلاحية:</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full rounded-xl p-2.5 outline-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-orange-500"
                >
                  <option value="student">طالب</option>
                  <option value="teacher">معلم</option>
                  <option value="engineer">مهندس</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المرحلة / الدرجة الأكاديمية:</label>
                <select
                  value={newUserStage}
                  onChange={(e) => setNewUserStage(e.target.value as EducationalStage)}
                  className="w-full rounded-xl p-2.5 outline-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-orange-500"
                >
                  <option value="primary">الابتدائية</option>
                  <option value="middle">المتوسطة</option>
                  <option value="high">الثانوية</option>
                  <option value="university">الجامعية</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المدرسة / المؤسسة:</label>
                <input
                  type="text"
                  value={newUserInstitution}
                  onChange={(e) => setNewUserInstitution(e.target.value)}
                  placeholder="مثال: ثانوية النخبة"
                  className="w-full rounded-xl p-2.5 outline-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="782487375"
                  className="w-full rounded-xl p-2.5 outline-none border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-orange-500 ltr font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold"
                >
                  حفظ وإضافة العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
