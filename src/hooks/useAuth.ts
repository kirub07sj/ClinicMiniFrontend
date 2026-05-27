import useAuthStore from '../stores/useAuthStore';

/**
 * Custom hook to consume the Auth store safely
 * This wraps the Zustand store for backward compatibility
 */
export const useAuth = () => {
  return useAuthStore();
};

export default useAuth;
