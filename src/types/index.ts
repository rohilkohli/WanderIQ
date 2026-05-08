// ============================================================
// WanderIQ — Core TypeScript Types
// ============================================================

export type BudgetTier = 'economy' | 'mid-range' | 'luxury';
export type TravelStyle = 'adventure' | 'cultural' | 'wellness' | 'food' | 'beach' | 'wildlife' | 'city' | 'offbeat';
export type DietaryRestriction = 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'gluten-free' | 'none';
export type MobilityNeed = 'full' | 'wheelchair' | 'low-exertion';
export type GroupType = 'solo' | 'couple' | 'family' | 'friends' | 'corporate';
export type AccommodationType = 'hotel' | 'hostel' | 'boutique' | 'airbnb' | 'resort';
export type TransportType = 'flight' | 'train' | 'road' | 'combination';
export type Interest =
  | 'history' | 'architecture' | 'art' | 'nightlife'
  | 'hiking' | 'photography' | 'shopping' | 'literature' | 'music' | 'sports';

export interface DateRange {
  start: string; // ISO date string
  end:   string;
  flexible?: 'two-days' | 'one-week' | 'month';
}

export interface UserPreferences {
  budgetTier:       BudgetTier;
  dailyBudgetLimit?: number;
  currency:         'INR' | 'USD';
  travelStyle:      TravelStyle[];
  dietary:          DietaryRestriction[];
  mobility:         MobilityNeed;
  group:            GroupType;
  groupSize?:       number;
  kidAges?:         number[];
  accommodation:    AccommodationType[];
  transport:        TransportType[];
  interests:        Interest[];
  blacklist:        string[]; // Countries/cities to exclude
  homeCity?:        string;
  homeCityPlaceId?: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlacePhoto {
  photoReference: string;
  url: string;
  width:  number;
  height: number;
}

export interface OpeningHours {
  openNow: boolean;
  periods?: {
    open:  { day: number; time: string };
    close: { day: number; time: string };
  }[];
  weekdayDescriptions?: string[];
}

export type ActivityCategory =
  | 'restaurant' | 'attraction' | 'hotel' | 'transport'
  | 'experience' | 'shopping' | 'nightlife' | 'nature' | 'wellness';

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface ActivityCard {
  id:               string;
  placeId?:         string;
  name:             string;
  category:         ActivityCategory;
  description:      string;
  address:          string;
  location:         LatLng;
  photo?:           PlacePhoto;
  rating?:          number;
  priceLevel?:      1 | 2 | 3 | 4;
  openingHours?:    OpeningHours;
  duration:         number; // minutes
  startTime?:       string; // "HH:MM"
  endTime?:         string; // "HH:MM"
  estimatedCost?:   number;
  transitToNext?:   TransitInfo;
  isWheelchairAccessible?: boolean;
  tags?:            string[];
  notes?:           string;
  source:           'manual' | 'ai' | 'places';
}

export interface TransitInfo {
  durationMinutes: number;
  distanceKm:      number;
  mode:            'DRIVE' | 'WALK' | 'TRANSIT';
}

export interface ItineraryDay {
  id:        string;
  dayNumber: number;
  date?:     string;
  morning:   ActivityCard[];
  afternoon: ActivityCard[];
  evening:   ActivityCard[];
  notes?:    string;
  weather?:  WeatherData;
}

export interface BudgetBreakdown {
  flights:       number;
  accommodation: number;
  food:          number;
  activities:    number;
  transport:     number;
  miscellaneous: number;
}

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface Collaborator {
  uid:       string;
  email:     string;
  role:      CollaboratorRole;
  photoURL?: string;
  displayName?: string;
}

export interface Itinerary {
  id:           string;
  ownerUid:     string;
  title:        string;
  destination:  DestinationResult;
  dateRange:    DateRange;
  days:         ItineraryDay[];
  budget:       BudgetBreakdown;
  totalBudget:  number;
  collaborators?: Collaborator[];
  editorUids:  string[];
  viewerUids:  string[];
  isShared:    boolean;
  shareCode?:  string;
  createdAt:   string;
  updatedAt:   string;
  status:      'draft' | 'active' | 'completed';
  tags?:       string[];
}

export interface DestinationResult {
  id:           string;
  placeId?:     string;
  name:         string;
  country:      string;
  description:  string;
  heroImageUrl: string;
  location:     LatLng;
  rating?:      number;
  priceLevel?:  1 | 2 | 3 | 4;
  tags:         string[];
  matchScore:   number;
  matchReasons: string[];
  climate?:     ClimateSnapshot;
  bestFor?:     string[];
}

export interface ClimateSnapshot {
  tempMin:         number;
  tempMax:         number;
  rainProbability: number;
  condition:       'sunny' | 'cloudy' | 'rainy' | 'clear';
  description:     string;
}

export interface WeatherData {
  date:            string;
  tempMin:         number;
  tempMax:         number;
  rainProbability: number;
  condition:       string;
  conditionCode:   number;
  windspeedMax:    number;
}

export interface PackingItem {
  id:          string;
  name:        string;
  category:    string;
  checked:     boolean;
  isCustom:    boolean;
}

export interface PackingList {
  id:         string;
  itineraryId: string;
  categories: PackingCategory[];
  updatedAt:  string;
}

export interface PackingCategory {
  name:  string;
  items: PackingItem[];
  icon?: string;
}

export interface Comment {
  id:          string;
  authorUid:   string;
  authorName:  string;
  authorPhoto?: string;
  text:        string;
  createdAt:   string;
  updatedAt?:  string;
}

export interface ChatMessage {
  id:        string;
  role:      'user' | 'model';
  content:   string;
  timestamp: string;
  imageUrl?: string;
  isStreaming?: boolean;
}

export interface UserProfile {
  uid:         string;
  email:       string;
  displayName: string;
  photoURL?:   string;
  preferences: UserPreferences;
  onboarded:   boolean;
  createdAt:   string;
  updatedAt:   string;
  badges?:     string[];
}

export interface BudgetSuggestion {
  title:       string;
  description: string;
  savings:     number;
  impact:      'low' | 'medium' | 'high';
}

export interface WizardStep {
  step:     number;
  title:    string;
  subtitle: string;
}
