export type FrenchLevel =
  | "A1"
  | "A2"
  | "B1"
  | "B2"
  | "C1"
  | "C2"
  | "beginner"
  | "not_sure";

export type CourseType =
  | "tcf"
  | "tef"
  | "delf_dalf"
  | "business"
  | "other_languages"
  | "free_resources";

export interface KYCDemographics {
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  dateOfBirth: string;
  country: string;
  city: string;
  timeZone: string;
  nativeLanguages: string[];
  otherLanguages: string[];
  gender: string;
  nationality: string;
  occupation: string;
  industrySector: string;
  referralSource: string;
}

export interface KYCCourseSelection {
  courseSelected: CourseType | "";
  otherLanguageName?: string;
  learningReasons: string[];
  learningReasonOther?: string;
}

export interface KYCFrenchBackground {
  currentLevel: FrenchLevel | "";
  speakingScore: number;
  listeningScore: number;
  readingScore: number;
  writingScore: number;
  yearsStudied: string;
  takenExamBefore: "yes" | "no" | "";
  pastExamName?: string;
  pastExamScore?: string;
  challengingSections: string[];
}

export interface KYCCourseSpecificData {
  // TCF & TEF
  targetCLB?: string;
  examTimeline?: string;
  immigrationProgram?: string;
  tefVersion?: string;
  tefFocusSection?: string;
  // DELF / DALF
  targetDiploma?: string;
  delfPurpose?: string;
  requiredPassingScore?: string;
  delfScoreNeeded?: string;
  // Business / Conversational
  businessGoal?: string;
  workEnvironment?: string;
  businessSkillsToDevelop?: string[];
  businessUrgency?: string;
  businessFocusPref?: string;
  // Other Languages
  targetLanguage?: string;
  otherLangGoal?: string;
  otherLangCurrentLevel?: string;
  dialectPreference?: string;
  otherLangSkills?: string[];
  // Free Resources
  freeResourceTypes?: string[];
  freeResourceReason?: string;
  freeNotificationConsent?: string;
  freeUpgradeInterest?: string;
}

export interface KYCLearningPreferences {
  preferredLearningStyles: string[];
  hoursPerWeek: string;
  preferredClassTime: string[];
  sessionDuration: string;
  sessionsPerWeek: string;
  hourlyBudget: string;
  instructorPreference: "native" | "non_native" | "no_preference" | "";
  specificLearningNeeds: string;
  biggestFearOrChallenge: string;
}

export interface KYCSuccessMetrics {
  successDefinition: string;
  primaryMotivations: string[];
  motivationOther?: string;
  motivationScore: number;
  hasTimePressure: "yes" | "no" | "";
  timePressureMonths?: string;
}

export interface KYCLearningModality {
  coachingInterest: string;
  groupClassesInterest: string;
  selfPacedInterest: string;
  emailUpdatesConsent: string;
  communityInterest: string;
  instructorNotes: string;
}

export interface KYCConsent {
  confirmAccuracy: boolean;
  communicationsConsent: boolean;
  privacyPolicyAgree: boolean;
}

export interface KYCFormData {
  demographics: KYCDemographics;
  courseSelection: KYCCourseSelection;
  frenchBackground: KYCFrenchBackground;
  courseSpecific: KYCCourseSpecificData;
  preferences: KYCLearningPreferences;
  successMetrics: KYCSuccessMetrics;
  modality: KYCLearningModality;
  consent: KYCConsent;
}

export type LeadStatus = "new" | "in_review" | "matched" | "contacted" | "converted";

export interface LeadRecord {
  id: string;
  user_id: string | null;
  form_data: KYCFormData;
  course_selected: string;
  status: LeadStatus;
  admin_notes: string | null;
  matched_tutor_id: string | null;
  created_at: string;
  updated_at: string;
}
