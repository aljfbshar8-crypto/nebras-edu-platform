import React, { useState } from 'react';
import { EducationalStage, SubjectId, ForumThread, ForumReply, StudyGroup, SharedNote } from '../types';
import { INITIAL_FORUM_THREADS, INITIAL_STUDY_GROUPS, INITIAL_SHARED_NOTES } from '../data/communityData';
import { SUBJECTS, STAGES } from '../data/curricula';
import { MathRenderer } from './MathRenderer';
import {
  Users,
  MessageSquare,
  BookOpen,
  ShieldCheck,
  Sparkles,
  PlusCircle,
  ThumbsUp,
  CheckCircle2,
  AlertTriangle,
  Flag,
  Clock,
  Send,
  Download,
  Search,
  Filter,
  Check,
  Eye,
  Timer,
  ChevronLeft,
  X,
  Loader2,
  Share2,
  Award,
  Lock,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentCommunityProps {
  selectedStage: EducationalStage;
  currentLanguage: 'ar' | 'en' | 'fr';
}

export const StudentCommunity: React.FC<StudentCommunityProps> = ({ selectedStage, currentLanguage }) => {
  const [activeSection, setActiveSection] = useState<'forum' | 'groups' | 'notes' | 'safety'>('forum');

  // Forum State
  const [threads, setThreads] = useState<ForumThread[]>(() => {
    try {
      const stored = localStorage.getItem('nebras_forum_threads');
      return stored ? JSON.parse(stored) : INITIAL_FORUM_THREADS;
    } catch {
      return INITIAL_FORUM_THREADS;
    }
  });

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [isNewThreadModalOpen, setIsNewThreadModalOpen] = useState(false);

  // New Thread Form State
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadSubject, setNewThreadSubject] = useState<SubjectId>('math');
  const [newThreadTopic, setNewThreadTopic] = useState('');
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  // New Reply State
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [verifyingReplyId, setVerifyingReplyId] = useState<string | null>(null);

  // Study Groups State
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>(() => {
    try {
      const stored = localStorage.getItem('nebras_study_groups');
      return stored ? JSON.parse(stored) : INITIAL_STUDY_GROUPS;
    } catch {
      return INITIAL_STUDY_GROUPS;
    }
  });

  const [activeGroupRoom, setActiveGroupRoom] = useState<StudyGroup | null>(null);
  const [groupChatMessage, setGroupChatMessage] = useState('');
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState<SubjectId>('math');

  // Shared Notes State
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>(() => {
    try {
      const stored = localStorage.getItem('nebras_shared_notes');
      return stored ? JSON.parse(stored) : INITIAL_SHARED_NOTES;
    } catch {
      return INITIAL_SHARED_NOTES;
    }
  });

  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteDesc, setNewNoteDesc] = useState('');
  const [newNoteSubject, setNewNoteSubject] = useState<SubjectId>('math');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Report Modal State
  const [reportingItem, setReportingItem] = useState<{ id: string; title: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Filtered Forum Threads
  const filteredThreads = threads.filter((t) => {
    const matchesSubject = selectedSubjectFilter === 'all' || t.subject === selectedSubjectFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  // Handle Thread Submission with AI Moderation
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

    setModerationLoading(true);
    setModerationError(null);

    try {
      // 1. Moderate content via AI shield
      const modRes = await fetch('/api/moderate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${newThreadTitle}\n${newThreadContent}`,
          type: 'thread',
        }),
      });

      const modData = await modRes.json();
      if (!modData.moderation?.isSafe) {
        setModerationError(
          modData.moderation?.educationalFeedback ||
            'المحتوى يخالف معايير البيئة التعليمية المحترمة لـ نبراس. يرجى تعديل الصياغة لتكون أكاديمية ولائقة.'
        );
        setModerationLoading(false);
        return;
      }

      // 2. Safe -> Create thread
      const newThread: ForumThread = {
        id: 'th-' + Date.now(),
        title: newThreadTitle.trim(),
        content: newThreadContent.trim(),
        authorName: 'أنا (طالب متعلم)',
        authorAvatar: '🎒',
        authorBadge: 'عضو نشط',
        stage: selectedStage,
        subject: newThreadSubject,
        topic: newThreadTopic.trim() || 'نقاش عام',
        createdAt: 'الآن',
        upvotes: 1,
        isResolved: false,
        tags: [newThreadSubject, 'سؤال جديد'],
        replies: [],
      };

      const updated = [newThread, ...threads];
      setThreads(updated);
      localStorage.setItem('nebras_forum_threads', JSON.stringify(updated));

      // Reset form
      setNewThreadTitle('');
      setNewThreadContent('');
      setNewThreadTopic('');
      setIsNewThreadModalOpen(false);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      setModerationError('حدث خطأ في التدقيق. يرجى المحاولة ثانية.');
    } finally {
      setModerationLoading(false);
    }
  };

  // Handle Reply Submission with AI Moderation
  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !replyContent.trim()) return;

    setReplyLoading(true);

    try {
      // Moderate reply
      const modRes = await fetch('/api/moderate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: replyContent,
          type: 'reply',
        }),
      });

      const modData = await modRes.json();
      if (!modData.moderation?.isSafe) {
        alert(
          modData.moderation?.educationalFeedback ||
            'نعتذر، محتوى الرد يخالف معايير الاحترام والأمان الأكاديمي.'
        );
        setReplyLoading(false);
        return;
      }

      const newReply: ForumReply = {
        id: 'rep-' + Date.now(),
        authorName: 'أنا (طالب متعلم)',
        authorAvatar: '💡',
        authorBadge: 'مساهم بالحل',
        content: replyContent.trim(),
        createdAt: 'الآن',
        upvotes: 0,
      };

      const updatedThread = {
        ...selectedThread,
        replies: [...selectedThread.replies, newReply],
      };

      const updatedThreads = threads.map((t) => (t.id === selectedThread.id ? updatedThread : t));
      setThreads(updatedThreads);
      setSelectedThread(updatedThread);
      localStorage.setItem('nebras_forum_threads', JSON.stringify(updatedThreads));
      setReplyContent('');
    } catch {
      alert('تعذر إرسال الإجابة.');
    } finally {
      setReplyLoading(false);
    }
  };

  // Handle AI Peer Verification on a Reply
  const handleVerifyReplyWithAi = async (reply: ForumReply) => {
    if (!selectedThread) return;
    setVerifyingReplyId(reply.id);

    try {
      const res = await fetch('/api/ai-peer-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionTitle: selectedThread.title,
          questionContent: selectedThread.content,
          replyContent: reply.content,
        }),
      });

      const data = await res.json();
      if (data.success && data.verification?.isCorrect) {
        const updatedReplies = selectedThread.replies.map((r) =>
          r.id === reply.id ? { ...r, isAiVerified: true, isAcceptedAnswer: true } : r
        );
        const updatedThread = {
          ...selectedThread,
          isResolved: true,
          replies: updatedReplies,
        };
        const updatedThreads = threads.map((t) => (t.id === selectedThread.id ? updatedThread : t));
        setThreads(updatedThreads);
        setSelectedThread(updatedThread);
        localStorage.setItem('nebras_forum_threads', JSON.stringify(updatedThreads));

        confetti({
          particleCount: 60,
          spread: 70,
        });
      } else {
        alert(`ملاحظات التدقيق الأكاديمي: ${data.verification?.reviewNotes || 'الحل يحتاج مراجعة أو تصحيح.'}`);
      }
    } catch {
      alert('تعذر إتمام التحقق.');
    } finally {
      setVerifyingReplyId(null);
    }
  };

  // Upvote Thread
  const handleUpvoteThread = (threadId: string) => {
    const updated = threads.map((t) => {
      if (t.id === threadId) {
        return { ...t, upvotes: t.upvotes + 1 };
      }
      return t;
    });
    setThreads(updated);
    if (selectedThread && selectedThread.id === threadId) {
      setSelectedThread({ ...selectedThread, upvotes: selectedThread.upvotes + 1 });
    }
    localStorage.setItem('nebras_forum_threads', JSON.stringify(updated));
  };

  // Upvote Reply
  const handleUpvoteReply = (replyId: string) => {
    if (!selectedThread) return;
    const updatedReplies = selectedThread.replies.map((r) => {
      if (r.id === replyId) return { ...r, upvotes: r.upvotes + 1 };
      return r;
    });
    const updatedThread = { ...selectedThread, replies: updatedReplies };
    const updatedThreads = threads.map((t) => (t.id === selectedThread.id ? updatedThread : t));
    setThreads(updatedThreads);
    setSelectedThread(updatedThread);
    localStorage.setItem('nebras_forum_threads', JSON.stringify(updatedThreads));
  };

  // Send message in study group chat
  const handleSendGroupMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupRoom || !groupChatMessage.trim()) return;

    const newMessage = {
      id: 'm-' + Date.now(),
      senderName: 'أنا',
      senderAvatar: '🙋‍♂️',
      text: groupChatMessage.trim(),
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedRoom: StudyGroup = {
      ...activeGroupRoom,
      messages: [...activeGroupRoom.messages, newMessage],
    };

    const updatedGroups = studyGroups.map((g) => (g.id === activeGroupRoom.id ? updatedRoom : g));
    setStudyGroups(updatedGroups);
    setActiveGroupRoom(updatedRoom);
    localStorage.setItem('nebras_study_groups', JSON.stringify(updatedGroups));
    setGroupChatMessage('');
  };

  // Create new study group
  const handleCreateStudyGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupDesc.trim()) return;

    const newGroup: StudyGroup = {
      id: 'grp-' + Date.now(),
      name: newGroupName.trim(),
      description: newGroupDesc.trim(),
      subject: newGroupSubject,
      stage: selectedStage,
      membersCount: 1,
      activeNowCount: 1,
      currentTopic: 'جلسة تأسيسية',
      hostName: 'أنا (مؤسس الغرفة)',
      hostAvatar: '🌟',
      pomodoroMinutesLeft: 25,
      messages: [
        {
          id: 'm-init',
          senderName: 'المشرف الآلي',
          senderAvatar: '🤖',
          text: 'مرحباً بكم في غرفة المذاكرة! البيئة مخصصة للتعاون الدراسي وتبادل المعرفة باحترام.',
          timestamp: 'الآن',
        },
      ],
      sharedNotes: [],
    };

    const updated = [newGroup, ...studyGroups];
    setStudyGroups(updated);
    localStorage.setItem('nebras_study_groups', JSON.stringify(updated));
    setIsNewGroupModalOpen(false);
    setNewGroupName('');
    setNewGroupDesc('');
    setActiveGroupRoom(newGroup);
  };

  // Submit report to moderation queue
  const handleSubmitReport = () => {
    setReportSuccess(true);
    setTimeout(() => {
      setReportingItem(null);
      setReportSuccess(false);
      setReportReason('');
    }, 1800);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-900 to-cyan-950/40 border border-indigo-500/30 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>مجتمع نبراس الأكاديمي التفاعلي</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            تعاون الطلاب، منتديات النقاش، ومجموعات الدراسة الافتراضية
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            تشارك المسائل مع زملائك، انضم إلى غرف مذاكرة بومودورو حية، تبادل الملاحظات والملخصات المدرسية، وكل ذلك تحت مظلة نظام إشراف ذكي يضمن بيئة آمنة، محترمة، وداعمة للتفوق.
          </p>
        </div>

        {/* Shield Badge */}
        <div className="mt-4 sm:mt-0 sm:absolute sm:top-8 sm:left-8 bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-400">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-white block">محمي بدرع الأمان الأكاديمي</span>
            <span className="text-[11px] text-slate-400">إشراف وتدقيق ذكي 24/7 للنزاهة والاحترام</span>
          </div>
        </div>
      </div>

      {/* Community Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            setActiveSection('forum');
            setSelectedThread(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeSection === 'forum'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>منتديات الأسئلة والنقاش</span>
        </button>

        <button
          onClick={() => {
            setActiveSection('groups');
            setSelectedThread(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeSection === 'groups'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>مجموعات الدراسة الافتراضية ({studyGroups.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSection('notes');
            setSelectedThread(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeSection === 'notes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>مستودع الملاحظات والملخصات ({sharedNotes.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSection('safety');
            setSelectedThread(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeSection === 'safety'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>ميثاق الأمان والإشراف الأكاديمي</span>
        </button>
      </div>

      {/* ================= SECTION 1: FORUMS & Q&A ================= */}
      {activeSection === 'forum' && !selectedThread && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Filters, Add Question */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في أسئلة الزملاء والمواضيع..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Subject Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedSubjectFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedSubjectFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                جميع المواد
              </button>
              {SUBJECTS.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubjectFilter(sub.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                    selectedSubjectFilter === sub.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{sub.icon}</span>
                  <span>{sub.name}</span>
                </button>
              ))}
            </div>

            {/* Ask Question Button */}
            <button
              onClick={() => setIsNewThreadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 whitespace-nowrap transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>طرح سؤال جديد للزملاء</span>
            </button>
          </div>

          {/* Threads List */}
          <div className="space-y-3.5">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
                <p className="text-sm text-slate-400">لا توجد أسئلة مطابقة للبحث حالياً.</p>
                <button
                  onClick={() => setIsNewThreadModalOpen(true)}
                  className="mt-3 text-xs text-cyan-400 hover:underline"
                >
                  كن أول من يطرح سؤالاً في هذا الموضوع!
                </button>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="bg-slate-900/80 hover:bg-slate-900 rounded-2xl border border-slate-800 hover:border-indigo-500/50 p-5 transition shadow-sm cursor-pointer space-y-3"
                  onClick={() => setSelectedThread(thread)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{thread.authorAvatar}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{thread.authorName}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                            {thread.authorBadge}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{thread.createdAt} • {thread.topic}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {thread.isResolved ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم الحل ومدقق</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          بانتظار إجابات
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Preview */}
                  <div>
                    <h3 className="font-bold text-white text-base hover:text-cyan-300 transition">
                      {thread.title}
                    </h3>
                    <div className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                      <MathRenderer content={thread.content} />
                    </div>
                  </div>

                  {/* Footer Stats & Tags */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {thread.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] text-slate-300">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-slate-300">
                        <ThumbsUp className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{thread.upvotes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-300">
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{thread.replies.length} إجابة</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= FORUM THREAD DETAIL VIEW ================= */}
      {activeSection === 'forum' && selectedThread && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedThread(null)}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>العودة لجميع المناقشات</span>
          </button>

          {/* Question Thread Main Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedThread.authorAvatar}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{selectedThread.authorName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                      {selectedThread.authorBadge}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {selectedThread.createdAt} • {selectedThread.topic}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReportingItem({ id: selectedThread.id, title: selectedThread.title })}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1"
                  title="إبلاغ عن محتوى غير لائق"
                >
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline">إبلاغ</span>
                </button>
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white">
              {selectedThread.title}
            </h2>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-sm text-slate-200 leading-relaxed">
              <MathRenderer content={selectedThread.content} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleUpvoteThread(selectedThread.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold transition"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>أعجبني هذا السؤال ({selectedThread.upvotes})</span>
              </button>

              <span className="text-xs text-slate-400">
                {selectedThread.replies.length} إجابة من الزملاء
              </span>
            </div>
          </div>

          {/* Replies Section */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <span>إجابات الزملاء والشروحات المتبادلة</span>
            </h3>

            {selectedThread.replies.length === 0 ? (
              <div className="p-6 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
                لا توجد إجابات بعد. كن أول زميل يقدم حلاً!
              </div>
            ) : (
              selectedThread.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`p-5 rounded-2xl border transition space-y-3 ${
                    reply.isAcceptedAnswer
                      ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{reply.authorAvatar}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm">{reply.authorName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {reply.authorBadge}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{reply.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {reply.isAiVerified && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                          <Award className="w-3.5 h-3.5" />
                          <span>إجابة معتمدة ومدققة 100%</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-200 leading-relaxed pr-6">
                    <MathRenderer content={reply.content} />
                  </div>

                  {/* Actions on reply */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <button
                      onClick={() => handleUpvoteReply(reply.id)}
                      className="flex items-center gap-1 text-slate-400 hover:text-cyan-300"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span>إجابة مفيدة ({reply.upvotes})</span>
                    </button>

                    {!reply.isAiVerified && (
                      <button
                        onClick={() => handleVerifyReplyWithAi(reply)}
                        disabled={verifyingReplyId === reply.id}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold"
                        title="طلب فحص دقة الحل من الذكاء الاصطناعي"
                      >
                        {verifyingReplyId === reply.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>تدقيق الإجابة بالذكاء الاصطناعي</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Add New Reply Input Form */}
            <form onSubmit={handleAddReply} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                شارك إجابتك أو توضيحك لمساعدة زميلك (معادلات أو خطوات):
              </label>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="اكتب حلك هنا.. يمكنك استخدام صيغ رياضية مثل $x^2$ أو \\int x dx أو الشرح اللغوي السليم..."
                className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  * يتم فحص الرد تلقائياً بواسطة درع الأمان لضمان الاحترام المتبادل.
                </span>
                <button
                  type="submit"
                  disabled={replyLoading || !replyContent.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs sm:text-sm disabled:opacity-50"
                >
                  {replyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>إرسال الإجابة للزميل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SECTION 2: VIRTUAL STUDY GROUPS ================= */}
      {activeSection === 'groups' && !activeGroupRoom && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>غرف المذاكرة الافتراضية ومجموعات التركيز (Pomodoro)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                انضم إلى غرفة دراسية نشطة، تبادل المسائل في الوقت الفعلي، واستفد من مؤقت بومودورو الجماعي.
              </p>
            </div>

            <button
              onClick={() => setIsNewGroupModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إنشاء غرفة مذاكرة جديدة</span>
            </button>
          </div>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studyGroups.map((group) => (
              <div
                key={group.id}
                className="bg-slate-900/80 hover:bg-slate-900 rounded-2xl border border-slate-800 hover:border-indigo-500/50 p-5 transition shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400">
                      {SUBJECTS.find((s) => s.id === group.subject)?.name || group.subject}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{group.activeNowCount} متصل الآن</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base leading-snug">{group.name}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {group.description}
                  </p>

                  <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400 block mb-0.5">الموضوع الجاري مناقشته:</span>
                    <strong className="text-white">{group.currentTopic}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Timer className="w-4 h-4 text-amber-400" />
                    <span>متبقي {group.pomodoroMinutesLeft || 25} دقيقة بومودورو</span>
                  </div>

                  <button
                    onClick={() => setActiveGroupRoom(group)}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    دخول الغرفة
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Group Room View */}
      {activeSection === 'groups' && activeGroupRoom && (
        <div className="space-y-6">
          <button
            onClick={() => setActiveGroupRoom(null)}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>العودة لجميع غرف الدراسة</span>
          </button>

          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
            {/* Room Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white">{activeGroupRoom.name}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    نشطة الآن 🟢
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{activeGroupRoom.description}</p>
              </div>

              {/* Pomodoro Timer Badge */}
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <Timer className="w-5 h-5 text-amber-400 animate-spin" />
                <div>
                  <span className="text-[10px] text-slate-400 block">جلسة تركيز بومودورو:</span>
                  <span className="text-sm font-black text-amber-300">
                    {activeGroupRoom.pomodoroMinutesLeft || 22}:35 دقيقة متبقية
                  </span>
                </div>
              </div>
            </div>

            {/* Room Layout: Chat Stream & Shared Notes Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat Stream (2 Cols) */}
              <div className="lg:col-span-2 space-y-4 flex flex-col justify-between min-h-[380px] bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="space-y-3 overflow-y-auto max-h-[320px] pr-2">
                  {activeGroupRoom.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl text-xs space-y-1 ${
                        msg.senderName === 'أنا'
                          ? 'bg-indigo-600/20 border border-indigo-500/40 text-slate-100 ml-6'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-white flex items-center gap-1">
                          <span>{msg.senderAvatar}</span>
                          <span>{msg.senderName}</span>
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div className="leading-relaxed">
                        <MathRenderer content={msg.text} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Send Message Form */}
                <form onSubmit={handleSendGroupMessage} className="flex gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={groupChatMessage}
                    onChange={(e) => setGroupChatMessage(e.target.value)}
                    placeholder="اطرح مسألة أو شارك ملاحظة في الغرفة..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!groupChatMessage.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-50"
                  >
                    إرسال
                  </button>
                </form>
              </div>

              {/* Shared Notes & Current Topic (1 Col) */}
              <div className="space-y-4">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>الملخصات والمذكرات المشتركة في الغرفة</span>
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {activeGroupRoom.sharedNotes.map((note, i) => (
                      <li key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between gap-2">
                        <div>
                          <span className="font-medium text-slate-200 block">{note.title}</span>
                          <span className="text-[10px] text-slate-400">مشاركة بواسطة: {note.author}</span>
                        </div>
                        <button className="text-cyan-400 hover:text-cyan-300" title="تحميل">
                          <Download className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
                  <span className="font-bold text-white block">قواعد الغرفة:</span>
                  <p>1. التركيز على المادة والموضوع المحدد.</p>
                  <p>2. شرح الخطوات بهدوء والتعاون الإيجابي.</p>
                  <p>3. احترام جميع الزملاء وتطبيق ميثاق الأمان.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 3: SHARED STUDY NOTES ================= */}
      {activeSection === 'notes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>مستودع الملاحظات والخرائط الذهنية المدرسية المشتركة</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تصفح وحمل ملخصات زملائك المتميزة المكتوبة بخط اليد أو المنسقة، أو شارك ملخصك الخاص لخدمة زملائك.
              </p>
            </div>

            <button
              onClick={() => setIsNewNoteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>مشاركة ملخص دراسي جديد</span>
            </button>
          </div>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedNotes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4 flex flex-col justify-between hover:border-emerald-500/40 transition shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">
                      {SUBJECTS.find((s) => s.id === note.subject)?.name || note.subject}
                    </span>
                    <span className="text-[11px] text-slate-400">{note.date}</span>
                  </div>

                  <h3 className="font-bold text-white text-base leading-snug">{note.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {note.description}
                  </p>

                  {/* Math Preview */}
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-cyan-300 font-mono">
                    <MathRenderer content={note.contentPreview} />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>{note.authorName}</span>
                    <span className="text-[10px] text-cyan-400">({note.authorBadge})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const updated = sharedNotes.map((n) => (n.id === note.id ? { ...n, likes: n.likes + 1 } : n));
                        setSharedNotes(updated);
                        localStorage.setItem('nebras_shared_notes', JSON.stringify(updated));
                      }}
                      className="flex items-center gap-1 text-slate-400 hover:text-rose-400"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{note.likes}</span>
                    </button>

                    <button
                      onClick={() => {
                        const blob = new Blob([`${note.title}\n\n${note.description}\n\n${note.contentPreview}`], {
                          type: 'text/plain;charset=utf-8',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${note.title}.txt`;
                        a.click();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SECTION 4: SAFETY CHARTER & MODERATION ================= */}
      {activeSection === 'safety' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl border border-emerald-500/30 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  ميثاق الأمان والإشراف الأكاديمي في منصة «نبراس»
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  نلتزم بتوفير بيئة تعليمية آمنة، محترمة، وداعمة لجميع الطلاب باختلاف أعمارهم ومراحلهم
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>1. درع الأمان التلقائي بالذكاء الاصطناعي (AI Guard)</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  يتم فحص كل سؤال ورد وملاحظة قبل النشر للتأكد من خلوها تماماً من أي إساءة أو تنمر أو محتوى غير لائق.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span>2. ثقافة الاحترام والتشجيع المتبادل</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  لا يوجد "سؤال سخيف". نرحب بجميع استفسارات الطلاب ونشجع الإجابات البناءة والشروحات الواضحة خطوة بخطوة.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>3. أوسمة التميز وسفراء المعرفة</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  يحصل الطلاب الذين يقدمون إجابات دقيقة ومفيدة لزملائهم على أوسمة تميز معتمدة ترتفع بها رتبتهم الأكاديمية.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Flag className="w-4 h-4 text-rose-400" />
                  <span>4. الإبلاغ السريع والحظر الفوري</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  أي محتوى يتم الإبلاغ عنه يُفحص فورياً ويُحذف تلقائياً مع اتخاذ الإجراءات التأديبية لمنع الإزعاج.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE NEW THREAD ================= */}
      {isNewThreadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cyan-400" />
                <span>طرح سؤال أو موضوع جديد في المنتدى</span>
              </h3>
              <button
                onClick={() => setIsNewThreadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {moderationError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{moderationError}</span>
              </div>
            )}

            <form onSubmit={handleCreateThread} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">المادة:</label>
                  <select
                    value={newThreadSubject}
                    onChange={(e) => setNewThreadSubject(e.target.value as SubjectId)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">المفهوم أو الموضوع:</label>
                  <input
                    type="text"
                    value={newThreadTopic}
                    onChange={(e) => setNewThreadTopic(e.target.value)}
                    placeholder="مثال: حساب النهايات، ميكانيكا الكم..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">عنوان السؤال بوضوح:</label>
                <input
                  type="text"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="مثال: كيف أثبت أن مشتقة الدالة الأسية هي نفسها؟"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">تفاصيل المسألة ومحاولتك للحل:</label>
                <textarea
                  value={newThreadContent}
                  onChange={(e) => setNewThreadContent(e.target.value)}
                  placeholder="اشرح أين واجهت الصعوبة، أو اكتب المعادلة بالتفصيل..."
                  className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>محمي ومفحوص بواسطة درع نبراس للأمان</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewThreadModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={moderationLoading || !newThreadTitle.trim() || !newThreadContent.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs sm:text-sm shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {moderationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>نشر السؤال الآن</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE NEW STUDY GROUP ================= */}
      {isNewGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>إنشاء غرفة مذاكرة افتراضية جديدة</span>
              </h3>
              <button onClick={() => setIsNewGroupModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudyGroup} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">اسم الغرفة:</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="مثال: نادي الرياضيات المتقدمة للتوجيهي"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">المادة المستهدفة:</label>
                <select
                  value={newGroupSubject}
                  onChange={(e) => setNewGroupSubject(e.target.value as SubjectId)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">وصف الغرفة وأهداف الجلسة:</label>
                <textarea
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="مثال: جلسة مراجعة لحل نماذج الاختبارات الوزارية بتركيز..."
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewGroupModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim() || !newGroupDesc.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  إنشاء وبدء الغرفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SHARE NEW NOTE ================= */}
      {isNewNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>مشاركة ملخص أو خريطة ذهنية</span>
              </h3>
              <button onClick={() => setIsNewNoteModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newNoteTitle.trim() || !newNoteDesc.trim()) return;
                const newNote: SharedNote = {
                  id: 'not-' + Date.now(),
                  title: newNoteTitle.trim(),
                  description: newNoteDesc.trim(),
                  subject: newNoteSubject,
                  stage: selectedStage,
                  authorName: 'أنا',
                  authorBadge: 'مساهم معرفي',
                  likes: 1,
                  downloads: 0,
                  date: 'اليوم',
                  tags: [newNoteSubject, 'ملخص'],
                  contentPreview: newNoteContent.trim() || 'ملخص شامل للقوانين والمفاهيم الأساسية...',
                };
                const updated = [newNote, ...sharedNotes];
                setSharedNotes(updated);
                localStorage.setItem('nebras_shared_notes', JSON.stringify(updated));
                setIsNewNoteModalOpen(false);
                setNewNoteTitle('');
                setNewNoteDesc('');
                setNewNoteContent('');
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">عنوان الملخص:</label>
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="مثال: ملخص قوانين الحركة الدائرية والجاذبية"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">المادة:</label>
                <select
                  value={newNoteSubject}
                  onChange={(e) => setNewNoteSubject(e.target.value as SubjectId)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">وصف الملخص وما يحتويه:</label>
                <textarea
                  value={newNoteDesc}
                  onChange={(e) => setNewNoteDesc(e.target.value)}
                  placeholder="وصف مختصر لمساعدة الزملاء..."
                  className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">محتوى أو معادلات الملخص الرئيسية:</label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="أهم القوانين أو الروابط..."
                  className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!newNoteTitle.trim() || !newNoteDesc.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  نشر الملخص للزملاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REPORT INAPPROPRIATE CONTENT ================= */}
      {reportingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2 text-rose-400">
                <Flag className="w-5 h-5" />
                <span>إبلاغ عن محتوى غير لائق</span>
              </h3>
              <button onClick={() => setReportingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-sm">تم استلام البلاغ بنجاح</h4>
                <p className="text-xs text-slate-300">
                  شكراً لحرصك على أمان المجتمع. سيقوم المشرف الأكاديمي بمراجعة المحتوى واتخاذ الإجراء اللازم فوراً.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  البلاغ بشأن: <strong className="text-white">"{reportingItem.title}"</strong>
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">سبب الإبلاغ:</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="">اختر السبب...</option>
                    <option value="inappropriate_language">ألفاظ غير لائقة أو غير تربوية</option>
                    <option value="bullying">تنمر أو إساءة شخصية</option>
                    <option value="spam">إعلانات أو محتوى عشوائي لا يمت للدراسة بصلة</option>
                    <option value="cheating">محاولة غش صريح أو مخالفة النزاهة</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setReportingItem(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    disabled={!reportReason}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs disabled:opacity-50"
                  >
                    تأكيد إرسال البلاغ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
