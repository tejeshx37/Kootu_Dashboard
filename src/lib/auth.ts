import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@kootu.in';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        if (credentials.email === adminEmail && credentials.password === adminPassword) {
          return { id: 'admin', email: adminEmail, name: 'Admin' };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) session.user.email = token.email as string;
      return session;
    },
  },
};
