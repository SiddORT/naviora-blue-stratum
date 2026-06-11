export type IntegrationType = "REST_API" | "WEBSOCKET" | "FILE_IMPORT" | "CUSTOM";
export type AuthType = "API_KEY" | "BEARER" | "BASIC" | "NONE";
export type SessionStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type VendorStatus = "active" | "inactive" | "deprecated";

export interface SimulatorVendor {
  id: number;
  uuid: string;
  name: string;
  code: string;
  vendor_name: string | null;
  version: string | null;
  description: string | null;
  integration_type: IntegrationType;
  status: VendorStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SimulatorConfiguration {
  id: number;
  uuid: string;
  simulator_vendor_id: number;
  vendor_name: string | null;
  vendor_code: string | null;
  configuration_name: string;
  base_url: string | null;
  authentication_type: AuthType;
  webhook_url: string | null;
  connection_timeout: number;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SimulatorSession {
  id: number;
  uuid: string;
  session_reference: string;
  simulator_vendor_id: number | null;
  vendor_name: string | null;
  vendor_code: string | null;
  candidate_id: string | null;
  organization_id: number | null;
  assessment_id: string | null;
  exercise_id: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_seconds: number | null;
  status: SessionStatus;
  raw_payload: Record<string, unknown> | null;
  processed_payload: Record<string, unknown> | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationLog {
  id: number;
  uuid: string;
  simulator_vendor_id: number | null;
  vendor_name: string | null;
  vendor_code: string | null;
  request_type: string;
  request_url: string | null;
  request_payload: Record<string, unknown> | null;
  response_payload: Record<string, unknown> | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface VendorCreatePayload {
  name: string;
  code: string;
  vendor_name?: string;
  version?: string;
  description?: string;
  integration_type: IntegrationType;
  status: VendorStatus;
}

export interface VendorUpdatePayload {
  name?: string;
  vendor_name?: string;
  version?: string;
  description?: string;
  integration_type?: IntegrationType;
  status?: VendorStatus;
  is_active?: boolean;
}

export interface ConfigCreatePayload {
  simulator_vendor_id: number;
  configuration_name: string;
  base_url?: string;
  authentication_type: AuthType;
  api_key?: string;
  client_id?: string;
  client_secret?: string;
  webhook_url?: string;
  connection_timeout: number;
  status: string;
}

export interface ConfigUpdatePayload {
  configuration_name?: string;
  base_url?: string;
  authentication_type?: AuthType;
  api_key?: string;
  client_id?: string;
  client_secret?: string;
  webhook_url?: string;
  connection_timeout?: number;
  status?: string;
  is_active?: boolean;
}
