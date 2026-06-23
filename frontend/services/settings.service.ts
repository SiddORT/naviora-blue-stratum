import api from "./api";
import type { ApiResponse, PaginatedData } from "@/types/api.types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlatformSettings {
  id: number; uuid: string;
  company_name?: string; legal_name?: string;
  company_email?: string; support_email?: string; billing_email?: string;
  company_phone?: string; website_url?: string;
  address_line_1?: string; address_line_2?: string;
  city?: string; state?: string; country?: string; postal_code?: string;
  company_logo_path?: string; favicon_path?: string;
  default_timezone: string; default_currency: string;
  default_language: string; date_format: string; time_format: string;
  updated_at?: string;
}

export interface BrandingSettings {
  id: number; uuid: string;
  platform_name: string; platform_tagline?: string;
  primary_color: string; secondary_color: string; accent_color: string;
  login_background_path?: string; email_header_logo_path?: string; report_logo_path?: string;
  updated_at?: string;
}

export interface CommunicationSettings {
  id: number; uuid: string;
  smtp_host?: string; smtp_port: number;
  smtp_username?: string; smtp_password_set: boolean;
  smtp_encryption: string;
  sender_name?: string; sender_email?: string;
  reply_to_email?: string; test_email_address?: string;
  is_verified: boolean; updated_at?: string;
}

export interface NotificationSettings {
  id: number; uuid: string;
  enable_email_notifications: boolean; enable_system_notifications: boolean;
  enable_sms_notifications: boolean; enable_whatsapp_notifications: boolean;
  enable_teams_notifications: boolean; enable_slack_notifications: boolean;
  teams_webhook_url?: string; slack_webhook_url?: string;
  updated_at?: string;
}

export interface InvoiceSettings {
  id: number; uuid: string;
  invoice_prefix: string; invoice_start_number: number;
  quotation_prefix: string; quotation_start_number: number;
  currency_code: string; currency_symbol: string;
  tax_name: string; tax_percentage: number; invoice_footer?: string;
  updated_at?: string;
}

export interface SystemPreferences {
  id: number; uuid: string;
  default_timezone: string; default_currency: string; default_language: string;
  session_timeout_minutes: number; password_expiry_days: number;
  max_login_attempts: number; lockout_duration_minutes: number;
  updated_at?: string;
}

export interface PortalSettings {
  id: number; uuid: string;
  public_url: string; admin_url: string;
  organization_url: string; candidate_url: string;
  custom_domain?: string; ssl_enabled?: boolean;
  updated_at?: string;
}

