export interface Lead {
  rowIndex: number;
  timestamp: string;
  firstName: string;
  lastName: string;
  phone: string;
  whatsapp: string;
  email: string;
  bs: string;
  propType: string;
  budget: string;
  source: string;
  location: string;
  remarks: string;
  status: string;
  followUp: string;
  callDone: string;
  callResult: string;
  propValue: string;
  commission: string;
  expComm: string;
  priority: 'Hot' | 'Medium' | 'Low' | '';
  urgency: string;
  quickChat: string;
  agentEmail: string;
  agentName: string;
}

export interface DashboardStats {
  total: number;
  today: number;
  upcoming: number;
  overdue: number;
  hot: number;
  byStatus: Record<string, number>;
}

export type View = 'dashboard' | 'leads' | 'followups' | 'analytics' | 'settings';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
