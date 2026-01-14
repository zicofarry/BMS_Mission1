import React from 'react'

// Dummy treeview - static list for quick testing
const DUMMY = [
  { db: 'DEFAULT.db', table: 'FTP' },
  { db: 'DEFAULT.db', table: 'UK' },
  { db: 'DEFAULT.db', table: 'GW' },
  { db: 'DEFAULT.db', table: 'users' },
  { db: 'DEFAULT.db', table: 'products' },
]

export default function SidebarTree({ onSelect }){
  return (
    <div>
      <h3>Databases / Tables</h3>
      <ul>
        {DUMMY.map((d,i) => (
          <li key={i} onClick={() => onSelect(d.db, d.table)}>{d.db} ▸ {d.table}</li>
        ))}
      </ul>
    </div>
  )
}
