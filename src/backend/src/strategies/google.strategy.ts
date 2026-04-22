import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { config } from '../config/env';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'));
        }

        const oauthProfile = {
          id: profile.id,
          email,
          name: profile.displayName || email,
          avatarUrl: profile.photos?.[0]?.value,
        };

        return done(null, oauthProfile as any);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export default passport;
