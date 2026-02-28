export function formatError(error: any): string {
  if (typeof error === 'string') return error
  if (Array.isArray(error)) {
    return error.map((err: any) => err.message || JSON.stringify(err)).join(', ')
  }
  if (error && typeof error === 'object') {
    if (error.message) return error.message
    return JSON.stringify(error)
  }
  return 'An unknown error occurred'
}
