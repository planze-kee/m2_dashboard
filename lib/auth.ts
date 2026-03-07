import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { isEmailAllowed } from './db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      const allowed = await isEmailAllowed(user.email)
      if (!allowed) {
        // 로그인은 허용하되, 세션에 허용 여부를 담아 전달
        return true
      }
      return true
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.isAllowed = await isEmailAllowed(user.email)
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { isAllowed?: boolean }).isAllowed = token.isAllowed as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
  },
}
