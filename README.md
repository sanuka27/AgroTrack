# 🌱 AgroTrack - AI-Powered Smart Gardening Platform

<div align="center">

**University Project - Full-Stack Web Application**

*AI-powered plant care, disease detection, and community platform built with React, Node.js, and MongoDB*

---

</div>

## 🌟 **Key Features**

### 🤖 **AI-Powered Plant Care**
- **Disease Detection**: Upload plant photos for instant AI diagnosis using Google Gemini
- **Smart Recommendations**: Get personalized care tips and treatment suggestions
- **Plant Identification**: AI-powered plant species recognition and care guides

### 📊 **Comprehensive Plant Management**
- **Plant Database**: Extensive collection of plant species with detailed care information
- **Care Tracking**: Log watering, fertilizing, and maintenance activities
- **Growth Monitoring**: Track plant health and growth progress over time
- **Custom Reminders**: Intelligent notifications for plant care tasks

### 👥 **Community & Social Features**
- **Discussion Forums**: Reddit-style community with upvoting and comments
- **Expert Advice**: Connect with fellow gardeners and plant experts
- **Plant Sharing**: Share your garden successes and get feedback
- **Hashtag System**: Discover content with trending plant topics

### 📈 **Analytics & Insights**
- **Plant Health Dashboard**: Visual analytics of your garden's performance
- **Care History**: Detailed logs and trends of plant maintenance
- **Growth Analytics**: Monitor plant development and health metrics
- **Custom Reports**: Export data for gardening journals

### 🔐 **Admin & Moderation**
- **Admin Dashboard**: Complete user and content management system
- **Moderation Tools**: Community content moderation and reporting
- **User Management**: Role-based access control and permissions
- **Analytics Overview**: Platform-wide usage statistics

---

## 🏗️ **Architecture & Tech Stack**

### **Frontend** 🖥️
```typescript
React 18 + TypeScript + Vite
├── UI: Tailwind CSS + Shadcn/ui + Radix UI
├── State: TanStack Query + React Hook Form
├── Routing: React Router v6
├── Charts: Recharts
├── Icons: Lucide React
└── Images: Firebase Storage
```

### **Backend** ⚙️
```typescript
Node.js + Express + TypeScript
├── Database: MongoDB + Mongoose
├── Auth: JWT + Passport + Firebase Admin
├── AI: Google Gemini API
├── Cache: Redis
├── Security: Helmet + Rate Limiting + CSRF
├── Docs: Swagger/OpenAPI
└── Email: Nodemailer
```

### **Infrastructure** 🏭
```bash
├── Database: MongoDB Atlas
├── Cache: Redis Cloud
├── Storage: Firebase Storage
├── Hosting: Vercel/Netlify
└── Monitoring: Winston Logger
```

---

## 📁 **Project Structure**

```
AgroTrack/
├── 📁 Backend/                    # Node.js/Express API Server
│   ├── 📁 src/
│   │   ├── 📁 controllers/        # Route handlers
│   │   ├── 📁 models/            # MongoDB schemas
│   │   ├── 📁 routes/            # API endpoints
│   │   ├── 📁 middleware/        # Auth, validation, security
│   │   ├── 📁 utils/             # Helper functions
│   │   ├── � config/            # Database, auth, services
│   │   └── 📄 server.ts          # Main application entry
│   ├── 📄 package.json
│   └── 📄 tsconfig.json
│
├── 📁 Frontend/                   # React SPA
│   ├── 📁 src/
│   │   ├── 📁 components/        # Reusable UI components
│   │   ├── 📁 pages/            # Route components
│   │   ├── � hooks/            # Custom React hooks
│   │   ├── 📁 lib/              # Utilities & API clients
│   │   ├── 📁 contexts/         # React contexts
│   │   └── 📄 App.tsx           # Main app component
│   ├── � package.json
│   ├── 📄 tailwind.config.ts
│   └── 📄 vite.config.ts
│
├── 📁 public/                     # Static assets
├── 📁 logs/                       # Application logs
└── 📄 README.md                   # Project documentation
```

---

## 🚀 **Quick Start**

### **Prerequisites**
- **Node.js** 18+
- **MongoDB** database
- **Redis** instance
- **Firebase** project
- **Google AI** API key

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AgroTrack
   ```

2. **Backend Setup**
   ```bash
   cd Backend

   # Install dependencies
   npm install

   # Copy environment template
   cp .env.example .env

   # Configure your environment variables
   nano .env  # or your preferred editor
   ```

3. **Frontend Setup**
   ```bash
   cd ../Frontend

   # Install dependencies
   npm install

   # Copy environment template
   cp .env.example .env

   # Configure your environment variables
   nano .env  # or your preferred editor
   ```

4. **Database Setup**
   ```bash
   # The application will create collections automatically
   # Seed data is available via npm run seed (Backend)
   ```

### **Environment Configuration**

#### **Backend (.env)**
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agrotrack
REDIS_URL=redis://username:password@host:port

# Authentication
JWT_SECRET=your-super-secret-jwt-key
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security
SESSION_SECRET=your-session-secret
CSRF_SECRET=your-csrf-secret
```

