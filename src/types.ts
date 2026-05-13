export interface Lead {
  rowIndex: number;
  timestamp: string;
  firstName: string;
  lastName: string;
  phone: string;
  whatsapp: string;
  email: string;
  location: string;
  requirement: string;
  budget: string;
  notes: string;
  status: string; // New, Contacted, Qualified, Negotiating, Closed, Lost
  followUp: string;
  priority: 'Hot' | 'Medium' | 'Low' | '';
  source: string;
}

export interface DashboardStats {
  total: number;
  today: number;
  upcoming: number;
  overdue: number;
  hot: number;
  byStatus: Record<string, number>;
}

export type View = 'dashboard' | 'leads' | 'followups' | 'analytics';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
