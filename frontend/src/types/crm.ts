export interface Stage {
  id: number;
  name: string;
  order: number;
  pipeline_id: number;
  is_won: boolean;
  fold: boolean;
}

export interface Pipeline {
  id: number;
  name: string;
  is_default: boolean;
  stages: Stage[];
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: number;
  name: string;
  pipeline: number;
  pipeline_name: string;
  stage: number;
  stage_name: string;
  contact: number | null;
  contact_name: string;
  company: number | null;
  company_name: string;
  assigned_to: number | null;
  assigned_to_name: string;
  expected_revenue: string;
  probability: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expected_closing: string | null;
  notes: string;
  is_won: boolean;
  is_lost: boolean;
  lost_reason: string;
  created_at: string;
  updated_at: string;
}

export interface DealActivity {
  id: number;
  deal_id: number;
  activity_type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  summary: string;
  due_date: string | null;
  done: boolean;
  created_by: number;
  created_at: string;
}
