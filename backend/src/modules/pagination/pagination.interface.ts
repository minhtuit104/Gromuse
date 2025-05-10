export interface PaginationInfo {
  total: number;
  last_page: number;
  pageSize: number;
  page: number;
}

export interface PaginatedResponse<T> {
  data?: T[];
  pagination: PaginationInfo;
}
