# MongoDB Users Collection Schema for JWT + Passkey Authentication

## Comprehensive Users Collection Schema

```javascript
{
  _id: ObjectId,
  
  // Basic User Information
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 50,
    trim: true,
    lowercase: true
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Authentication - Password (optional for passkey-only users)
  password: {
    type: String,
    minlength: 8,
    // Will be hashed using bcrypt before storage
    select: false // Don't return password in queries by default
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Role-based Access Control
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  
  permissions: [{
    type: String,
    enum: [
      'forms:read',
      'forms:write', 
      'forms:delete',
      'form-data:read',
      'form-data:write',
      'form-data:delete',
      'users:read',
      'users:write',
      'admin:dashboard'
    ]
  }],
  
  // Passkey Authentication (WebAuthn/FIDO2)
  passkeys: [{
    credentialId: {
      type: String,
      required: true,
      unique: true
    },
    publicKey: {
      type: String,
      required: true
    },
    counter: {
      type: Number,
      default: 0
    },
    deviceType: {
      type: String,
      enum: ['platform', 'cross-platform'],
      default: 'platform'
    },
    friendlyName: {
      type: String,
      default: 'Security Key'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsed: {
      type: Date,
      default: null
    }
  }],
  
  // JWT Refresh Tokens (for secure token management)
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    deviceInfo: {
      userAgent: String,
      ip: String,
      location: String
    },
    isRevoked: {
      type: Boolean,
      default: false
    }
  }],
  
  // Security & Audit
  loginHistory: [{
    loginAt: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['password', 'passkey', 'refresh_token'],
      required: true
    },
    deviceInfo: {
      userAgent: String,
      ip: String,
      location: String
    },
    success: {
      type: Boolean,
      default: true
    }
  }],
  
  securitySettings: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: {
      type: String,
      select: false
    },
    passwordChangeRequired: {
      type: Boolean,
      default: false
    },
    accountLocked: {
      type: Boolean,
      default: false
    },
    lockUntil: {
      type: Date,
      default: null
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    }
  },
  
  // Account Management
  emailVerification: {
    token: {
      type: String,
      select: false
    },
    expiresAt: {
      type: Date,
      select: false
    }
  },
  
  passwordReset: {
    token: {
      type: String,
      select: false
    },
    expiresAt: {
      type: Date,
      select: false
    }
  },
  
  // Profile Information
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    company: String,
    jobTitle: String,
    phone: String,
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },
  
  // Preferences
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
      formSubmissions: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      profileVisible: {
        type: Boolean,
        default: false
      },
      activityVisible: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  lastLoginAt: {
    type: Date,
    default: null
  }
}
```

## Indexes for Performance

```javascript
// Unique indexes
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });

// Authentication indexes
db.users.createIndex({ "passkeys.credentialId": 1 }, { unique: true, sparse: true });
db.users.createIndex({ "refreshTokens.token": 1 }, { sparse: true });

// Query performance indexes
db.users.createIndex({ "isActive": 1, "role": 1 });
db.users.createIndex({ "createdAt": -1 });
db.users.createIndex({ "lastLoginAt": -1 });

// Security indexes
db.users.createIndex({ "securitySettings.accountLocked": 1 });
db.users.createIndex({ "emailVerification.expiresAt": 1 }, { expireAfterSeconds: 0 });
db.users.createIndex({ "passwordReset.expiresAt": 1 }, { expireAfterSeconds: 0 });

// Cleanup indexes (TTL for expired tokens)
db.users.createIndex({ "refreshTokens.expiresAt": 1 }, { expireAfterSeconds: 0 });
```

## Schema Features

### 🔐 Security Features
- **Passkey Support**: Full WebAuthn/FIDO2 credential storage
- **JWT Refresh Tokens**: Secure token rotation with device tracking
- **Password Hashing**: bcrypt-ready password field
- **Account Locking**: Brute force protection
- **Audit Trail**: Login history and security events

### 👤 User Management
- **Role-based Access**: Flexible permission system
- **Profile Management**: Comprehensive user profiles
- **Email Verification**: Account verification workflow
- **Password Reset**: Secure password recovery

### 🎯 Modern Features
- **Multi-device Support**: Track and manage multiple devices
- **Passkey-first**: Optional password for passkey-only accounts
- **Privacy Controls**: User-controlled visibility settings
- **Internationalization**: Language and timezone support

### 📊 Analytics Ready
- **Login Analytics**: Track authentication methods and success rates
- **Device Analytics**: Monitor device usage patterns
- **Security Analytics**: Track security events and threats

## Implementation Benefits

1. **Scalable**: Supports growth from simple auth to enterprise features
2. **Secure**: Industry-standard security practices built-in
3. **Flexible**: Supports both password and passwordless authentication
4. **Compliant**: Ready for GDPR, SOC2, and other compliance requirements
5. **Future-proof**: Extensible schema for new authentication methods
