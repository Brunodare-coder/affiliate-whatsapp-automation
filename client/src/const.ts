export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Local auth: login URL is now the internal /login page.
export const getLoginUrl = (returnPath?: string) => {
  if (returnPath && returnPath !== "/") {
    return `/login?return=${encodeURIComponent(returnPath)}`;
  }
  return "/login";
};

// Kept for backward compatibility (no-op in local auth mode)
export const getRegisterUrl = () => "/register";
