export interface User {
  id: string;
  phone: string;
  name: string;
  national_id?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Chama {
  id: string;
  name: string;
  description?: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  contribution_amount: number;
  start_date: string;
  max_members: number;
  constitution_url?: string;
  invite_code: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChamaMember {
  id: string;
  chama_id: string;
  user_id: string;
  role: 'CHAIRMAN' | 'SECRETARY' | 'TREASURER' | 'MEMBER';
  joined_at: string;
  is_active: boolean;
  voting_rights: boolean;
  user?: Partial<User>;
}

export interface ContributionCycle {
  id: string;
  chama_id: string;
  due_date: string;
  amount: number;
  status: 'UPCOMING' | 'OPEN' | 'CLOSED';
  cycle_number: number;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  cycle_id: string;
  member_id: string;
  amount_paid: number;
  paid_at?: string;
  mpesa_ref?: string;
  status: 'PAID' | 'PENDING' | 'LATE' | 'WAIVED';
  penalty_amount: number;
  created_at: string;
  updated_at: string;
  member?: ChamaMember;
  cycle?: ContributionCycle;
}

export interface Loan {
  id: string;
  chama_id: string;
  applicant_id: string;
  amount: number;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'DISBURSED' | 'REPAID' | 'DEFAULTED' | 'REJECTED';
  applied_at: string;
  approved_at?: string;
  disbursed_at?: string;
  interest_rate: number;
  repayment_months: number;
  applicant?: ChamaMember;
  repayments?: LoanRepayment[];
}

export interface LoanRepayment {
  id: string;
  loan_id: string;
  amount: number;
  due_date: string;
  paid_at?: string;
  mpesa_ref?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}

export interface Investment {
  id: string;
  chama_id: string;
  name: string;
  institution: string;
  amount: number;
  roi_expected: number;
  maturity_date?: string;
  status: 'ACTIVE' | 'MATURED' | 'WITHDRAWN';
}

export interface Meeting {
  id: string;
  chama_id: string;
  scheduled_at: string;
  location?: string;
  agenda?: string;
  minutes?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

export interface MeetingAttendance {
  id: string;
  meeting_id: string;
  member_id: string;
  status: 'PRESENT' | 'ABSENT' | 'APOLOGY';
  fine_amount: number;
  member?: ChamaMember;
}

export interface DashboardData {
  wallet: {
    balance: number;
    total_contributions: number;
    total_disbursed: number;
    total_repayments: number;
    total_fines: number;
  };
  monthly_collection: {
    collected: number;
    expected: number;
    percentage: number;
  };
  active_loans: number;
  outstanding_loan_amount: number;
  next_meeting: Meeting | null;
  recent_activity: any[];
  member_count: number;
}
