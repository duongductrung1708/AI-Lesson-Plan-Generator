import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.model';
import { generateToken } from '../controllers/auth.controller';

// Load environment variables
dotenv.config();

// Only initialize Google Strategy if credentials are provided
// Trim values to handle whitespace
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

if (googleClientId && googleClientSecret) {
  const callbackURL = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
  
  console.log('Google OAuth Callback URL:', callbackURL);
  console.log('⚠️  IMPORTANT: Make sure this exact URL is added to Google Cloud Console:');
  console.log('   - Go to: https://console.cloud.google.com/apis/credentials');
  console.log('   - Edit your OAuth 2.0 Client ID');
  console.log('   - Add to "Authorized redirect URIs":', callbackURL);
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists with Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with email
          user = await User.findOne({ email: profile.emails?.[0]?.value });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.avatar = profile.photos?.[0]?.value;
            user.isActive = true; // Google accounts are auto-activated
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            name: profile.displayName || profile.name?.givenName || 'User',
            email: profile.emails?.[0]?.value,
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value,
            isActive: true, // Google accounts are auto-activated
          });

          return done(null, user);
        } catch (error: any) {
          return done(error, false);
        }
      }
    )
  );
  console.log('Google OAuth strategy initialized');
} else {
  console.warn('Google OAuth credentials not found. Google login will be disabled.');
  console.warn('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file');
  if (process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_SECRET) {
    console.warn(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'Set (but may be empty)' : 'Not set'}`);
    console.warn(`GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? 'Set (but may be empty)' : 'Not set'}`);
  }
}

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});

export default passport;

