/**
 * Vercel Speed Insights initialization
 * This module initializes and configures Vercel Speed Insights for tracking web vitals
 */
import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectSpeedInsights({
      debug: false
    });
  });
} else {
  // DOM already loaded
  injectSpeedInsights({
    debug: false
  });
}
