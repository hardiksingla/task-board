import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/db";
// import { redirect } from "next/dist/server/api-utils";
// import { sign } from "crypto";

const authOptions = {
  providers: [    
    CredentialsProvider({
            name:"Email",
            credentials: {
                email: { label: "Email", type: "text" , placeholder: "Email" },
                password: { label: "Password", type: "password", placeholder: "Password" }
            },
            async authorize(credentials : any) {
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email,
                            password: credentials.password 
                        }
                })
                console.log(user)
                if (!user) {
                    console.log("User not found")
                    return null
                }
                console.log("User found")
                return user
            }
        }),
        
    GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "" 
    }),
  ],
    callbacks :{
        async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
            if (url === '/api/auth/signin') {
                return baseUrl
            }
            return baseUrl
        },
        async session({ session, token } : { session: any; token: any }) {
            if (token) {
                session.user.id = token.sub
                session.user.image = token.picture
            }
            return session
        },
        async signIn({ user, account, profile, email, credentials }: { user?: any; account: any; profile?: any; email?: any; credentials?: any }) {
            if (account?.provider === "google" && profile) {
                console.log("Google sign in")
                const existingUser = await prisma.user.findUnique({
                    where: { email: profile.email }
                })
                if (!existingUser) {
                    console.log({
                            name: profile.name,
                            email: profile.email,
                            image: profile.picture
                        })
                    await prisma.user.create({
                        data: {
                            name: profile.name,
                            email: profile.email,
                            image: profile.picture
                        }
                    })
                }
            }
            return true
        }
    },   
  
  secret: process.env.NEXTAUTH_SECRET|| "",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }