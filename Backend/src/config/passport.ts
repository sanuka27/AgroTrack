import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || "dev-jwt"
};

passport.use(new JwtStrategy(opts as any, async (payload, done) => {
  try { return done(null, payload); } catch (err) { return done(err, false); }
}));

passport.serializeUser((user: any, done) => done(null, user?.id || user?._id || user));
passport.deserializeUser((obj: any, done) => done(null, obj));
