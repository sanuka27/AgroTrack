# AgroTrack Care Logging System

A comprehensive plant care tracking system that helps users monitor, analyze, and manage their plant care activities with detailed logging, analytics, and smart reminders.

## 🌟 Features

### Core Components

1. **CareLogModal** - Modal for logging new care activities
2. **CareTimeline** - Visual timeline of care history  
3. **CareAnalytics** - Analytics and patterns dashboard
4. **CareReminders** - Smart reminder system
5. **CareDashboard** - Full care management dashboard
6. **PlantCareSystem** - Integrated care widget for plant pages

### Care Types Supported

- **Watering** - Amount, method tracking
- **Fertilizing** - Type, concentration, application method
- **Pruning** - Type, parts removed, tools used
- **Repotting** - Pot sizes, soil type, root condition
- **Health Check** - Overall health, symptoms, measurements
- **Pest Treatment** - Pest type, treatment used
- **Soil Change** - New soil type, amendments
- **Location Change** - From/to locations, reason

### Key Features

- **Detailed Metadata** - Each care type has specific fields
- **Visual Timeline** - Chronological care history with metadata
- **Smart Analytics** - Care patterns, frequency analysis
- **Health Trends** - Track plant health over time
- **Reminder System** - Predictive care reminders
- **Photo Support** - Attach photos to care entries
- **Data Persistence** - localStorage-based storage

## 🚀 Quick Start

### Basic Integration

```tsx
import { PlantCareSystem } from '@/components/PlantCareSystem';

function PlantDetailPage({ plant }) {
  return (
    <div>
      <h1>{plant.name}</h1>
      <PlantCareSystem plant={plant} />
    </div>
  );
}
```

### Full Dashboard

```tsx
import { CareDashboard } from '@/components/CareDashboard';

function CareManagementPage({ plants, selectedPlantId }) {
  return (
    <CareDashboard 
      plants={plants}
      selectedPlantId={selectedPlantId}
      showAllPlants={false}
    />
  );
}
```

### Individual Components

```tsx
import { 
  CareLogModal, 
  CareTimeline, 
  CareAnalytics 
} from '@/components/care';

function CustomCarePage({ plant, careLogs }) {
  return (
    <div>
      <CareTimeline careLogs={careLogs} />
      <CareAnalytics careLogs={careLogs} />
    </div>
  );
}
```

## 📊 Data Structure

### CareLog Interface
```typescript
interface CareLog {
  id: string;
  plantId: string;
  careType: CareType;
  date: string; // ISO date string
  notes?: string;
  photos?: string[];
  metadata?: CareMetadata;
  createdAt: string;
  updatedAt?: string;
}
```

### Care Types
```typescript
type CareType = 
  | 'watering' 
  | 'fertilizing' 
  | 'pruning' 
  | 'repotting' 
  | 'health-check' 
  | 'pest-treatment' 
  | 'soil-change' 
  | 'location-change';
```

### Sample Metadata Structures

**Watering:**
```typescript
{
  waterAmount: 200, // ml
  wateringMethod: 'top-watering'
}
```

**Health Check:**
```typescript
{
  overallHealth: 'good',
  symptoms: ['yellowing leaves'],
  measurements: {
    height: 45, // cm
    leafCount: 12
  }
}
```

## 🛠️ Component APIs

### PlantCareSystem Props
```typescript
interface PlantCareSystemProps {
  plant: Plant;
  className?: string;
}
```

### CareDashboard Props
```typescript
interface CareDashboardProps {
  plants: Plant[];
  selectedPlantId?: string;
  showAllPlants?: boolean;
}
```

### CareTimeline Props
```typescript
interface CareTimelineProps {
  careLogs: CareLog[];
  onEditCareLog?: (careLog: CareLog) => void;
  onDeleteCareLog?: (careLogId: string) => void;
  showPlantName?: boolean;
  maxEntries?: number;
}
```

### CareAnalytics Props
```typescript
interface CareAnalyticsProps {
  careLogs: CareLog[];
  plantCareHistory?: PlantCareHistory;
  showOverallStats?: boolean;
}
```

