export const CAMPUS_CONFIG = {
  id: 'c1111111-1111-1111-1111-111111111111',
  code: 'DNR-BVRM',
  name: 'DNR College of Engineering & Technology',
  shortName: 'DNR Engineering College',
  acronym: 'DNRCET',
  domain: 'dnrcet.org',
  website: 'https://dnrcet.org/',
  city: 'Bhimavaram',
  state: 'Andhra Pradesh',
  country: 'India',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  currencySymbol: '₹',
  dateFormat: 'DD MMM YYYY',
  securityOfficeLocation: 'Administrative Office & Security Help Desk, Main Block, DNRCET Campus',
  securityContactEmail: 'lostfound@dnrcet.org',
} as const;

export const DNR_CAMPUS_LOCATIONS = [
  'Main Library',
  'Computer Science Laboratory',
  'Electronics Laboratory',
  'College Canteen',
  'Seminar Hall',
  'Main Entrance',
  'Parking Area',
  'Classroom Block',
  'College Bus Area',
  'Sports Ground',
] as const;

export type DNRCampusLocation = typeof DNR_CAMPUS_LOCATIONS[number];
