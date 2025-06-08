import { NextAuthOptions } from 'next-auth'
// import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
// import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Disabled until database is configured
  providers: [
    // CredentialsProvider disabled until database is configured
    // CredentialsProvider({
    //   name: 'credentials',
    //   credentials: {
    //     email: { label: 'Email', type: 'email' },
    //     password: { label: 'Password', type: 'password' }
    //   },
    //   async authorize(credentials) {
    //     if (!credentials?.email || !credentials?.password) {
    //       return null
    //     }

    //     const user = await prisma.user.findUnique({
    //       where: {
    //         email: credentials.email
    //       }
    //     })

    //     if (!user || !user.password) {
    //       return null
    //     }

    //     const isPasswordValid = await bcrypt.compare(
    //       credentials.password,
    //       user.password
    //     )

    //     if (!isPasswordValid) {
    //       return null
    //     }

    //     return {
    //       id: user.id,
    //       email: user.email,
    //       name: user.name,
    //       role: user.role,
    //     }
    //   }
    // }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub!
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}