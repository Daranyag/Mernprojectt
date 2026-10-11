import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Custom hook for resilient, safe in-app back navigation.
 * Prevents open redirects, blank screens, or falling out of the authenticated application.
 *
 * @param {string} fallbackPath - Default route to navigate back to if history is empty (default: '/dashboard')
 * @returns {function} handleBack
 */
export const useSafeBackNavigation = (fallbackPath = '/dashboard') => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = useCallback(() => {
    // Check if custom referrer was passed in router state
    if (location.state && location.state.from) {
      navigate(location.state.from);
      return;
    }

    // Inspect window history length to decide whether backward traversal is safe
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // Direct visit, refreshed page, or isolated entry - safely fall back
      navigate(fallbackPath, { replace: true });
    }
  }, [navigate, location, fallbackPath]);

  return handleBack;
};

export default useSafeBackNavigation;
