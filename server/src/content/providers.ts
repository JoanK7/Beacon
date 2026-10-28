// Referral directory starting entries. Contact details are deliberately left
// "to be confirmed": every entry must be verified by the clinical partner
// before the pilot (Admin > Referral directory > tick "verified").
export interface ProviderContent {
  name: string;
  serviceType: 'counselling' | 'medical' | 'academic' | 'financial' | 'emergency' | 'wellbeing' | 'other';
  description: string;
  onCampus: boolean;
  district: string;
  location: string;
  contact: string;
  hours: string;
}

export const WELLNESS_CENTER = 'ALU Wellness Center';
export const LEGACY_COUNSELLING_PLACEHOLDER = 'ALU Student Wellbeing / Counselling (placeholder)';

export const providers: ProviderContent[] = [
  {
    name: 'National Emergency Services',
    serviceType: 'emergency',
    description: 'For immediate danger to life. Confirm the correct number with the clinical partner before the pilot.',
    onCampus: false,
    district: 'Nationwide',
    location: 'Nationwide',
    contact: '112 (to be verified)',
    hours: '24/7',
  },
  {
    name: WELLNESS_CENTER,
    serviceType: 'counselling',
    description:
      'The first place to refer when care needs to widen. Provides professional guidance, holds safeguarding responsibility, receives referrals, and supports peer supporters.',
    onCampus: true,
    district: 'Gasabo',
    location: 'ALU Kigali campus (room to be confirmed)',
    contact: 'To be confirmed',
    hours: 'To be confirmed',
  },
  {
    name: 'Solid Minds Counselling Clinic',
    serviceType: 'counselling',
    description: 'Clinical partner of the ALU peer counselor programme, offering counselling, training and supervision.',
    onCampus: false,
    district: 'Kigali',
    location: 'To be confirmed',
    contact: 'To be confirmed',
    hours: 'To be confirmed',
  },
  {
    name: 'ALU Academic Advising (placeholder)',
    serviceType: 'academic',
    description: 'Help with course load, academic difficulties, extensions and study planning.',
    onCampus: true,
    district: 'Gasabo',
    location: 'ALU Kigali campus',
    contact: 'To be confirmed',
    hours: 'Mon–Fri, times to be confirmed',
  },
  {
    name: 'ALU Financial Aid Office (placeholder)',
    serviceType: 'financial',
    description: 'Questions about scholarships, fees and financial hardship support.',
    onCampus: true,
    district: 'Gasabo',
    location: 'ALU Kigali campus',
    contact: 'To be confirmed',
    hours: 'Mon–Fri, times to be confirmed',
  },
  {
    name: 'Campus Health Services (placeholder)',
    serviceType: 'medical',
    description: 'First-line medical care and referral to clinics and hospitals.',
    onCampus: true,
    district: 'Gasabo',
    location: 'ALU Kigali campus',
    contact: 'To be confirmed',
    hours: 'To be confirmed',
  },
  {
    name: 'Student Life & Residential Support (placeholder)',
    serviceType: 'wellbeing',
    description: 'Housing issues, homesickness, community and belonging.',
    onCampus: true,
    district: 'Gasabo',
    location: 'ALU Kigali campus',
    contact: 'To be confirmed',
    hours: 'To be confirmed',
  },
];
