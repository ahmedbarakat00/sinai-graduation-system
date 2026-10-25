import { GraduationCap, ShieldCheck, UserRound, BookOpenCheck } from 'lucide-react'

export default function AppShell({ children, mode, setMode }) {
  return (
    <div className="app-shell">
      <header className="topbar no-print">
        <div className="brand">
          <div className="brand-mark"><GraduationCap size={27} /></div>
          <div><strong>جامعة سيناء</strong><span>نظام إدارة مشاريع التخرج</span></div>
        </div>
        <div className="academic-year">العام الدراسي 2026–2027</div>
      </header>
      <nav className="demo-nav no-print" aria-label="معاينة الواجهات">
        <span>معاينة الواجهات فقط:</span>
        <button className={mode === 'student' ? 'nav-active' : ''} onClick={() => setMode('student')}><UserRound size={16}/> الطالب</button>
        <button className={mode === 'doctor' ? 'nav-active' : ''} onClick={() => setMode('doctor')}><BookOpenCheck size={16}/> الدكتور</button>
        <button className={mode === 'admin' ? 'nav-active' : ''} onClick={() => setMode('admin')}><ShieldCheck size={16}/> الأدمن</button>
      </nav>
      <main className="main-content">{children}</main>
      <footer className="footer no-print">جامعة سيناء · نظام إدارة مشاريع التخرج</footer>
    </div>
  )
}
