export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Company {
  id: number;
  name: string;
  website: string;
  industry: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  notes: string;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile: string;
  job_title: string;
  company: Company | null;
  company_id: number | null;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  notes: string;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  contact_id: number;
  body: string;
  created_by: number;
  created_at: string;
}

export interface Activity {
  id: number;
  contact_id: number;
  activity_type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  summary: string;
  due_date: string | null;
  done: boolean;
  created_by: number;
  created_at: string;
}