#### **Frontend (.env)**
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### **Running the Application**

1. **Start Backend** (Terminal 1)
   ```bash
   cd Backend
   npm run dev
   ```
   Backend will be available at: `http://localhost:3001`

2. **Start Frontend** (Terminal 2)
   ```bash
   cd Frontend
   npm run dev
   ```
   Frontend will be available at: `http://localhost:8080`

3. **Access the Application**
   - 🌐 **Web App**: [http://localhost:8080](http://localhost:8080)
   - 📚 **API Docs**: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)

---

## � **API Documentation**

AgroTrack provides comprehensive API documentation via Swagger UI.

### **Core Endpoints**

#### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout

#### **Plants Management**
- `GET /api/plants` - List all plants
- `POST /api/plants` - Add new plant
- `GET /api/plants/:id` - Get plant details
- `PUT /api/plants/:id` - Update plant
- `DELETE /api/plants/:id` - Remove plant

#### **AI Features**
- `GET /api/ai/list-models` - List available AI models
- `POST /api/ai/plant/analyze` - Analyze plant health (image + text)
- `POST /api/ai/chat` - AI gardening assistant

#### **Community**
- `GET /api/community/posts` - Get forum posts
- `POST /api/community/posts` - Create new post
- `POST /api/community/posts/:id/vote` - Vote on posts
- `POST /api/community/posts/:id/comments` - Add comments

#### **Admin (Admin only)**
- `GET /api/admin/users` - User management
- `GET /api/admin/analytics` - Platform analytics
- `GET /api/admin/reports` - Moderation reports

---

## 🧪 **Testing**

### **Backend Testing**
```bash
cd Backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### **Frontend Testing**
```bash
cd Frontend
npm run lint          # ESLint check
npm run build         # Production build test
```

### **API Testing**
```bash
# Using the provided test script
node test-apis.js
```

---

## 🚢 **Deployment**

### **Production Build**

1. **Backend**
   ```bash
   cd Backend
   npm run build
   npm start
   ```

2. **Frontend**
   ```bash
   cd Frontend
   npm run build
   npm run preview  # Test production build locally
   ```

### **Deployment Options**
For university projects, consider deploying to:
- Local development environment
- University-provided hosting
- Free tier cloud services (with instructor approval)
- Docker containers for portability

### **Environment Variables for Production**
- Set `NODE_ENV=production`
- Use production database URLs
- Configure proper CORS origins
- Set secure session secrets
- Enable HTTPS redirects

---

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

### **Development Workflow**

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   npm run lint && npm test
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### **Commit Convention**
We follow [Conventional Commits](https://conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Testing
- `chore:` Maintenance

### **Code Style**
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb config with TypeScript
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality

---

## 📊 **Features Overview**

| Feature | Status | Description |
|---------|--------|-------------|
| 🔐 Authentication | ✅ Complete | JWT + Google OAuth + Firebase |
| 🌱 Plant Management | ✅ Complete | CRUD operations with images |
| 🤖 AI Plant Analysis | ✅ Complete | Gemini-powered disease detection |
| 👥 Community Forum | ✅ Complete | Reddit-style with voting |
| 📊 Analytics | ✅ Complete | Charts and insights dashboard |
| 📱 Mobile Responsive | ✅ Complete | Tailwind CSS responsive design |
| 🔒 Security | ✅ Complete | Rate limiting, CSRF, sanitization |
| 📧 Email Notifications | ✅ Complete | Nodemailer integration |
| 📚 API Documentation | ✅ Complete | Swagger/OpenAPI specs |
| 🧪 Testing Suite | 🚧 In Progress | Jest + Supertest coverage |

---

## 🐛 **Troubleshooting**

### **Common Issues**

**Backend won't start:**
```bash
# Check Node.js version
node --version  # Should be 18+

# Check environment variables
cat .env  # Ensure all required vars are set

# Check MongoDB connection
npm run dev  # Look for connection errors
```

**Frontend build fails:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run lint
```

**AI features not working:**
```bash
# Verify Gemini API key
echo $GEMINI_API_KEY

# Check API quota
# Visit: https://makersuite.google.com/app/apikey
```

**Database connection issues:**
```bash
# Test MongoDB connection
mongosh "your-connection-string"

# Check network access
telnet cluster.mongodb.net 27017
```

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Technologies & Libraries**

This project utilizes the following technologies and libraries:

- **Google Gemini AI** for plant analysis capabilities
- **MongoDB** for database management
- **Redis** for caching and session management
- **Firebase** for authentication and file storage
- **React & TypeScript** for frontend development
- **Node.js & Express** for backend API
- **Tailwind CSS & Shadcn/ui** for UI components

---

## 📞 **Project Information**

**University Project - Full-Stack Development Course**

For questions or support regarding this project, please contact your course instructor or project supervisor.

---

<div align="center">

**AgroTrack - University Project**

*Built for educational purposes*

[⬆️ Back to Top](#-agrotrack---ai-powered-smart-gardening-platform)

</div>
