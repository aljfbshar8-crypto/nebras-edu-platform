export type EducationalStage = 'primary' | 'middle' | 'high' | 'university';

export type SubjectId = 'math' | 'physics' | 'chemistry' | 'biology' | 'arabic' | 'it' | 'general';

export interface CurriculumOption {
  id: string;
  name: string;
  country: string;
}

export interface PrimaryLaw {
  name: string;
  formula: string;
  source: string;
}

export interface SolutionStep {
  stepNumber: number;
  title: string;
  explanation: string;
  mathLatex?: string;
  tip?: string;
}

export interface PracticeQuestion {
  questionText: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
}

export interface SolutionData {
  id?: string;
  timestamp?: number;
  extractedQuestion: string;
  subject: string;
  topic: string;
  confidenceScore: number;
  confidenceReason: string;
  finalAnswer: string;
  primaryLaws: PrimaryLaw[];
  steps: SolutionStep[];
  verification: string;
  practiceQuestion?: PracticeQuestion;
  curriculumAlignment?: string;
  userImage?: string;
  language?: string;
}

export interface GradedQuestion {
  questionNumber: number;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  earnedMarks: number;
  maxMarks: number;
  explanation: string;
  commonPitfall?: string;
}

export interface ExamReport {
  totalMarks: number;
  studentMarks: number;
  percentage: number;
  overallGrade: string;
  summaryFeedback: string;
  questions: GradedQuestion[];
  strengths: string[];
  areasForImprovement: string[];
  recommendedActionPlan: string[];
  examImage?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  hint?: string;
  stepByStepSolution: string[];
  lawUsed?: string;
}

export interface QuizData {
  title: string;
  subject: string;
  stage: string;
  topic: string;
  difficulty: string;
  timeLimitMinutes: number;
  questions: QuizQuestion[];
}

export interface ForumReply {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorBadge: string;
  content: string;
  createdAt: string;
  upvotes: number;
  isAcceptedAnswer?: boolean;
  isAiVerified?: boolean;
}

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorAvatar: string;
  authorBadge: string;
  stage: EducationalStage;
  subject: SubjectId;
  topic: string;
  createdAt: string;
  upvotes: number;
  replies: ForumReply[];
  isResolved: boolean;
  tags: string[];
  isFlagged?: boolean;
  flagReason?: string;
}

export interface StudyGroupMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isQuestion?: boolean;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject: SubjectId;
  stage: EducationalStage;
  membersCount: number;
  activeNowCount: number;
  currentTopic: string;
  hostName: string;
  hostAvatar: string;
  messages: StudyGroupMessage[];
  sharedNotes: { title: string; author: string; link?: string }[];
  pomodoroMinutesLeft?: number;
}

export interface SharedNote {
  id: string;
  title: string;
  description: string;
  subject: SubjectId;
  stage: EducationalStage;
  authorName: string;
  authorBadge: string;
  likes: number;
  downloads: number;
  date: string;
  tags: string[];
  contentPreview: string;
}

export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
  educationalFeedback?: string;
  cleanedText?: string;
}

export type UserRole = 'student' | 'teacher' | 'engineer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  stage?: EducationalStage;
  institution?: string;
  createdAt: string;
  avatar: string;
  status: 'active' | 'suspended';
  phone?: string;
  solvedCount?: number;
  isOfficialVerified?: boolean;
  verifiedAt?: string;
}

export interface UploadedCourse {
  id: string;
  title: string;
  subject: SubjectId;
  stage: EducationalStage;
  teacherId: string;
  teacherName: string;
  fileName: string;
  fileSize?: string;
  extractedSummary: string;
  chapters: string[];
  uploadDate: string;
  fullContent?: string;
  examsGeneratedCount: number;
}

export interface CourseExamQuestion {
  id: number;
  question: string;
  type: 'mcq' | 'problem' | 'essay' | 'boolean';
  options?: string[];
  correctAnswer: string;
  modelAnswerExplanation: string;
  marks: number;
  chapterRef?: string;
}

export interface CourseExam {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  examType: 'mcq' | 'problems' | 'mixed' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  durationMinutes: number;
  totalMarks: number;
  questions: CourseExamQuestion[];
  createdAt: string;
  teacherName: string;
}


