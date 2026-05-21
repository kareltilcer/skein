// Shared types and utilities between web and mobile
export type ApiResponse<T> = {
  data: T
  error?: string
}