export interface EmailTemplate {
  id: number; uuid: string;
  template_name: string; template_code: string; subject: string;
  html_content?: string; plain_text_content?: string;
  available_variables?: string; status: string; description?: string;
  created_at?: string; updated_at?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const settingsService = {
  // Platform
  async getPlatform(): Promise<ApiResponse<PlatformSettings>> {
    const res = await api.get<ApiResponse<PlatformSettings>>("/settings/platform");
    return res.data;
  },
  async updatePlatform(data: Partial<PlatformSettings>): Promise<ApiResponse<PlatformSettings>> {
    const res = await api.put<ApiResponse<PlatformSettings>>("/settings/platform", data);
    return res.data;
  },

  // Branding
  async getBranding(): Promise<ApiResponse<BrandingSettings>> {
    const res = await api.get<ApiResponse<BrandingSettings>>("/settings/branding");
    return res.data;
  },
  async updateBranding(data: Partial<BrandingSettings>): Promise<ApiResponse<BrandingSettings>> {
    const res = await api.put<ApiResponse<BrandingSettings>>("/settings/branding", data);
    return res.data;
  },

  // Communication
  async getCommunication(): Promise<ApiResponse<CommunicationSettings>> {
    const res = await api.get<ApiResponse<CommunicationSettings>>("/settings/communication");
    return res.data;
  },
  async updateCommunication(data: Record<string, unknown>): Promise<ApiResponse<CommunicationSettings>> {
    const res = await api.put<ApiResponse<CommunicationSettings>>("/settings/communication", data);
    return res.data;
  },
  async verifySmtp(): Promise<ApiResponse<null>> {
    const res = await api.post<ApiResponse<null>>("/settings/communication/verify", {});
    return res.data;
  },
  async sendTestEmail(recipient: string): Promise<ApiResponse<null>> {
    const res = await api.post<ApiResponse<null>>("/settings/communication/test-email", { recipient });
    return res.data;
  },

  // Notifications
  async getNotifications(): Promise<ApiResponse<NotificationSettings>> {
    const res = await api.get<ApiResponse<NotificationSettings>>("/settings/notifications");
    return res.data;
  },
  async updateNotifications(data: Partial<NotificationSettings>): Promise<ApiResponse<NotificationSettings>> {
    const res = await api.put<ApiResponse<NotificationSettings>>("/settings/notifications", data);
    return res.data;
  },

  // Invoice
  async getInvoice(): Promise<ApiResponse<InvoiceSettings>> {
    const res = await api.get<ApiResponse<InvoiceSettings>>("/settings/invoice");
    return res.data;
  },
  async updateInvoice(data: Partial<InvoiceSettings>): Promise<ApiResponse<InvoiceSettings>> {
    const res = await api.put<ApiResponse<InvoiceSettings>>("/settings/invoice", data);
    return res.data;
  },

  // System
  async getSystem(): Promise<ApiResponse<SystemPreferences>> {
    const res = await api.get<ApiResponse<SystemPreferences>>("/settings/system");
    return res.data;
  },
  async updateSystem(data: Partial<SystemPreferences>): Promise<ApiResponse<SystemPreferences>> {
    const res = await api.put<ApiResponse<SystemPreferences>>("/settings/system", data);
    return res.data;
  },

  // Portal
  async getPortal(): Promise<ApiResponse<PortalSettings>> {
    const res = await api.get<ApiResponse<PortalSettings>>("/settings/portal");
    return res.data;
  },
  async updatePortal(data: Partial<PortalSettings>): Promise<ApiResponse<PortalSettings>> {
    const res = await api.put<ApiResponse<PortalSettings>>("/settings/portal", data);
    return res.data;
  },

  // Email Templates
  async listEmailTemplates(params?: { page?: number; page_size?: number; search?: string; status?: string }): Promise<ApiResponse<PaginatedData<EmailTemplate>>> {
    const res = await api.get<ApiResponse<PaginatedData<EmailTemplate>>>("/settings/email-templates", { params });
    return res.data;
  },
  async getEmailTemplate(uuid: string): Promise<ApiResponse<EmailTemplate>> {
    const res = await api.get<ApiResponse<EmailTemplate>>(`/settings/email-templates/${uuid}`);
    return res.data;
  },
  async createEmailTemplate(data: Record<string, unknown>): Promise<ApiResponse<EmailTemplate>> {
    const res = await api.post<ApiResponse<EmailTemplate>>("/settings/email-templates", data);
    return res.data;
  },
  async updateEmailTemplate(uuid: string, data: Record<string, unknown>): Promise<ApiResponse<EmailTemplate>> {
    const res = await api.put<ApiResponse<EmailTemplate>>(`/settings/email-templates/${uuid}`, data);
    return res.data;
  },
  async deleteEmailTemplate(uuid: string): Promise<ApiResponse<null>> {
    const res = await api.delete<ApiResponse<null>>(`/settings/email-templates/${uuid}`);
    return res.data;
  },
  async previewTemplate(uuid: string, variables: Record<string, string>): Promise<ApiResponse<{ subject: string; html_content: string; plain_text_content: string }>> {
    const res = await api.post<ApiResponse<{ subject: string; html_content: string; plain_text_content: string }>>(
      `/settings/email-templates/${uuid}/preview`, { variables }
    );
    return res.data;
  },
  async sendTemplateTestEmail(uuid: string, recipient: string, variables: Record<string, string>): Promise<ApiResponse<null>> {
    const res = await api.post<ApiResponse<null>>(`/settings/email-templates/${uuid}/send-test`, { recipient, variables });
    return res.data;
  },
};
