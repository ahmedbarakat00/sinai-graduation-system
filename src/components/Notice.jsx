import { Info } from 'lucide-react'

export default function Notice({ children, tone = 'info' }) {
  return <div className={`notice notice-${tone}`} role="status"><Info size={18} /><span>{children}</span></div>
}
