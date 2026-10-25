export function printCurrentPage() {
  window.print()
}

export function printProjectReport(project, members = []) {
  const popup = window.open('', '_blank', 'width=900,height=700')
  if (!popup) {
    window.print()
    return
  }
  const esc = (value) => String(value ?? '—').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c])
  const rows = members.map((member, i) => `
    <tr><td>${i + 1}</td><td>${esc(member.full_name)}</td><td>${esc(member.university_id)}</td><td>${member.is_leader ? 'قائد الفريق' : 'عضو'}</td></tr>
  `).join('')
  popup.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير المشروع</title>
  <style>body{font-family:Arial,sans-serif;margin:32px;color:#172b3a}h1,h2{text-align:center}table{width:100%;border-collapse:collapse;margin:18px 0}td,th{border:1px solid #ccd6dd;padding:9px;text-align:right}th{background:#eef3f6}.meta{line-height:2}.desc{white-space:pre-wrap}@media print{button{display:none}}</style>
  </head><body><h1>جامعة سيناء</h1><h2>تقرير مشروع تخرج</h2>
  <div class="meta"><b>اسم المشروع بالعربي:</b> ${esc(project.title_ar)}<br>
  <b>Project title:</b> ${esc(project.title_en)}<br>
  <b>المشرف:</b> ${esc(project.doctor_name)}<br>
  <b>الحالة:</b> ${esc(project.status)}<br>
  <b>تاريخ التسليم:</b> ${esc(project.created_at ? new Date(project.created_at).toLocaleDateString('ar-EG') : '—')}</div>
  <h3>أعضاء الفريق</h3><table><thead><tr><th>#</th><th>الاسم</th><th>الرقم الجامعي</th><th>الدور</th></tr></thead><tbody>${rows || '<tr><td colspan="4">لا توجد بيانات أعضاء متاحة</td></tr>'}</tbody></table>
  <h3>وصف المشروع</h3><p class="desc">${esc(project.description_ar)}</p><h3>Project Description</h3><p class="desc">${esc(project.description_en)}</p>
  <script>window.onload=()=>window.print()<\/script></body></html>`)
  popup.document.close()
}
