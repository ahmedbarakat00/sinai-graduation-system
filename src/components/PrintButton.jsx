import { Printer } from 'lucide-react'
import { printCurrentPage } from '../services/printing'

export default function PrintButton({ children = 'طباعة التقرير', className = 'btn btn-secondary' }) {
  return <button type="button" className={className} onClick={printCurrentPage}><Printer size={17} />{children}</button>
}
