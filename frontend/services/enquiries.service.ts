import api from "./api";
import type {
  EnquiryDetail,
  EnquiryListItem,
  OnboardingRequest,
  ConsentRecord,
} from "@/types/common.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ── Public Submission ─────────────────────────────────────────────────────────

export interface ContactPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  organization?: string;
  country?: string;
  role?: string;
  message?: string;
  source_page?: string;
  consent: {
    privacy_accepted: boolean;
    terms_accepted: boolean;
    data_processing_accepted: boolean;
    marketing_accepted: boolean;
    consent_version?: string;
  };
}

export interface OrgRegistrationPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name: string;
  country?: string;
  selected_plan_id?: number;
  message?: string;
  consent: ContactPayload["consent"];
}

export interface CandidateRegistrationPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  country?: string;
  message?: string;
  consent: ContactPayload["consent"];
}

export interface PlanEnquiryPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  organization?: string;
  country?: string;
  selected_plan_id?: number;
  message?: string;
  consent: ContactPayload["consent"];
}

// ── Admin params ──────────────────────────────────────────────────────────────

export interface EnquiryListParams {
  page?: number;
  page_size?: number;
  search?: string;
  enquiry_type?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface OnboardingApprovePayload {
  selected_plan_id?: number;
  organization_id?: number;
  notes?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const enquiriesService = {
  // Public
  async submitContact(payload: ContactPayload): Promise<ApiResponse<{ uuid: string }>> {
    const res = await api.post<ApiResponse<{ uuid: string }>>("/enquiries/contact", payload);
    return res.data;
  },

  async submitPlanEnquiry(payload: PlanEnquiryPayload): Promise<ApiResponse<unknown>> {
    const res = await api.post<ApiResponse<unknown>>("/enquiries/plan", payload);
    return res.data;
  },

  async submitOrgRegistration(payload: OrgRegistrationPayload): Promise<ApiResponse<unknown>> {
    const res = await api.post<ApiResponse<unknown>>("/enquiries/register/organization", payload);
    return res.data;
  },

  async submitCandidateRegistration(payload: CandidateRegistrationPayload): Promise<ApiResponse<unknown>> {
    const res = await api.post<ApiResponse<unknown>>("/enquiries/register/candidate", payload);
    return res.data;
  },

  // Admin — enquiries
  async list(params?: EnquiryListParams): Promise<ApiResponse<PaginatedData<EnquiryListItem>>> {
    const res = await api.get<ApiResponse<PaginatedData<EnquiryListItem>>>("/enquiries", { params });
    return res.data;
  },

  async get(uuid: string): Promise<ApiResponse<EnquiryDetail>> {
    const res = await api.get<ApiResponse<EnquiryDetail>>(`/enquiries/${uuid}`);
    return res.data;
  },

  async updateStatus(uuid: string, status: string): Promise<ApiResponse<EnquiryDetail>> {
    const res = await api.patch<ApiResponse<EnquiryDetail>>(`/enquiries/${uuid}/status`, { status });
    return res.data;
  },

  async assign(uuid: string, assigned_to: string | null): Promise<ApiResponse<EnquiryDetail>> {
    const res = await api.patch<ApiResponse<EnquiryDetail>>(`/enquiries/${uuid}/assign`, { assigned_to });
    return res.data;
  },

  async addNote(uuid: string, note: string): Promise<ApiResponse<unknown>> {
    const res = await api.post<ApiResponse<unknown>>(`/enquiries/${uuid}/notes`, { note });
    return res.data;
  },

  async approve(uuid: string, payload: OnboardingApprovePayload): Promise<ApiResponse<OnboardingRequest>> {
    const res = await api.post<ApiResponse<OnboardingRequest>>(`/enquiries/${uuid}/approve`, payload);
    return res.data;
  },

  async reject(uuid: string, reason?: string): Promise<ApiResponse<EnquiryDetail>> {
    const res = await api.post<ApiResponse<EnquiryDetail>>(`/enquiries/${uuid}/reject`, { reason });
    return res.data;
  },

  async convert(uuid: string): Promise<ApiResponse<EnquiryDetail>> {
    const res = await api.post<ApiResponse<EnquiryDetail>>(`/enquiries/${uuid}/convert`);
    return res.data;
  },

  // Admin — onboarding
  async listOnboarding(params?: {
    page?: number;
    page_size?: number;
    onboarding_type?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedData<OnboardingRequest>>> {
    const res = await api.get<ApiResponse<PaginatedData<OnboardingRequest>>>("/onboarding", { params });
    return res.data;
  },

  // Admin — consents
  async listConsents(params?: {
    page?: number;
    page_size?: number;
    marketing_only?: boolean;
  }): Promise<ApiResponse<PaginatedData<ConsentRecord>>> {
    const res = await api.get<ApiResponse<PaginatedData<ConsentRecord>>>("/consent-records", { params });
    return res.data;
  },
};
