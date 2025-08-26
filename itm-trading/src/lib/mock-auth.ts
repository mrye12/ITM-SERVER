// Mock authentication for demo purposes when Supabase is unavailable
export const mockUser = {
  id: 'demo-user-id',
  email: 'admin@itmtrading.com',
  full_name: 'Demo Administrator',
  role: 'admin'
}

export const mockProfile = {
  id: 'demo-user-id',
  email: 'admin@itmtrading.com',
  full_name: 'Demo Administrator',
  role: 'admin',
  roles: {
    code: 'admin',
    name: 'Administrator'
  }
}

export function getMockUser() {
  return mockUser
}

export function getMockProfile() {
  return mockProfile
}

// Store mock login state in localStorage for demo
export function setMockLoginState(isLoggedIn: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('demo-logged-in', isLoggedIn.toString())
  }
}

export function getMockLoginState(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('demo-logged-in') === 'true'
  }
  return false
}

