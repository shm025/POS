import { useState, useRef, useEffect } from 'react'

export default function TypeaheadInput({ value, onChange, onSelect, items = [], placeholder = '', renderItem, className = '' }) {
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const wrapRef = useRef(null)

  const filtered = value
    ? items.filter(it =>
        (it.code||'').toLowerCase().includes(value.toLowerCase()) ||
        (it.name||'').toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10)
    : []

  useEffect(() => {
    function handleClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleKeyDown(e) {
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); onSelect(filtered[activeIdx]); setOpen(false); setActiveIdx(-1) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div className="typeahead-wrap" ref={wrapRef}>
      <input
        className={`form-control typeahead-input ${className}`}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setActiveIdx(-1) }}
        onFocus={() => value && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="typeahead-dropdown open">
          {filtered.map((it, i) => (
            <div
              key={it.id ?? i}
              className={`typeahead-item${i === activeIdx ? ' active' : ''}`}
              onMouseDown={() => { onSelect(it); setOpen(false); setActiveIdx(-1) }}
            >
              {renderItem ? renderItem(it) : (
                <>
                  <span>{it.name}</span>
                  <span className="item-code">{it.code || ''}</span>
                  <span className="item-price">${it.price ?? ''}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && value && (
        <div className="typeahead-dropdown open">
          <div className="typeahead-item" style={{ color:'var(--text-muted)' }}>لا توجد نتائج</div>
        </div>
      )}
    </div>
  )
}
