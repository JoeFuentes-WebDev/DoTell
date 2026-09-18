function isDev(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function warnIfDev(message: string): void {
  if (isDev()) {
    console.warn(message)
  }
}
