import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

// User role types matching frontend AuthContext
export type UserRole = 'guest' | 'user' | 'admin';

// Interface for User document
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  id: string; // Virtual getter for _id
  email: string;
  password?: string; // Optional for OAuth users
  name: string;
  role: UserRole;
  isEmailVerified: boolean;
  
  // Profile information
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  firstName?: string;
  lastName?: string;
  
  // OAuth & Firebase integration
  googleId?: string;
  firebaseUid?: string;
  authProvider: 'local' | 'google' | 'firebase';
  
  // Account status
  isActive: boolean;
  status: 'active' | 'suspended' | 'deleted';
  lastLogin?: Date;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  
  // Preferences
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      inApp: boolean;
      marketing: boolean;
    };
    privacy: {
      showProfile: boolean;
      showPlants: boolean;
      showActivity: boolean;
    };
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
  };
  
  // Direct access fields for compatibility
  timezone?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'auto';
  stats?: any; // For analytics
  passwordChangedAt?: Date;
  
  // Authentication tokens
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateRefreshToken(): string;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
  toJSON(): any;
}

// User schema definition
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  
  password: {
    type: String,
    required: false, // Optional for OAuth users
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  role: {
    type: String,
    enum: ['guest', 'user', 'admin'],
    default: 'user'
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Profile information
  avatar: {
    type: String,
    default: null
  },
  
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    default: ''
  },
  
  website: {
    type: String,
    maxlength: [200, 'Website URL cannot exceed 200 characters'],
    default: ''
  },
  
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  // OAuth & Firebase integration
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allow multiple null values
  },
  
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },
  
  authProvider: {
    type: String,
    enum: ['local', 'google', 'firebase'],
    default: 'local'
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  
  lastLogin: {
    type: Date,
    default: null
  },
  
  lastLoginAt: {
    type: Date,
    default: null
  },
  
  lastActiveAt: {
    type: Date,
    default: null
  },
  
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: {
    type: Date,
    default: null
  },
  
  // User preferences
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      inApp: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      showProfile: {
        type: Boolean,
        default: true
      },
      showPlants: {
        type: Boolean,
        default: true
      },
      showActivity: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    }
  },
  
  // Authentication tokens
  emailVerificationToken: {
    type: String,
    default: null
  },
  
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  
  passwordResetToken: {
    type: String,
    default: null
  },
  
  passwordResetExpires: {
    type: Date,
    default: null
  },
  
  refreshTokens: [{
    type: String
  }]
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function(this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new) and exists
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    // If no password is set (OAuth user), return false
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to generate authentication token
userSchema.methods.generateAuthToken = function(): string {
  const payload = {
    id: this._id.toString(),
    email: this.email,
    role: this.role
  };
  
  const options: SignOptions = {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
  } as SignOptions;
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', options);
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function(): string {
  const payload = {
    id: this._id.toString(),
    type: 'refresh'
  };
  
  const options: SignOptions = {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  } as SignOptions;
  
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'default-refresh-secret', options);
  
  // Add refresh token to user's refresh tokens array
  this.refreshTokens.push(refreshToken);
  
  // Keep only the last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  
  return refreshToken;
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function(): string {
  const token = jwt.sign(
    { id: this._id, type: 'email-verification' },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
  
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function(): string {
  const token = jwt.sign(
    { id: this._id, type: 'password-reset' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
  
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  return token;
};

// toJSON method is handled by schema.set('toJSON') below

// Static method to find user by credentials
userSchema.statics.findByCredentials = async function(email: string, password: string) {
  const user = await this.findOne({ email, isActive: true }).select('+password');
  
  if (!user) {
    throw new Error('Invalid login credentials');
  }
  
  // Check if account is locked
  if (user.isLocked) {
    throw new Error('Account is temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    // Increment login attempts
    user.loginAttempts += 1;
    
    // Lock account after 5 failed attempts for 2 hours
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    }
    
    await user.save();
    throw new Error('Invalid login credentials');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
  }
  
  user.lastLogin = new Date();
  await user.save();
  
  return user;
};

// Virtual for id field (compatibility with frontend)
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc: any, ret: any) {
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.emailVerificationToken;
    delete ret.passwordResetToken;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    return ret;
  }
});

// Create and export the model
export const User = mongoose.model<IUser>('User', userSchema);