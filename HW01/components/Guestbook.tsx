'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

interface Comment {
  id: number
  user_name: string
  user_image: string | null
  content: string
  created_at: string
}

export default function Guestbook() {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadComments() {
    const res = await fetch('/api/comments')
    const json = await res.json()
    if (json.comments) setComments(json.comments as Comment[])
  }

  useEffect(() => {
    loadComments()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? '오류가 발생했습니다.')
    } else {
      setContent('')
      await loadComments()
    }
    setSubmitting(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-slate-700 mb-4">방명록</h3>

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3 items-start">
          {session?.user?.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? ''}
              width={36}
              height={36}
              className="rounded-full flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="M2 통화 데이터에 대한 의견을 남겨보세요..."
              maxLength={300}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">{content.length}/300</span>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        </div>
      </form>

      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">아직 방명록이 없습니다. 첫 번째로 남겨보세요!</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              {c.user_image ? (
                <Image
                  src={c.user_image}
                  alt={c.user_name}
                  width={36}
                  height={36}
                  className="rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-semibold flex-shrink-0">
                  {c.user_name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-slate-700">{c.user_name}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(c.created_at).toLocaleString('ko-KR')}
                  </span>
                </div>
                <p className="text-sm text-slate-600 break-words">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
