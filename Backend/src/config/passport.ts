import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '../models/User';
import { firebaseService } from './firebase';
import logger from './logger';

/**
 * Passport configuration for AgroTrack authentication
 * Handles Google OAuth and JWT strategies
 */

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    logger.info('Google OAuth authentication attempt', {
      googleId: profile.id,
      email: profile.emails?.[0]?.value
    });

    // Extract user information from Google profile
    const googleData = {
      googleId: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      avatar: profile.photos?.[0]?.value,
      locale: profile._json.locale,
      verified: profile.emails?.[0]?.verified || false
    };

    if (!googleData.email) {
      logger.error('Google OAuth: No email provided', { googleId: profile.id });
      return done(new Error('Email is required from Google account'), null);
    }

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { googleId: googleData.googleId },
        { email: googleData.email }
      ]
    });

    if (user) {
      // Update existing user with Google data if not already linked
      if (!user.googleId && user.email === googleData.email) {
        user.googleId = googleData.googleId;
        user.isEmailVerified = googleData.verified;
        user.avatar = user.avatar || googleData.avatar;
        user.lastLoginAt = new Date();
        await user.save();
        
        logger.info('Linked existing user with Google account', {
          userId: user._id,
          email: user.email
        });
      } else {
        // Update last login
        user.lastLoginAt = new Date();
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        email: googleData.email,
        name: googleData.name,
        firstName: googleData.firstName,
        lastName: googleData.lastName,
        avatar: googleData.avatar,
        googleId: googleData.googleId,
        isEmailVerified: googleData.verified,
        authProvider: 'google',
        role: 'user',
        preferences: {
          language: googleData.locale || 'en',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            reminders: true
          }
        },
        lastLoginAt: new Date()
      });

      await user.save();

      logger.info('Created new user via Google OAuth', {
        userId: user._id,
        email: user.email
      });

      // Create Firebase user if not exists
      try {
        await firebaseService.createUser({
          email: googleData.email,
          displayName: googleData.name,
          photoURL: googleData.avatar,
          emailVerified: googleData.verified
        });
      } catch (firebaseError: any) {
        // User might already exist in Firebase
        if (firebaseError.code !== 'auth/email-already-exists') {
          logger.warn('Failed to create Firebase user', {
            error: firebaseError,
            email: googleData.email
          });
        }
      }
    }

    // Set custom claims in Firebase for role-based access
    try {
      const firebaseUser = await firebaseService.getUserByEmail(user.email);
      await firebaseService.setCustomUserClaims(firebaseUser.uid, {
        role: user.role,
        userId: user._id.toString(),
        emailVerified: user.isEmailVerified
      });
    } catch (firebaseError) {
      logger.warn('Failed to set Firebase custom claims', {
        error: firebaseError,
        userId: user._id
      });
    }

    return done(null, user);
  } catch (error) {
    logger.error('Google OAuth strategy error', { error, profileId: profile.id });
    return done(error, null);
  }
}));

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET!,
  algorithms: ['HS256']
}, async (payload, done) => {
  try {
    // Extract user ID from JWT payload
    const userId = payload.sub || payload.userId;
    
    if (!userId) {
      logger.warn('JWT strategy: No user ID in payload', { payload });
      return done(null, false);
    }

    // Find user in database
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      logger.warn('JWT strategy: User not found', { userId });
      return done(null, false);
    }

    // Check if user is active
    if (user.status === 'suspended' || user.status === 'deleted') {
      logger.warn('JWT strategy: User account is inactive', {
        userId,
        status: user.status
      });
      return done(null, false);
    }

    // Verify token hasn't expired (additional check)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      logger.warn('JWT strategy: Token expired', { userId, exp: payload.exp });
      return done(null, false);
    }

    // Update last active timestamp
    user.lastActiveAt = new Date();
    await user.save();

    return done(null, user);
  } catch (error) {
    logger.error('JWT strategy error', { error, payload });
    return done(error, false);
  }
}));

// Firebase ID Token Strategy
passport.use('firebase-jwt', new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Firebase'),
  secretOrKey: process.env.JWT_SECRET!, // This won't be used for Firebase tokens
  passReqToCallback: true,
  algorithms: ['RS256'] // Firebase uses RS256
}, async (req, payload, done) => {
  try {
    // Extract Firebase ID token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Firebase ')) {
      return done(null, false);
    }

    const firebaseToken = authHeader.substring(9); // Remove 'Firebase ' prefix

    // Verify Firebase ID token
    const decodedToken = await firebaseService.verifyIdToken(firebaseToken);
    
    // Find user by Firebase UID or email
    let user = await User.findOne({
      $or: [
        { firebaseUid: decodedToken.uid },
        { email: decodedToken.email }
      ]
    }).select('-password');

    if (!user && decodedToken.email) {
      // Create new user from Firebase token
      user = new User({
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        avatar: decodedToken.picture,
        firebaseUid: decodedToken.uid,
        isEmailVerified: decodedToken.email_verified || false,
        authProvider: 'firebase',
        role: 'user',
        lastLoginAt: new Date()
      });

      await user.save();

      logger.info('Created new user from Firebase token', {
        userId: user._id,
        email: user.email,
        firebaseUid: decodedToken.uid
      });
    } else if (user && !user.firebaseUid) {
      // Link existing user with Firebase
      user.firebaseUid = decodedToken.uid;
      user.isEmailVerified = decodedToken.email_verified || user.isEmailVerified;
      user.lastLoginAt = new Date();
      await user.save();
    }

    if (!user) {
      logger.warn('Firebase JWT strategy: User not found', {
        uid: decodedToken.uid,
        email: decodedToken.email
      });
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    logger.error('Firebase JWT strategy error', { error });
    return done(error, false);
  }
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    logger.error('Passport deserialize user error', { error, userId: id });
    done(error, null);
  }
});

export default passport;