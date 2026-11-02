// Referral directory entries, verified with ALU and Solid Minds.
// Empty fields (location, phone, email, website, hours) are simply not shown.
// Opening hours are listed only for services outside ALU.
export interface ProviderContent {
  name: string;
  serviceType: 'counselling' | 'medical' | 'academic' | 'financial' | 'emergency' | 'wellbeing' | 'other';
  description: string;
  onCampus: boolean;
  district: string;
  location: string;
  /** Phone number. */
  contact: string;
  email: string;
  website: string;
  hours: string;
}

export const providers: ProviderContent[] = [
  {
    name: 'National Emergency Services',
    serviceType: 'emergency',
    description: 'For immediate danger to life: police, ambulance and fire.',
    onCampus: false,
    district: 'Nationwide',
    location: '',
    contact: '112',
    email: '',
    website: '',
    hours: '24/7',
  },
  {
    name: 'ALU Emergency Line',
    serviceType: 'emergency',
    description: 'ALU’s emergency line for urgent situations involving students on or around campus.',
    onCampus: true,
    district: 'Gasabo',
    location: 'ALU Kigali campus',
    contact: '+250 787 414 774',
    email: '',
    website: '',
    hours: '',
  },
  {
    name: 'ALU Wellness & Counselling',
    serviceType: 'counselling',
    description:
      'The first place to refer when care needs to widen, including health concerns. Provides professional guidance, holds safeguarding responsibility, receives referrals, and supports peer supporters.',
    onCampus: true,
    district: 'Gasabo',
    location: 'ALU Kigali campus',
    contact: '0787 414 774',
    email: 'wellness@alueducation.com',
    website: '',
    hours: '',
  },
  {
    name: 'Solid Minds Counselling Clinic',
    serviceType: 'counselling',
    description: 'Clinical partner of the ALU peer counselor programme, offering counselling, training and supervision.',
    onCampus: false,
    district: 'Kigali',
    location: '',
    contact: '+250 788 503 528',
    email: 'info@solidminds.rw',
    website: '',
    hours: 'Mon–Sat, 8:00–18:00, or by appointment',
  },
  {
    name: 'ALU Student Success',
    serviceType: 'academic',
    description: 'Help with course load, academic difficulties, extensions and study planning.',
    onCampus: true,
    district: 'Gasabo',
    location: 'ALU Kigali campus',
    contact: '',
    email: 'studentsuccess_rw@alueducation.com',
    website: '',
    hours: '',
  },
  {
    name: 'ALU Financial Aid Office',
    serviceType: 'financial',
    description: 'Questions about scholarships, fees and financial hardship support.',
    onCampus: true,
    district: 'Gasabo',
    location: 'ALU Kigali campus',
    contact: '',
    email: 'financialaid@alueducation.com',
    website: 'https://support.alueducation.com/finance',
    hours: '',
  },
  {
    name: 'ALU Student Life',
    serviceType: 'wellbeing',
    description: 'Housing issues, homesickness, community and belonging.',
    onCampus: true,
    district: 'Gasabo',
    location: 'ALU Kigali campus',
    contact: '',
    email: 'studentlife_rw@alueducation.com',
    website: 'https://support.alueducation.com/student-life',
    hours: '',
  },
];

/** Older entry names, mapped to the entry that replaces them, so existing rows are renamed rather than duplicated. */
export const RENAMED_PROVIDERS: Record<string, string> = {
  'ALU Wellness Center': 'ALU Wellness & Counselling',
  'ALU Academic Advising (placeholder)': 'ALU Student Success',
  'ALU Financial Aid Office (placeholder)': 'ALU Financial Aid Office',
  'Student Life & Residential Support (placeholder)': 'ALU Student Life',
};

/** Entries that are no longer offered (the Wellness team covers health). */
export const RETIRED_PROVIDERS = ['Campus Health Services (placeholder)', 'ALU Student Wellbeing / Counselling (placeholder)'];
