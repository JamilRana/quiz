import CryptoJS from 'crypto-js'

export interface DeviceFingerprint {
  userAgent: string
  timezone: string
  screenResolution: string
}

export function generateDeviceHash(fingerprint: DeviceFingerprint): string {
  const data = `${fingerprint.userAgent}|${fingerprint.timezone}|${fingerprint.screenResolution}`
  return CryptoJS.SHA256(data).toString()
}

export function getDeviceFingerprint(): DeviceFingerprint {
  return {
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    timezone: typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
    screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
  }
}
