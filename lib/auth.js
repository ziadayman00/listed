import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // When using database sessions, we get the user object instead of token
      // Add user id to session for easier access
      if (user) {
        session.user.id = user.id
      }
      return session
    },
    async signIn({ user, account, profile, isNewUser }) {
      try {
        // Auto-verify new OAuth users since they're already verified by the provider
        if (isNewUser && user?.email && (account?.provider === 'google' || account?.provider === 'github')) {
          // Give NextAuth time to create the user, then verify them
          setTimeout(async () => {
            try {
              await prisma.user.update({
                where: { email: user.email },
                data: { emailVerified: new Date() }
              })
              console.log(`✅ Auto-verified new OAuth user: ${user.email} (${account.provider})`)
            } catch (error) {
              console.error('Error auto-verifying new user:', error)
            }
          }, 1000) // 1 second delay to ensure user is created
        }

        // Log user activity (works with database sessions)
        if (user?.email && account?.provider) {
          // Use setTimeout to ensure the user is fully created in the database
          setTimeout(async () => {
            try {
              const dbUser = await prisma.user.findUnique({
                where: { email: user.email }
              })
              
              if (dbUser) {
                const activityType = isNewUser ? 'REGISTER' : 'LOGIN'
                const description = isNewUser 
                  ? `New user registered via ${account.provider}`
                  : `User signed in via ${account.provider}`
                
                await prisma.userActivity.create({
                  data: {
                    userId: dbUser.id,
                    type: activityType,
                    description: description,
                    metadata: {
                      provider: account.provider,
                      providerAccountId: account.providerAccountId,
                      email: user.email,
                      name: user.name,
                      isNewUser: isNewUser || false,
                      timestamp: new Date().toISOString()
                    }
                  }
                })
                
                console.log(`✅ User activity logged: ${activityType} for ${user.email}`)
              }
            } catch (error) {
              console.error('Error logging user activity:', error)
              // Don't block sign-in if activity logging fails
            }
          }, 1500) // 1.5 second delay to ensure user and account are created
        }
      } catch (error) {
        console.error('Error in signIn callback:', error)
      }
      
      return true
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
