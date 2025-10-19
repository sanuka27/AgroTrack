# AI Smart Suggestions System

## Overview
The AI Smart Suggestions system analyzes your plants and provides personalized care recommendations using Google's Gemini AI. All suggestions are stored in the database for tracking and future reference.

## Features

### 1. **Automatic Plant Analysis**
The system analyzes multiple factors for each plant:
- **Health Score** (0-100): Based on plant health status
- **Growth Rate**: Percentage growth this month
- **Watering Status**: Days since last watered vs. watering schedule
- **Fertilizer Status**: Weeks since last fertilized vs. fertilizer schedule
- **Sunlight Exposure**: Current sunlight requirements
- **Risk Level**: Low, medium, or high based on overall condition

### 2. **AI-Generated Suggestion Types**

#### 🔆 Pro Tip
- **When**: Plant is healthy (health score ≥ 70)
- **Purpose**: Advanced care tips to optimize growth
- **Priority**: Low
- **Example**: "Add coffee grounds to soil for nitrogen boost"

#### 🌱 Growth Insight
- **When**: Significant growth change (>15% increase/decrease)
- **Purpose**: Explain growth patterns and recommend actions
- **Priority**: Medium (High if declining)
- **Example**: "Plants near east window growing 23% faster this month!"

#### ⚠️ Alert
- **When**: Plant needs watering
- **Purpose**: Remind about watering with optimal techniques
- **Priority**: High
- **Example**: "Water your Monstera - soil moisture is getting low"

#### 📅 Care Reminder
- **When**: Plant needs fertilizing
- **Purpose**: Fertilizer reminders with best practices
- **Priority**: Medium
- **Example**: "Weekly feeding schedule for Tomato plants"

#### 🚨 Health Warning
- **When**: Health score < 50
- **Purpose**: Alert about health issues with immediate action steps
- **Priority**: Urgent
- **Example**: "Fiddle Leaf Fig shows signs of overwatering. Reduce frequency by 2 days."

### 3. **Database Storage**

All suggestions are saved in MongoDB collection `ai_suggestions`:

```typescript
{
  userId: ObjectId,
  plantId: ObjectId,
  type: 'pro_tip' | 'growth_insight' | 'alert' | 'care_reminder' | 'health_warning',
  title: string,
  message: string,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  confidence: number (0-1),
  analysisData: {
    healthScore: number,
    growthRate: number,
    lastWatered: Date,
    lastFertilized: Date,
    sunlightExposure: string
  },
  aiModel: 'gemini-pro',
  isRead: boolean,
  isDismissed: boolean,
  isActioned: boolean,
  expiresAt: Date
}
```

### 4. **API Endpoints**

#### Generate Suggestions
```http
POST /api/ai/suggestions/generate
Authorization: Bearer {token}
Body: { plantId?: string }  // Optional: analyze specific plant
```

#### Get Suggestions
```http
GET /api/ai/suggestions
Authorization: Bearer {token}
Query: ?includeRead=false&includeDismissed=false&limit=10
```

#### Mark as Read
```http
PUT /api/ai/suggestions/:id/read
Authorization: Bearer {token}
```

#### Dismiss Suggestion
```http
PUT /api/ai/suggestions/:id/dismiss
Authorization: Bearer {token}
```

#### Mark as Actioned
```http
PUT /api/ai/suggestions/:id/action
Authorization: Bearer {token}
```

## How It Works

### Analysis Flow
1. **Fetch Plants**: Get user's plant collection from database
2. **Analyze Condition**: Calculate health metrics for each plant
3. **Generate Prompts**: Create AI prompts based on plant conditions
4. **Call Gemini AI**: Send prompts to Google Gemini Pro model
5. **Parse Response**: Extract suggestions from AI response
6. **Save to Database**: Store suggestions with metadata
7. **Return to User**: Display in dashboard UI

### Priority Calculation
- **Urgent**: Health score < 50 (health warnings)
- **High**: Needs water or declining growth
- **Medium**: Needs fertilizer or moderate insights
- **Low**: General tips for healthy plants

### Expiration Logic
- **Alerts**: Expire in 1 day (time-sensitive)
- **Care Reminders**: Expire in 3 days
- **Pro Tips & Insights**: Expire in 7 days
- MongoDB TTL index automatically removes expired suggestions

## UI Components

### AISmartSuggestionsCard
Located in: `Frontend/src/components/AISmartSuggestionsCard.tsx`

Features:
- Display up to 3 active suggestions
- Color-coded by priority
- Icons for each suggestion type
- "Generate" button to trigger new analysis
- "Done" and "Dismiss" actions
- Shows plant name and suggestion type badge

### Integration
Added to Plants page (MyPlants) in right column above reminders. The standalone `UserDashboard` page has been deprecated — the Plants page (`/plants`) now serves as the canonical user dashboard.

## Configuration

### Environment Variables
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### AI Model
- **Model**: gemini-pro (Google Generative AI)
- **Purpose**: Text generation for care advice
- **Context**: Plant data + analysis metrics

## Example Workflow

1. User clicks "Generate" in AI Suggestions card
2. Backend analyzes all user's plants (up to 20)
3. For each plant:
   - Calculate health score, growth rate, watering status
   - Determine which suggestions are needed
   - Generate AI prompts with plant context
   - Call Gemini API with prompts
   - Parse and save suggestions
4. Frontend displays grouped suggestions:
   - Pro Tips (yellow icon)
   - Growth Insights (purple icon)
   - Alerts (orange icon)
   - Care Reminders (blue icon)
   - Health Warnings (red icon)
5. User can:
   - Mark as "Done" (removes and marks actioned)
   - Dismiss (removes from view)
   - Read suggestion details

## Benefits

✅ **Personalized**: Based on actual plant data and conditions
✅ **Proactive**: Identifies issues before they become serious
✅ **Educational**: Teaches better plant care practices
✅ **Time-saving**: No need to research each plant individually
✅ **Actionable**: Provides specific steps to take
✅ **Trackable**: Stored in database for analytics
✅ **Smart**: Uses AI to understand plant context

## Future Enhancements

- [ ] Image analysis integration (detect pests, diseases)
- [ ] Seasonal suggestions based on weather
- [ ] Learning from user actions (feedback loop)
- [ ] Suggestion history and analytics
- [ ] Custom AI models for specific plant types
- [ ] Multi-language support
- [ ] Voice suggestions via notifications

## Technical Details

### Files Created
- `Backend/src/models/AISmartSuggestion.ts` - Database model
- `Backend/src/ai/smartSuggestions.ts` - Analysis and generation service
- `Backend/src/controllers/aiSuggestionsController.ts` - API handlers
- `Backend/src/routes/aiSuggestionsRoutes.ts` - Route definitions
- `Frontend/src/api/aiSuggestions.ts` - API client
- `Frontend/src/components/AISmartSuggestionsCard.tsx` - UI component

### Dependencies
- `@google/generative-ai` - Gemini AI SDK
- MongoDB with TTL indexes
- Express.js routes with auth middleware
- React hooks (useState, useEffect)
- shadcn/ui components

---

**Created**: October 20, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
