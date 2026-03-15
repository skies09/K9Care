export type ConditionTag =
  | 'heart'
  | 'epilepsy'
  | 'arthritis'
  | 'allergy'
  | 'digestive'
  | 'diabetes'
  | 'kidney'
  | 'anxiety';

export interface Dog {
  id: string;
  name: string;
  photoUri?: string | null;
  breed?: string | null;
  dob?: string | null;
  weightKg?: number | null;
  notes?: string | null;
  primaryConditions?: ConditionTag[];
}

export type BreathingContext = 'resting' | 'active';

export interface BreathingCheck {
  id: string;
  dogId: string;
  breathsPerMinute: number;
  durationSeconds: number;
  context: BreathingContext;
  createdAt: string;
  notes?: string | null;
}

export interface SeizureChecklist {
  consciousnessChanged?: boolean;
  paddling?: boolean;
  urination?: boolean;
  vocalisation?: boolean;
  other?: string | null;
}

export interface SeizureEvent {
  id: string;
  dogId: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  severity?: number | null;
  checklist?: SeizureChecklist | null;
  triggers?: string | null;
  notes?: string | null;
}

export type MedicationScheduleType = 'times-per-day' | 'every-n-hours';

export interface Medication {
  id: string;
  dogId: string;
  name: string;
  dose: number;
  unit: string;
  scheduleType: MedicationScheduleType;
  timesOfDayJson?: string | null;
  intervalHours?: number | null;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
}

export type MedicationLogStatus = 'given' | 'missed' | 'skipped';

export interface MedicationLog {
  id: string;
  medicationId: string;
  dogId: string;
  plannedTime: string;
  givenAt?: string | null;
  status: MedicationLogStatus;
  notes?: string | null;
}

export type EventMarkerType = 'med_dose_change' | 'new_med' | 'diet_change';

export interface EventMarker {
  id: string;
  dogId: string;
  type: EventMarkerType;
  title: string;
  description?: string | null;
  createdAt: string;
}

export interface WeightLog {
  id: string;
  dogId: string;
  weightKg: number;
  createdAt: string;
  note?: string | null;
}

export interface MobilityLog {
  id: string;
  dogId: string;
  stiffnessOnWaking?: number | null;
  stairsDifficulty?: number | null;
  jumpingDifficulty?: number | null;
  walkTolerance?: number | null;
  overallPain?: number | null;
  createdAt: string;
  notes?: string | null;
}

export type AllergyTrigger = 'food' | 'pollen' | 'fleas' | 'environment' | 'unknown';

export interface AllergyLog {
  id: string;
  dogId: string;
  itchSeverity?: number | null;
  skinLesions?: boolean | null;
  earIssues?: boolean | null;
  bodyAreas?: string | null;
  triggers: AllergyTrigger[];
  createdAt: string;
  notes?: string | null;
}

export interface StoolLog {
  id: string;
  dogId: string;
  stoolScore?: number | null;
  hasBlood?: boolean | null;
  hasMucus?: boolean | null;
  vomiting?: boolean | null;
  diarrhea?: boolean | null;
  appetite?: 'normal' | 'low' | 'none' | 'high' | null;
  createdAt: string;
  notes?: string | null;
}

export interface InsulinLog {
  id: string;
  dogId: string;
  doseUnits: number;
  givenAt: string;
  relationToMeal?: 'before' | 'after' | 'with' | 'other' | null;
  notes?: string | null;
}

export interface GlucoseReading {
  id: string;
  dogId: string;
  value: number;
  takenAt: string;
  notes?: string | null;
}

export interface KidneyLog {
  id: string;
  dogId: string;
  waterIntakeMl?: number | null;
  urinationCount?: number | null;
  accidentsCount?: number | null;
  createdAt: string;
  notes?: string | null;
}

export type AnxietyTrigger =
  | 'noise'
  | 'separation'
  | 'visitors'
  | 'travel'
  | 'vet'
  | 'other';

export interface AnxietyLog {
  id: string;
  dogId: string;
  trigger: AnxietyTrigger;
  severity?: number | null;
  durationMinutes?: number | null;
  createdAt: string;
  notes?: string | null;
}


