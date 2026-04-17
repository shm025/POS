import { useParams } from 'react-router-dom'
import DocEditor from '../../components/documents/DocEditor'

export default function InvoicesPage() {
  const { docId } = useParams()
  return <DocEditor docType="invoices" docId={docId || null} />
}
