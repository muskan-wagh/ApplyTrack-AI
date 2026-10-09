export type ApplicationStatus =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export interface ApplicationItem {
  _id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedDate: string;
  location: string;
  jobUrl: string;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatsResponse {
  total: number;
  applied: number;
  screening: number;
  interview: number;
  interviews: number;
  offer: number;
  hired: number;
  offers: number;
  rejected: number;
  withdrawn: number;
  byStatus: Record<string, number>;
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};
