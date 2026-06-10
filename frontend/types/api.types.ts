export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
}

export interface PaginatedData<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
