import { ApiError } from "./security.ts";
// Only stable, allow-listed codes leave the server; never expose provider messages.
export function passwordError(error: { code?: string; status?: number } | null) {
  if (!error) return;
  if (error.code === "insufficient_aal") throw new ApiError(403, "password_mfa_required");
  if (error.code === "same_password") throw new ApiError(422, "password_unchanged");
  if (error.code === "weak_password") throw new ApiError(422, "password_too_weak");
  if (
    ["reauthentication_needed", "reauthentication_not_valid", "current_password_required"].includes(
      error.code || "",
    )
  )
    throw new ApiError(401, "password_reauthentication_required");
  if (error.status === 429) throw new ApiError(429, "try_later");
  throw new ApiError(error.status && error.status >= 500 ? 503 : 400, "password_update_failed");
}
