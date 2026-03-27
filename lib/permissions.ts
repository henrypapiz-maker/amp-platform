type Role = "admin" | "analyst" | "viewer";

const permissions: Record<string, Role[]> = {
  "view_targets": ["admin", "analyst", "viewer"],
  "view_gates": ["admin", "analyst", "viewer"],
  "create_target": ["admin", "analyst"],
  "edit_target": ["admin", "analyst"],
  "delete_target": ["admin"],
  "score_dimension": ["admin", "analyst"],
  "edit_weights": ["admin"],
  "manage_users": ["admin"],
  "edit_persona": ["admin"],
  "approve_gate": ["admin"],
  "close_target": ["admin"],
  "access_admin": ["admin", "analyst"],
  "view_audit": ["admin"],
  "upload_evidence": ["admin", "analyst"],
  "delete_evidence": ["admin", "analyst"],
};

export function hasPermission(role: string | undefined, action: string): boolean {
  if (!role) return false;
  const allowed = permissions[action];
  if (!allowed) return false;
  return allowed.includes(role as Role);
}

export function requireRole(role: string | undefined, ...allowed: Role[]): boolean {
  if (!role) return false;
  return allowed.includes(role as Role);
}
