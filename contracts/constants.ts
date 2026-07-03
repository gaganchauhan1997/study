export const Session = {
  cookieName: "session",
} as const;

export const ErrorMessages = {
  unauthenticated: "You must be logged in to access this resource.",
  insufficientRole: "You do not have permission to access this resource.",
} as const;
