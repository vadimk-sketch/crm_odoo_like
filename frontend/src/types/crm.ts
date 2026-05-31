export interface Stage {
  id: string;
  name: string;
  order: number;
  pipeline: string;
  is_won: boolean;
  is_lost: boolean;
}

export interface Pipeline {
  id: string;
  name: string;
  is_default: boolean;
  stages: Stage[];
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  name: string;
  pipeline: string;
  stage: { id: string; name: string } | string;
  contact: { id: string; full_name: string } | null;
  company: { id: string; name: string } | null;
  owner: { id: string; email: string; first_name: string; last_name: string } | null;
  amount: string;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  closed_at: string | null;
  priority: 'low' | 'medium' | 'high';
  description: string;
  tags: { id: string; name: string; color: string }[];
  created_at: string;
  updated_at: string;
}

export interface DealActivity {
  id: string;
  deal: string;
  event_type: 'stage_change' | 'note' | 'call' | 'email' | 'meeting';
  description: string;
  old_stage: { id: string; name: string } | null;
  new_stage: { id: string; name: string } | null;
  created_by: { id: string; email: string; first_name: string; last_name: string };
  created_at: string;
}
