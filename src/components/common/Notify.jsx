import { useState, useEffect } from 'react'
import { subscribeNotify } from '../../utils/notify'

export default function Notify() {
  const [state, setState] = useState({ msg: '', type: 'success', show: false })

  useEffect(() => {
    return subscribeNotify((msg, type) => {
      setState({ msg, type, show: true })
      setTimeout(() => setState(s => ({ ...s, show: false })), 3000)
    })
  }, [])

  const prefix = state.type === 'success' ? '✅ ' : '❌ '

  return (
    <div className={`notification ${state.type}${state.show ? ' show' : ''}`}>
      {prefix}{state.msg}
    </div>
  )
}
