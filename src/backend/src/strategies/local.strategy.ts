import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      session: false,
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.passwordHash) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, { userId: user.id } as Express.User);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export default passport;
