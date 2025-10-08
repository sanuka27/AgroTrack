import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User";
import { logger } from "./logger";

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || "dev-jwt"
};

passport.use(new JwtStrategy(opts as any, async (payload, done) => {
  try { return done(null, payload); } catch (err) { return done(err, false); }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      // Check if user exists with same email
      user = await User.findOne({ email: profile.emails?.[0]?.value });

      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.authProvider = 'google';
        await user.save();
      } else {
        // Create new user
        user = new User({
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          googleId: profile.id,
          authProvider: 'google',
          status: 'active',
          isEmailVerified: true, // Google accounts are pre-verified
          avatar: profile.photos?.[0]?.value
        });
        await user.save();
      }
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    await user.save();

    logger.info(`Google OAuth user authenticated: ${user.email}`);
    return done(null, user);
  } catch (error) {
    logger.error('Google OAuth strategy error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user: any, done) => done(null, user?.id || user?._id || user));
passport.deserializeUser((obj: any, done) => done(null, obj));