### CareReminders Props
```typescript
interface CareRemindersProps {
  plants: Plant[];
  plantCareHistories: Record<string, PlantCareHistory>;
  onMarkComplete?: (plantId: string, careType: CareType) => void;
  onSnooze?: (plantId: string, careType: CareType, days: number) => void;
  showOnlyOverdue?: boolean;
}
```

## 📁 File Structure

```
src/
├── types/
│   └── care.ts                 # Care system type definitions
├── utils/
│   └── careUtils.ts           # Care utility functions
└── components/
    ├── CareLogModal.tsx       # Care entry modal
    ├── CareTimeline.tsx       # Timeline visualization
    ├── CareAnalytics.tsx      # Analytics dashboard
    ├── CareReminders.tsx      # Reminder system
    ├── CareDashboard.tsx      # Full dashboard
    ├── PlantCareSystem.tsx    # Integrated widget
    └── care/
        └── index.ts           # Export file
```

## 🎨 Styling

Components use Tailwind CSS and shadcn/ui components:
- **Cards** for containers
- **Badges** for care types and status
- **Progress bars** for analytics
- **Timeline connectors** for visual flow
- **Color coding** for care types and health status

### Care Type Colors
- Watering: Blue
- Fertilizing: Green  
- Health Check: Purple
- Pruning: Orange
- Pest Treatment: Red
- Repotting: Brown
- Soil Change: Yellow
- Location Change: Gray

## 📈 Analytics Features

### Care Statistics
- Total care events
- Care frequency (daily, weekly, monthly)
- Most common care type
- Care type breakdown with percentages

### Health Trends
- Improving/declining/stable based on health checks
- Pattern recognition for care frequency
- Predictive care scheduling

### Care Patterns
- Automatic frequency calculation
- Next suggested care dates
- Seasonal care recommendations

## 🔔 Reminder System

### Smart Reminders
- Based on historical care patterns
- Priority levels (high/medium/low)
- Overdue notifications
- Snooze functionality

### Reminder Logic
- Watering: High priority if >2 days overdue
- Health checks: Medium priority, high if >1 day overdue  
- Pruning/repotting: Low priority unless >7 days overdue
- Pest treatment: High priority if overdue

## 💾 Data Storage

### localStorage Structure
```typescript
// Key: 'agrotrack-care-logs'
CareLog[] // Array of all care logs across all plants
```

### Data Management
- Automatic save on new entries
- Plant-specific filtering
- Date-based sorting and filtering
- Cross-plant analytics support

## 🔧 Utility Functions

### Core Functions
- `createCareLog()` - Create new care entry
- `generatePlantCareHistory()` - Generate care patterns
- `getCareStatistics()` - Calculate care stats
- `formatCareType()` - Format care type display
- `getCareTypeColor()` - Get care type styling

### Pattern Recognition
- `getPlantCarePatterns()` - Analyze care patterns
- `calculateCareFrequency()` - Calculate average intervals
- `getRecentCareLogs()` - Filter recent activity

## 🎯 Usage Examples

### Adding Care System to Plant Page

```tsx
function PlantDetailPage({ plantId }) {
  const plant = getPlant(plantId);
  
  return (
    <div className="space-y-6">
      <PlantHeader plant={plant} />
      <PlantCareSystem plant={plant} />
      <PlantPhotos plant={plant} />
    </div>
  );
}
```

### Creating Care Analytics Dashboard

```tsx
function PlantAnalyticsPage({ plants }) {
  return (
    <CareDashboard 
      plants={plants}
      showAllPlants={true}
    />
  );
}
```

### Custom Care Timeline

```tsx
function PlantCareHistory({ plant, careLogs }) {
  const plantLogs = careLogs.filter(log => log.plantId === plant.id);
  
  return (
    <CareTimeline 
      careLogs={plantLogs}
      showPlantName={false}
      maxEntries={10}
    />
  );
}
```

## 🚨 Error Handling

Components include error boundaries and graceful fallbacks:
- Empty state displays for no data
- TypeScript type safety
- localStorage error handling
- Missing plant/data protection

## 🔮 Future Enhancements

- **Cloud Sync** - Backend integration
- **Photo Recognition** - AI-powered plant health analysis
- **Weather Integration** - Weather-based care suggestions
- **Community Features** - Share care tips and patterns
- **Export/Import** - Data backup and sharing
- **Mobile App** - React Native implementation

## 📝 License

Part of the AgroTrack plant management system.