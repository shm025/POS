import { useParams } from 'react-router-dom'
import DocEditor from '../components/documents/DocEditor'

export default function PurchasesPage() {
  const { docId } = useParams()
  return <DocEditor docType="purchases" docId={docId || null} />
}
