import { useState } from 'react';

export function useAuth() {
  return {
    user: { id: '1', name: 'Admin', role: 'admin', email: 'admin@example.com' },
    loading: false,
    error: null,
    isAuthenticated: true,
    logout: () => {
      console.log('Logged out');
    }
  };
}
