import { EducationalStage, SubjectId } from '../types';

export interface StageInfo {
  id: EducationalStage;
  name: string;
  enName: string;
  icon: string;
  description: string;
}

export const STAGES: StageInfo[] = [
  {
    id: 'primary',
    name: 'المرحلة الابتدائية',
    enName: 'Primary School',
    icon: '🎒',
    description: 'الأساسيات، العمليات الحسابية، الأشكال الهندسية، والعلوم المبسطة',
  },
  {
    id: 'middle',
    name: 'المرحلة المتوسطة / الإعدادية',
    enName: 'Middle School',
    icon: '📐',
    description: 'الجبر الأولي، المعادلات الخطية، نظرية فيثاغورس، وقوانين الحركة',
  },
  {
    id: 'high',
    name: 'المرحلة الثانوية',
    enName: 'High School',
    icon: '🔬',
    description: 'حساب التفاضل والتكامل، الاحتمالات، الميكانيكا، الكيمياء العضوية',
  },
  {
    id: 'university',
    name: 'المرحلة الجامعية',
    enName: 'University Level',
    icon: '🎓',
    description: 'الجبر الخطي، المعادلات التفاضلية، التحليل الرياضي والفيزياء المتقدمة',
  },
];

export const CURRICULA = [
  { id: 'ye', name: 'المنهج اليمني (وزارة التربية والتعليم - اليمن)', country: 'الجمهورية اليمنية' },
  { id: 'general', name: 'المعايير المعتمدة والمناهج المشتركة', country: 'عالمي' },
  { id: 'sa', name: 'المنهج السعودي (وزارة التعليم)', country: 'المملكة العربية السعودية' },
  { id: 'eg', name: 'المنهج المصري (وزارة التربية والتعليم)', country: 'مصر' },
  { id: 'ae', name: 'المنهج الإماراتي (مؤسسة الإمارات للتعليم)', country: 'الإمارات' },
  { id: 'jo', name: 'المنهج الأردني (توجيهي / المدارس)', country: 'الأردن' },
  { id: 'morocco', name: 'المنهج المغربي (الباكالوريا الوطنية)', country: 'المغرب' },
  { id: 'international', name: 'المناهج الدولية (IB / SAT / Cambridge)', country: 'دولي' },
];

export const SUBJECTS: { id: SubjectId; name: string; icon: string; color: string }[] = [
  { id: 'math', name: 'الرياضيات', icon: '∑', color: 'from-blue-600 to-indigo-600' },
  { id: 'physics', name: 'الفيزياء', icon: '⚡', color: 'from-amber-500 to-orange-600' },
  { id: 'it', name: 'تقنية المعلومات والحاسوب (IT)', icon: '💻', color: 'from-cyan-500 to-blue-600' },
  { id: 'chemistry', name: 'الكيمياء', icon: '🧪', color: 'from-emerald-500 to-teal-600' },
  { id: 'biology', name: 'الأحياء والعلوم', icon: '🧬', color: 'from-green-500 to-emerald-700' },
  { id: 'arabic', name: 'اللغة العربية والبلاغة', icon: '📖', color: 'from-purple-600 to-pink-600' },
  { id: 'general', name: 'مواد عامة', icon: '📚', color: 'from-slate-600 to-slate-800' },
];

export const SAMPLE_QUESTIONS = [
  {
    title: 'تكامل بالتعويض والتجزئة (ثانوي)',
    subject: 'math',
    stage: 'high',
    question: 'أوجد قيمة التكامل التالي مع توضيح خطوات التعويض:\n\\int x e^{2x} dx',
  },
  {
    title: 'معادلة تربيعية وميل المماس',
    subject: 'math',
    stage: 'high',
    question: 'لتكن الدالة f(x) = x^2 - 4x + 3. أوجد رأس القطع المكافئ، ونقاط التقاطع مع المحورين، ومعادلة المماس عند النقطة (3, 0).',
  },
  {
    title: 'قانون نيوتن الثاني والحركة (فيزياء)',
    subject: 'physics',
    stage: 'middle',
    question: 'سيارة كتلتها 1200 kg تتسارع من السكون إلى سرعة 25 m/s خلال 5 ثوانٍ. احسب التسارع والقوة المحصلة المؤثرة ومقدار الشغل المبذول.',
  },
  {
    title: 'نظرية فيثاغورس والنسب المثلثية',
    subject: 'math',
    stage: 'middle',
    question: 'مثلث قائم الزاوية طول وتره 10 cm وأحد ضلعيه 6 cm. احسب طول الضلع الآخر وقيم sin و cos و tan للزاوية المقابلة للضلع الأقصر.',
  },
  {
    title: 'كيمياء: قانون الغاز المثالي وحساب المولات',
    subject: 'chemistry',
    stage: 'high',
    question: 'عينة من غاز الأكسجين حجمها 5 L عند درجة حرارة 27°C وضغط 2 atm. احسب عدد مولات الغاز علماً بأن R = 0.0821 L·atm/(mol·K).',
  },
  {
    title: 'تقنية المعلومات: خوارزمية البحث الثنائي في بايثون',
    subject: 'it',
    stage: 'high',
    question: 'اكتب دالة بلغة بايثون لتنفيذ خوارزمية البحث الثنائي (Binary Search) على مصفوفة مرتبة، مع توضيح التعقيد الزمني O(log n) وخطوات التنفيذ.',
  },
  {
    title: 'المنهج اليمني: الأعداد المركبة ونظرية ديموافر (ثالث ثانوي)',
    subject: 'math',
    stage: 'high',
    question: 'ضع العدد المركب z = 1 + i\\sqrt{3} في الصورة القطبية، ثم احسب z^6 باستخدام نظرية ديموافر، وأوجد الجذور التكعيبية للعدد z.',
  },
  {
    title: 'المنهج اليمني: فيزياء الدوائر المهتزة والمحولات الكهربائية',
    subject: 'physics',
    stage: 'high',
    question: 'محول كهربائي خافض للجهد يعمل على جهد ابتدائي 220 V ويعطي جهداً ثانوياً 11 V. إذا كان عدد لفات ملفه الابتدائي 1000 لفة وكفاءته 90%، احسب عدد لفات الملف الثانوي والقدرة المستهلكة إذا كان تيار الحمل 2 A.',
  },
];
