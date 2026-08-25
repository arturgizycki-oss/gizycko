export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";

export type GroupAction =
  /** Write a post in the group. */
  | "post"
  /** Delete somebody else's post. */
  | "moderatePosts"
  /** Invite people in. */
  | "invite"
  /** Remove a member. Who exactly is decided by canActOn. */
  | "removeMember"
  /** Change the name, description, or visibility. */
  | "editGroup"
  /** Promote a member to admin, or demote an admin. */
  | "manageAdmins"
  /** Hand the group to somebody else. */
  | "transferOwnership"
  /** Delete the group and everything in it. */
  | "deleteGroup";

/**
 * What each role may do.
 *
 * Kept as data rather than a chain of ifs so the rules can be read in one
 * place, and asserted directly in tests.
 */
const PERMISSIONS: Record<GroupRole, readonly GroupAction[]> = {
  OWNER: [
    "post",
    "moderatePosts",
    "invite",
    "removeMember",
    "editGroup",
    "manageAdmins",
    "transferOwnership",
    "deleteGroup",
  ],
  ADMIN: ["post", "moderatePosts", "invite", "removeMember", "editGroup"],
  MEMBER: ["post"],
};

/** Whether a role may perform an action at all. Null means "not a member". */
export function can(role: GroupRole | null, action: GroupAction): boolean {
  if (!role) return false;
  return PERMISSIONS[role].includes(action);
}

/**
 * Whether `actor` may act on `target` — removing them, say.
 *
 * Rank matters as much as permission: an admin may remove ordinary members but
 * not another admin, and nobody may act on the owner. Without this an admin
 * could remove the person who appointed them.
 */
export function canActOn(actor: GroupRole | null, target: GroupRole): boolean {
  if (!actor) return false;
  if (target === "OWNER") return false;

  if (actor === "OWNER") return true;
  if (actor === "ADMIN") return target === "MEMBER";

  return false;
}

/**
 * The owner cannot simply leave: the group would be left with nobody able to
 * administer it. They hand it over first, or delete it.
 */
export function canLeave(role: GroupRole | null): boolean {
  return role === "ADMIN" || role === "MEMBER";
}

export const ROLE_LABEL: Record<GroupRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

/** What each role can do, for showing people the rules. */
export const ROLE_SUMMARY: Record<GroupRole, string> = {
  OWNER:
    "Runs the group: everything an admin can do, plus appointing admins, handing the group over, and deleting it.",
  ADMIN:
    "Invites people, removes members, edits the group, and deletes any post.",
  MEMBER: "Reads and writes posts.",
};
