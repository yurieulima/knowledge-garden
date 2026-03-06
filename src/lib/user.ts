import { requireUser } from "./auth";

// Kept for backwards-compat with existing imports.
// Now it simply enforces that a real authenticated user exists.
export async function getOrCreateDemoUser() {
  return requireUser();
}



