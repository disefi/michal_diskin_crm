'use client'
import { useState, useTransition } from 'react'
import { saveClient, deleteClient } from '@/app/clients/actions'
import SortableHeader from './SortableHeader'
import { useSort } from '@/lib/useSort'

type Client = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
}

export default function ClientsTable({ clients }: { clients: Client[] }) {
  const [editing, setEditing] = useState<Client | 'new' | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { sorted, sortKey, sortDir, toggleSort } = useSort<Client>(clients, 'name', 'asc')

  function handleDelete(client: Client) {
    if (!confirm(`למחוק את הלקוח "${client.name}"? פעולה זו לא ניתנת לביטול.`)) return
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteClient(client.id)
      if (result.error) setDeleteError(result.error)
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{clients.length} לקוחות</p>
        <button
          onClick={() => setEditing('new')}
          className="px-4 py-1.5 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center gap-1"
        >
          <span className="text-lg leading-none">+</span> לקוח חדש
        </button>
      </div>

      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          {deleteError}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-100 text-sm text-gray-600">
            <tr>
              <SortableHeader label="שם" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="טלפון" sortKey="phone" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="אימייל" sortKey="email" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="כתובת" sortKey="address" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c.phone ?? '-'}</td>
                <td className="p-3">{c.email ?? '-'}</td>
                <td className="p-3">{c.address ?? '-'}</td>
                <td className="p-3">
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setEditing(c)}
                      title="עריכה"
                      className="text-gray-500 hover:scale-110 transition"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={isPending}
                      title="מחיקה"
                      className="text-red-500 hover:scale-110 transition disabled:opacity-40"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  אין לקוחות עדיין
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-30"
          onClick={() => setEditing(null)}
        >
          <form
            action={saveClient}
            onSubmit={() => setEditing(null)}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-lg p-5 w-96 space-y-3"
          >
            <h3 className="font-semibold">{editing === 'new' ? 'לקוח חדש' : 'עריכת לקוח'}</h3>
            {editing !== 'new' && <input type="hidden" name="id" value={editing.id} />}

            <div>
              <label className="text-xs text-gray-500 block mb-1">שם *</label>
              <input
                type="text"
                name="name"
                required
                defaultValue={editing !== 'new' ? editing.name : ''}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">טלפון</label>
              <input
                type="tel"
                name="phone"
                defaultValue={editing !== 'new' ? editing.phone ?? '' : ''}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">אימייל</label>
              <input
                type="email"
                name="email"
                defaultValue={editing !== 'new' ? editing.email ?? '' : ''}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">כתובת</label>
              <input
                type="text"
                name="address"
                defaultValue={editing !== 'new' ? editing.address ?? '' : ''}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">הערות</label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={editing !== 'new' ? editing.notes ?? '' : ''}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-3 py-1.5 text-sm text-gray-500">
                ביטול
              </button>
              <button type="submit" className="px-4 py-1.5 text-sm bg-gray-800 text-white rounded">
                שמירה
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
