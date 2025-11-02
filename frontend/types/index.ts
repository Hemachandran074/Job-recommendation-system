export interface WorkExperience {
  id: string;
  position: string;
  company: string;
  duration: string;
  years: string;
}

export interface EducationDetail {
  id: string;
  degree: string;
  institution: string;
  duration: string;
  years: string;
}

export interface Resume {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
}

export interface UserProfile {
  name: string;
  email: string;
  mobile: string;
  dob: string;
  gender: string;
  degree: string;
  stream: string;
  institute: string;
  graduation_year: string;
  cgpa: string;
  location: string;
  skills: string[];
  interests: string[];
  technical_domains: string[];
  experience: string;
  preferred_city: string;
  about?: string;
  work_experience?: WorkExperience[];
  education_details?: EducationDetail[];
  languages?: string[];
  resumes?: Resume[];
}

export interface Internship {
  _id: string;
  id?: string;
  external_id?: string;
  company_name: string;
  company?: string;
  company_logo?: string;
  organization_logo?: string;
  linkedin_org_description?: string;
  title: string;
  location: string;
  type: string;
  job_type?: string;
  employment_type?: string;
  salary: string;
  salary_min?: number;
  salary_max?: number;
  period?: string;
  description: string;
  skills?: string[];
  skills_required?: string[];
  experience?: string;
  experience_level?: string;
  remote?: boolean;
  url?: string;
  job_url?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
  posted_date?: string;
  fetched_at?: string;
  industry?: string;
  website?: string;
  head_office?: string;
  specialization?: string;
  since?: string;
  gallery_images?: string[];
  match_score?: number;
  match_reasons?: string[];
}
