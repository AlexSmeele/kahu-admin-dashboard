import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Session management utility for handling authentication sessions
 */

export interface SessionCheckResult {
  isValid: boolean;
  needsRefresh: boolean;
  error?: string;
}

/**
 * Check if the current session is valid and needs refresh
 */
export async function checkSessionValidity(): Promise<SessionCheckResult> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session check error:", error);
      return { isValid: false, needsRefresh: false, error: error.message };
    }

    if (!session) {
      return { isValid: false, needsRefresh: false, error: "No active session" };
    }

    // Check if session expires within 5 minutes (300 seconds)
    const expiresAt = session.expires_at || 0;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;
    
    if (timeUntilExpiry < 0) {
      return { isValid: false, needsRefresh: false, error: "Session expired" };
    }

    const needsRefresh = timeUntilExpiry < 300; // Refresh if less than 5 minutes remaining

    return { isValid: true, needsRefresh };
  } catch (error: any) {
    console.error("Session validity check failed:", error);
    return { isValid: false, needsRefresh: false, error: error.message };
  }
}

/**
 * Ensure the user has a valid session, refreshing if necessary
 * Throws an error with specific error codes for handling
 */
export async function ensureValidSession(): Promise<void> {
  const check = await checkSessionValidity();

  if (!check.isValid) {
    const errorType = check.error?.toLowerCase() || "";
    
    if (errorType.includes("expired") || errorType.includes("no active session")) {
      throw new Error("SESSION_EXPIRED");
    } else if (errorType.includes("refresh")) {
      throw new Error("REFRESH_FAILED");
    } else {
      throw new Error("AUTH_ERROR");
    }
  }

  if (check.needsRefresh) {
    console.log("Session expiring soon, refreshing...");
    
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Session refresh failed:", error);
        throw new Error("REFRESH_FAILED");
      }

      if (!data.session) {
        throw new Error("SESSION_EXPIRED");
      }

      console.log("Session refreshed successfully");
    } catch (error: any) {
      console.error("Session refresh error:", error);
      throw new Error("REFRESH_FAILED");
    }
  }
}

/**
 * Handle session errors with user-friendly messages and navigation
 */
export function handleSessionError(error: Error, navigate: (path: string) => void, currentPath: string) {
  const errorMessage = error.message;
  
  if (errorMessage === "SESSION_EXPIRED") {
    toast.error("Your session has expired. Please log in again.", {
      duration: 5000,
      action: {
        label: "Login",
        onClick: () => navigate(`/login?redirect=${encodeURIComponent(currentPath)}`),
      },
    });
    
    // Redirect after a short delay
    setTimeout(() => {
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }, 2000);
  } else if (errorMessage === "REFRESH_FAILED") {
    toast.error("Failed to refresh your session. Please log in again.", {
      duration: 5000,
      action: {
        label: "Login",
        onClick: () => navigate(`/login?redirect=${encodeURIComponent(currentPath)}`),
      },
    });
    
    setTimeout(() => {
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }, 2000);
  } else {
    toast.error("Authentication error. Please try logging in again.", {
      duration: 5000,
    });
    
    setTimeout(() => {
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }, 2000);
  }
}

/**
 * Start automatic session monitoring
 * Returns a cleanup function to stop monitoring
 */
export function startSessionMonitoring(
  onSessionExpired: () => void,
  checkIntervalMs: number = 60000 // Check every minute by default
): () => void {
  const intervalId = setInterval(async () => {
    const check = await checkSessionValidity();
    
    if (!check.isValid) {
      console.warn("Session is no longer valid:", check.error);
      onSessionExpired();
    } else if (check.needsRefresh) {
      console.log("Session needs refresh, attempting to refresh...");
      try {
        await ensureValidSession();
      } catch (error) {
        console.error("Auto-refresh failed:", error);
        onSessionExpired();
      }
    }
  }, checkIntervalMs);

  // Return cleanup function
  return () => clearInterval(intervalId);
}
