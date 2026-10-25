import { useEffect, useState } from 'react'
import { BookOpenCheck, Printer, RefreshCw, Search } from 'lucide-react'
import Notice from '../../components/Notice'
import { printCurrentPage } from '../../services/printing'
import { isSupabaseConfigured, supabase } from '../../services/supabase'

export default function DoctorDashboard() {
  const [projects, setProjects] = useState([])
  const [status, setStatus] = useState('loading')
  const [search, setSearch] = useState('')

  async function load() {
    if (!isSupabaseConfigured) { setStatus('unconfigured'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStatus('signed-out'); return }
    const { data, error } = await supabase.from('review_requests')
      .select('id, status, created_at, projects(id, title_ar, title_en, status, description_ar, description_en, project_members(full_name, university_id, is_leader))')
      .in('status', ['pending', 'accepted', 'rejected'])
      .order('created_at', { ascending: false })
    if (error) setStatus('error')
    else { setProjects(data ?? []); setStatus('ready') }
  }
  useEffect(() => { load() }, [])
  const visible = projects.filter(r => `${r.projects?.title_ar ?? ''} ${r.projects?.title_en ?? ''}`.toLowerCase().includes(search.toLowerCase()))

  return <div className="page-stack">
    <section className="page-heading">
      <div className="heading-icon"><BookOpenCheck size={25}/></div>
      <div><p className="eyebrow">DOCTOR DASHBOARD</p><h1>لوحة الدكتور</h1><p>طلبات المراجعة المسندة إلى حسابك وسجل القرارات.</p></div>
    </section>
    <Notice tone="warning">البيانات محمية في قاعدة البيانات عند إعداد Supabase وRLS. شاشة المعاينة الحالية ليست نظام تسجيل دخول نهائيًا؛ لا تنشرها للاستخدام الفعلي قبل تطبيق سياسات الأمان.</Notice>
    {status === 'unconfigured' && <Notice>اربط Supabase لتفعيل تحميل المشاريع والمراجعات.</Notice>}
    {status === 'signed-out' && <Notice>يلزم تسجيل الدخول بحساب دكتور معتمد من الأدمن لعرض المشاريع.</Notice>}
    {status === 'error' && <Notice tone="warning">تعذر تحميل الطلبات. راجع إعدادات قاعدة البيانات وسياسات RLS.</Notice>}
    <div className="toolbar no-print">
      <div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم المشروع..."/></div>
      <button className="btn btn-secondary" onClick={load}><RefreshCw size={16}/> تحديث</button>
      <button className="btn btn-primary" onClick={printCurrentPage}><Printer size={16}/> طباعة المشاريع</button>
    </div>
    <section className="table-card">
      <div className="table-heading"><h2>المشاريع المسندة إليّ</h2><span className="count-chip">{visible.length} طلب</span></div>
      {status === 'ready' && visible.length === 0 ? <div className="empty-state"><BookOpenCheck size={35}/><h3>لا توجد طلبات مراجعة</h3><p>ستظهر هنا الطلبات المسندة إلى حسابك عند توفرها.</p></div> :
      <div className="table-wrap"><table><thead><tr><th>المشروع</th><th>أعضاء الفريق</th><th>حالة المراجعة</th><th>تاريخ الطلب</th></tr></thead><tbody>
        {visible.map(item => <tr key={item.id}><td><strong>{item.projects?.title_ar}</strong><small dir="ltr">{item.projects?.title_en}</small></td><td>{(item.projects?.project_members ?? []).map(m => <div key={m.university_id}>{m.full_name} — {m.university_id}{m.is_leader ? ' (القائد)' : ''}</div>)}</td><td><span className={`status status-${item.status}`}>{({pending:'قيد المراجعة',accepted:'مقبول',rejected:'مرفوض'})[item.status]}</span></td><td>{new Date(item.created_at).toLocaleDateString('ar-EG')}</td></tr>)}
      </tbody></table></div>}
    </section>
  </div>
}
