import { useState } from 'react'
import { FileText, Plus, Trash2, Send, Printer, CheckCircle2 } from 'lucide-react'
import Notice from '../../components/Notice'
import { printProjectReport } from '../../services/printing'
import { isSupabaseConfigured, supabase } from '../../services/supabase'

const blankMember = () => ({ full_name: '', university_id: '', is_leader: false })

export default function StudentPortal() {
  const [form, setForm] = useState({ title_ar: '', title_en: '', doctor_id: '', description_ar: '', description_en: '' })
  const [members, setMembers] = useState([{ ...blankMember(), is_leader: true }])
  const [doctors, setDoctors] = useState([])
  const [message, setMessage] = useState('')
  const [submittedProject, setSubmittedProject] = useState(null)
  const [loadingDoctors, setLoadingDoctors] = useState(false)

  async function loadDoctors() {
    if (!supabase || doctors.length || loadingDoctors) return
    setLoadingDoctors(true)
    const { data, error } = await supabase.from('doctors').select('id, full_name_ar').eq('is_active', true).order('full_name_ar')
    if (!error) setDoctors(data ?? [])
    else setMessage('تعذر تحميل قائمة المشرفين. تأكد من إعداد قاعدة البيانات والصلاحيات.')
    setLoadingDoctors(false)
  }

  function updateMember(index, field, value) {
    setMembers(current => current.map((member, i) => ({ ...member, [field]: field === 'is_leader' ? i === index : value, ...(field === 'is_leader' && i !== index ? { is_leader: false } : {}) })))
  }

  async function submit(e) {
    e.preventDefault()
    setMessage('')
    if (members.length < 1 || members.some(m => !m.full_name.trim() || !m.university_id.trim())) {
      setMessage('من فضلك أكمل أسماء وأرقام جميع أعضاء الفريق.')
      return
    }
    if (members.filter(m => m.is_leader).length !== 1) {
      setMessage('حدد قائدًا واحدًا للفريق.')
      return
    }
    if (!isSupabaseConfigured) {
      setMessage('الواجهة جاهزة، لكن الحفظ الفعلي يحتاج إعداد Supabase أولًا. لم يتم تسجيل المشروع في قاعدة البيانات.')
      return
    }
    const { data: project, error } = await supabase.rpc('submit_project', {
      p_title_ar: form.title_ar,
      p_title_en: form.title_en,
      p_doctor_id: form.doctor_id || null,
      p_description_ar: form.description_ar,
      p_description_en: form.description_en,
      p_members: members,
    })
    if (error) {
      setMessage('لم يتم تسليم المشروع: ' + error.message)
      return
    }
    const printable = { ...form, status: 'قيد المراجعة', created_at: new Date().toISOString(), doctor_name: doctors.find(d => d.id === form.doctor_id)?.full_name_ar }
    setSubmittedProject({ ...printable, id: project?.id ?? project })
    setMessage('تم تسليم المشروع بنجاح.')
  }

  if (submittedProject) return (
    <section className="success-panel">
      <CheckCircle2 size={54} />
      <h1>تم تسليم المشروع</h1>
      <p>تم تسجيل الطلب. احتفظ بنسخة من بيانات المشروع.</p>
      <button className="btn btn-primary" onClick={() => printProjectReport(submittedProject, members)}><Printer size={17}/> طباعة بيانات المشروع</button>
    </section>
  )

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div className="heading-icon"><FileText size={25}/></div>
        <div><p className="eyebrow">STUDENT PORTAL</p><h1>تقديم مشروع التخرج</h1><p>املأ البيانات التالية لتقديم مشروعك للمراجعة الأكاديمية.</p></div>
      </section>
      <Notice>نموذج الطالب عام ولا يحتاج إلى تسجيل دخول. لا يمكن من هذه الصفحة استعراض مشاريع الطلاب الآخرين.</Notice>
      {message && <Notice tone={message.includes('بنجاح') ? 'success' : 'warning'}>{message}</Notice>}
      <form className="form-card" onSubmit={submit}>
        <div className="section-title"><span>01</span><div><h2>بيانات المشروع</h2><p>أدخل عنوان المشروع والمشرف المقترح.</p></div></div>
        <div className="form-grid">
          <label>اسم المشروع باللغة العربية<input required value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} placeholder="مثال: نظام إدارة مشاريع التخرج"/></label>
          <label>Project Title (English)<input required dir="ltr" value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} placeholder="Graduation Project Management System"/></label>
          <label className="full-width">المشرف الأكاديمي المقترح
            <select value={form.doctor_id} onFocus={loadDoctors} onChange={e => setForm({ ...form, doctor_id: e.target.value })}>
              <option value="">{isSupabaseConfigured ? (loadingDoctors ? 'جارٍ تحميل الدكاترة...' : 'اختر الدكتور') : 'سيتم تفعيل القائمة بعد إعداد Supabase'}</option>
              {doctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.full_name_ar}</option>)}
            </select>
          </label>
        </div>
        <div className="section-title section-spaced"><span>02</span><div><h2>بيانات فريق المشروع</h2><p>حدد قائد الفريق وأدخل الرقم الجامعي لكل طالب.</p></div></div>
        <div className="members-list">
          {members.map((member, i) => <div className="member-card" key={i}>
            <div className="member-top"><strong>الطالب {i + 1}</strong>{members.length > 1 && <button className="icon-button danger" type="button" onClick={() => setMembers(members.filter((_, j) => j !== i))}><Trash2 size={16}/> حذف</button>}</div>
            <div className="form-grid">
              <label>اسم الطالب<input required value={member.full_name} onChange={e => updateMember(i, 'full_name', e.target.value)} placeholder="الاسم رباعي"/></label>
              <label>الرقم الجامعي<input required value={member.university_id} onChange={e => updateMember(i, 'university_id', e.target.value)} placeholder="الرقم الجامعي"/></label>
            </div>
            <label className="leader-option"><input type="radio" name="leader" checked={member.is_leader} onChange={() => updateMember(i, 'is_leader', true)}/> قائد الفريق (Team Leader)</label>
          </div>)}
        </div>
        <button className="btn btn-outline add-member" type="button" onClick={() => setMembers([...members, blankMember()])}><Plus size={17}/> إضافة طالب آخر</button>
        <div className="section-title section-spaced"><span>03</span><div><h2>وصف المشروع</h2><p>اشرح فكرة المشروع بالعربية والإنجليزية.</p></div></div>
        <div className="form-grid">
          <label>وصف المشروع باللغة العربية<textarea required rows="5" value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} placeholder="اكتب وصفًا واضحًا لفكرة المشروع..."/></label>
          <label>Project Description<textarea dir="ltr" required rows="5" value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} placeholder="Describe the project idea..."/></label>
        </div>
        <div className="form-actions"><span className="muted">راجع البيانات قبل التسليم.</span><button className="btn btn-primary" type="submit"><Send size={17}/> تسليم المشروع</button></div>
      </form>
    </div>
  )
}
