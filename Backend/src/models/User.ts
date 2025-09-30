import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// User role types matching frontend AuthContext
export type UserRole = 'guest' | 'user' | 'admin';

// Interface for User document
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  isEmailVerified: boolean;
  
  // Profile information
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  
  // Account status
  isActive: boolean;
  lastLogin?: Date;
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
    required: [true, 'Password is required'],
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
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: {
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
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
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
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to generate authentication token
userSchema.methods.generateAuthToken = function(): string {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
  });
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function(): string {
  const payload = {
    id: this._id,
    type: 'refresh'
  };
  
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
  
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

// Override toJSON to exclude sensitive information
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  
  // Remove sensitive fields
  delete userObject.password;
  delete userObject.refreshTokens;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  delete userObject.__v;
  
  return userObject;
};

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

// Create and export the model
export const User = mongoose.model<IUser>('User', userSchema);