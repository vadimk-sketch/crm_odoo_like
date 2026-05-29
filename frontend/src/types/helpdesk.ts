export interface TicketStage {
  id: number;
  name: string;
  order: number;
  team_id: number;
  fold: boolean;
}

export interface SLAPolicy {
  id: number;
  name: string;
  team_id: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_type: 'response' | 'resolution';
  time_hours: number;
}

export interface SLA {
  id: number;
  ticket_id: number;
  policy: SLAPolicy;
  deadline: string;
  reached: boolean;
  reached_at: string | null;
  failed: boolean;
}

export interface Team {
  id: number;
  name: string;
  description: string;
  stages: TicketStage[];
  sla_policies: SLAPolicy[];
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: number;
  subject: string;
  description: string;
  team: number;
  team_name: string;
  stage: number;
  stage_name: string;
  contact: number | null;
  contact_name: string;
  assigned_to: number | null;
  assigned_to_name: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  ticket_type: 'question' | 'incident' | 'problem' | 'feature_request';
  sla_statuses: SLA[];
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  body: string;
  message_type: 'comment' | 'internal_note';
  author: number;
  author_name: string;
  created_at: string;
}
