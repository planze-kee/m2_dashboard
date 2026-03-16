'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  const { data: session } = useSession()

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-slate-100">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">접근 권한이 없습니다</h1>
          <p className="text-slate-500 text-sm">
            {session?.user?.email ? (
              <>
                <span className="font-medium text-slate-700">{session.user.email}</span> 계정은
                <br />서비스 접근 허용 목록에 등록되지 않았습니다.
              </>
            ) : (
              '서비스 접근 허용 목록에 등록된 사용자만 이용 가능합니다.'
            )}
          </p>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col gap-3">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
          >
            로그아웃
          </button>
          <Link
            href="/"
            className="w-full block bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all duration-200"
          >
            홈으로 돌아가기
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          접근이 필요한 경우 관리자에게 문의하세요.
        </p>
      </div>
    </main>
  )
}
