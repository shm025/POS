import { useParams } from 'react-router-dom'
import DocEditor from '../../components/documents/DocEditor'
export default function OrdersPage() {
  const { docId } = useParams()
  return <DocEditor docType="orders" docId={docId || null} />
}
