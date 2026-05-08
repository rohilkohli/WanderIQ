// ============================================================
// WanderIQ — Core TypeScript Types
// ============================================================

/**
 * Supported budget tiers for trip planning.
 * @returns The budget tier string
 */
export type BudgetTier = 'economy' | 'mid-range' | 'luxury';

/**
 * Types of travel styles preferred by the user.
 * @returns The travel style string
 */
export type TravelStyle = 'adventure' | 'cultural' | 'wellness' | 'food' | 'beach' | 'wildlife' | 'city' | 'offbeat';

/**
 * Dietary restrictions for food recommendations.
 * @returns The dietary restriction string
 */
export type DietaryRestriction = 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'gluten-free' | 'none';

/**
 * User mobility needs.
 * @returns The mobility need string
 */
export type MobilityNeed = 'full' | 'wheelchair' | 'low-exertion';

/**
 * Type of group traveling.
 * @returns The group type string
 */
export type GroupType = 'solo' | 'couple' | 'family' | 'friends' | 'corporate';

/**
 * Preferred accommodation types.
 * @returns The accommodation type string
 */
export type AccommodationType = 'hotel' | 'hostel' | 'boutique' | 'airbnb' | 'resort';

/**
 * Preferred modes of transportation.
 * @returns The transport type string
 */
export type TransportType = 'flight' | 'train' | 'road' | 'combination';

/**
 * Specific user interests for activities.
 * @returns The interest string
 */
export type Interest =
  | 'history' | 'architecture' | 'art' | 'nightlife'
  | 'hiking' | 'photography' | 'shopping' | 'literature' | 'music' | 'sports';

/**
 * Represents a date range for a trip.
 * @returns The DateRange object
 */
export interface DateRange {
  start: string; // ISO date string
  end:   string;
  flexible?: 'two-days' | 'one-week' | 'month';
}

/**
 * Comprehensive user travel preferences.
 * @returns The UserPreferences object
 */
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

/**
 * Geographic coordinates.
 * @returns The LatLng object
 */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Details for a place photo from Google Places API.
 * @returns The PlacePhoto object
 */
export interface PlacePhoto {
  photoReference: string;
  url: string;
  width:  number;
  height: number;
}

/**
 * Operating hours for a place or activity.
 * @returns The OpeningHours object
 */
export interface OpeningHours {
  openNow: boolean;
  periods?: {
    open:  { day: number; time: string };
    close: { day: number; time: string };
  }[];
  weekdayDescriptions?: string[];
}

/**
 * Categorization of itinerary activities.
 * @returns The ActivityCategory string
 */
export type ActivityCategory =
  | 'restaurant' | 'attraction' | 'hotel' | 'transport'
  | 'experience' | 'shopping' | 'nightlife' | 'nature' | 'wellness';

/**
 * Chronological time slot in a day.
 * @returns The TimeSlot string
 */
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

/**
 * Representation of a planned activity within an itinerary.
 * @returns The ActivityCard object
 */
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

/**
 * Transit information between two locations.
 * @returns The TransitInfo object
 */
export interface TransitInfo {
  durationMinutes: number;
  distanceKm:      number;
  mode:            'DRIVE' | 'WALK' | 'TRANSIT';
}

/**
 * Represents a single day within an itinerary.
 * @returns The ItineraryDay object
 */
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

/**
 * Budget breakdown by category.
 * @returns The BudgetBreakdown object
 */
export interface BudgetBreakdown {
  flights:       number;
  accommodation: number;
  food:          number;
  activities:    number;
  transport:     number;
  miscellaneous: number;
}

/**
 * Role of a collaborator on a shared itinerary.
 * @returns The CollaboratorRole string
 */
export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

/**
 * Information about a user collaborating on an itinerary.
 * @returns The Collaborator object
 */
export interface Collaborator {
  uid:       string;
  email:     string;
  role:      CollaboratorRole;
  photoURL?: string;
  displayName?: string;
}

/**
 * Complete representation of a trip itinerary.
 * @returns The Itinerary object
 */
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

/**
 * Destination result from a search or AI suggestion.
 * @returns The DestinationResult object
 */
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

/**
 * Historical climate averages for a destination.
 * @returns The ClimateSnapshot object
 */
export interface ClimateSnapshot {
  tempMin:         number;
  tempMax:         number;
  rainProbability: number;
  condition:       'sunny' | 'cloudy' | 'rainy' | 'clear';
  description:     string;
}

/**
 * Forecast weather data for a specific date.
 * @returns The WeatherData object
 */
export interface WeatherData {
  date:            string;
  tempMin:         number;
  tempMax:         number;
  rainProbability: number;
  condition:       string;
  conditionCode:   number;
  windspeedMax:    number;
}

/**
 * Item in a packing list.
 * @returns The PackingItem object
 */
export interface PackingItem {
  id:          string;
  name:        string;
  category:    string;
  checked:     boolean;
  isCustom:    boolean;
}

/**
 * Full packing list associated with an itinerary.
 * @returns The PackingList object
 */
export interface PackingList {
  id:         string;
  itineraryId: string;
  categories: PackingCategory[];
  updatedAt:  string;
}

/**
 * Category grouping within a packing list.
 * @returns The PackingCategory object
 */
export interface PackingCategory {
  name:  string;
  items: PackingItem[];
  icon?: string;
}

/**
 * User comment on an itinerary or activity.
 * @returns The Comment object
 */
export interface Comment {
  id:          string;
  authorUid:   string;
  authorName:  string;
  authorPhoto?: string;
  text:        string;
  createdAt:   string;
  updatedAt?:  string;
}

/**
 * Chat message within the Gemini AI assistant interface.
 * @returns The ChatMessage object
 */
export interface ChatMessage {
  id:        string;
  role:      'user' | 'model';
  content:   string;
  timestamp: string;
  imageUrl?: string;
  isStreaming?: boolean;
  aiMeta?: {
    provider?: string;
    model?: string;
    validated?: boolean;
    fallbackUsed?: boolean;
    status?: string;
  };
}

/**
 * User profile containing app metadata and preferences.
 * @returns The UserProfile object
 */
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

/**
 * AI-generated suggestion for budget optimization.
 * @returns The BudgetSuggestion object
 */
export interface BudgetSuggestion {
  title:       string;
  description: string;
  savings:     number;
  impact:      'low' | 'medium' | 'high';
}

/**
 * Details for a step in the onboarding wizard.
 * @returns The WizardStep object
 */
export interface WizardStep {
  step:     number;
  title:    string;
  subtitle: string;
}
