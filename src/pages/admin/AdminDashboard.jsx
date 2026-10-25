import { useEffect, useState } from 'react'
import { ShieldCheck, Printer, RefreshCw, Users, FolderKanban, CheckCircle2, Clock3, XCircle } from 'lucide-react'
import Notice from '../../components/Notice'
import { printCurrentPage } from '../../services/printing'
import { isSupabaseConfigured, supabase } from '../../services/supabase'

export default function AdminDashboard() {
  const [data, setData] = useState({ projects: [], doctors: [], reviews: [] })
  const [state, setState] = useState('loading')
  async function load() {
    if (!isSupabaseConfigured) { setState('unconfigured'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setState('signed-out'); return }
    const [p, d, r] = await Promise.all([
      supabase.from('projects').select('id,status,title_ar,title_en,created_at,final_doctor_id,project_members(full_name,university_id,is_leader),doctors!projects_final_doctor_id_fkey(full_name_ar)'),
      supabase.from('doctors').select('id,full_name_ar,phone,is_active'),
      supabase.from('review_requests').select('id,status,created_at,doctor_id,project_id,projects(title_ar,title_en)').order('created_at', { ascending: false }),
    ])
    if (p.error || d.error || r.error) setState('error')
    else { setData({ projects: p.data ?? [], doctors: d.data ?? [], reviews: r.data ?? [] }); setState('ready') }
  }
  useEffect(() => { load() }, [])
  const count = (s) => data.projects.filter(p => p.status === s).length
  const cards = [
    { label: 'إجمالي المشاريع', value: data.projects.length, icon: FolderKanban },
    { label: 'المشاريع المقبولة', value: count('accepted'), icon: CheckCircle2 },
    { label: 'المشاريع المرفوضة', value: count('rejected'), icon: XCircle },
    { label: 'قيد المراجعة', value: count('pending'), icon: Clock3 },
    { label: 'عدد الدكاترة', value: data.doctors.length, icon: Users },
  ]
  return <div className="page-stack">
    <section className="page-heading"><div className="heading-icon"><ShieldCheck size={25}/></div><div><p className="eyebrow">ADMIN DASHBOARD</p><h1>لوحة الأدمن</h1><p>نظرة عامة على المشاريع والدكاترة وطلبات المراجعة.</p></div></section>
    <Notice tone="warning">يجب أن يكون حساب الأدمن معتمدًا مسبقًا، وتُفرض صلاحياته في قاعدة البيانات. هذه الواجهة وحدها لا تمنح أو تحمي صلاحية الأدمن.</Notice>
    {state === 'unconfigured' && <Notice>اربط Supabase لتظهر الإحصائيات الحقيقية. لن يتم عرض بيانات تجريبية.</Notice>}
    {state === 'signed-out' && <Notice>يلزم تسجيل الدخول بحساب الأدمن المعتمد.</Notice>}
    {state === 'error' && <Notice tone="warning">تعذر تحميل البيانات. راجع الجداول وعلاقاتها وسياسات RLS.</Notice>}
    <div className="toolbar no-print"><div className="toolbar-spacer"/><button className="btn btn-secondary" onClick={load}><RefreshCw size={16}/> تحديث البيانات</button><button className="btn btn-primary" onClick={printCurrentPage}><Printer size={16}/> طباعة التقرير الشامل</button></div>
    <section className="stats-grid">{cards.map(card => { const Icon = card.icon; return <article className="stat-card" key={card.label}><div className="stat-icon"><Icon size={20}/></div><span>{card.label}</span><strong>{state === 'ready' ? card.value : '—'}</strong></article> })}</section>
    <section className="table-card"><div className="table-heading"><h2>كل المشاريع</h2><span className="count-chip">{data.projects.length} مشروع</span></div>
      {state === 'ready' && data.projects.length === 0 ? <div className="empty-state"><FolderKanban size={35}/><h3>لا توجد مشاريع مسجلة حتى الآن</h3><p>ستظهر بيانات المشاريع الحقيقية بعد تقديمها.</p></div> :
      <div className="table-wrap"><table><thead><tr><th>المشروع</th><th>الدكتور المسؤول</th><th>أعضاء الفريق</th><th>الحالة</th><th>تاريخ التسليم</th></tr></thead><tbody>
      {data.projects.map(p => <tr key={p.id}><td><strong>{p.title_ar}</strong><small dir="ltr">{p.title_en}</small></td><td>{p.doctors?.full_name_ar ?? 'لم يُحدد بعد'}</td><td>{(p.project_members ?? []).map(m => <div key={m.university_id}>{m.full_name} — {m.university_id}{m.is_leader ? ' (القائد)' : ''}</div>)}</td><td><span className={`status status-${p.status}`}>{({pending:'قيد المراجعة',accepted:'مقبول',rejected:'مرفوض',closed:'مغلق'})[p.status] ?? p.status}</span></td><td>{new Date(p.created_at).toLocaleDateString('ar-EG')}</td></tr>)}
      </tbody></table></div>}
    </section>
    <section className="table-card"><div className="table-heading"><h2>إدارة الدكاترة — عرض فقط في هذه النسخة</h2><span className="count-chip">{data.doctors.length} دكتور</span></div>
      {state === 'ready' && data.doctors.length === 0 ? <div className="empty-state"><Users size={32}/><p>لا توجد سجلات دكاترة.</p></div> :
      <div className="table-wrap"><table><thead><tr><th>اسم الدكتور</th><th>رقم الهاتف</th><th>الحالة</th></tr></thead><tbody>{data.doctors.map(d => <tr key={d.id}><td>{d.full_name_ar}</td><td>{d.phone ?? '—'}</td><td><span className={`status ${d.is_active ? 'status-accepted' : 'status-closed'}`}>{d.is_active ? 'نشط' : 'غير نشط'}</span></td></tr>)}</tbody></table></div>}
    </section>
  </div>
}
