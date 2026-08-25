import { describe, expect, it } from "vitest";
import {
  can,
  canActOn,
  canLeave,
  type GroupAction,
  type GroupRole,
} from "@/lib/group-roles";

const ROLES: GroupRole[] = ["OWNER", "ADMIN", "MEMBER"];

describe("what each role may do", () => {
  const expected: Record<GroupAction, GroupRole[]> = {
    post: ["OWNER", "ADMIN", "MEMBER"],
    moderatePosts: ["OWNER", "ADMIN"],
    invite: ["OWNER", "ADMIN"],
    removeMember: ["OWNER", "ADMIN"],
    editGroup: ["OWNER", "ADMIN"],
    manageAdmins: ["OWNER"],
    transferOwnership: ["OWNER"],
    deleteGroup: ["OWNER"],
  };

  for (const [action, allowed] of Object.entries(expected) as [
    GroupAction,
    GroupRole[],
  ][]) {
    for (const role of ROLES) {
      const should = allowed.includes(role);
      it(`${role} ${should ? "can" : "cannot"} ${action}`, () => {
        expect(can(role, action)).toBe(should);
      });
    }
  }

  it("someone who is not a member can do nothing", () => {
    for (const action of Object.keys(expected) as GroupAction[]) {
      expect(can(null, action)).toBe(false);
    }
  });
});

describe("rank decides who may be acted on", () => {
  it("nobody may act on the owner", () => {
    for (const actor of ROLES) {
      expect(canActOn(actor, "OWNER")).toBe(false);
    }
  });

  it("the owner may act on admins and members", () => {
    expect(canActOn("OWNER", "ADMIN")).toBe(true);
    expect(canActOn("OWNER", "MEMBER")).toBe(true);
  });

  it("an admin may act on members but not on another admin", () => {
    expect(canActOn("ADMIN", "MEMBER")).toBe(true);
    // Otherwise two admins could remove each other, or one could remove the
    // person who appointed them.
    expect(canActOn("ADMIN", "ADMIN")).toBe(false);
  });

  it("a member may act on nobody", () => {
    for (const target of ROLES) {
      expect(canActOn("MEMBER", target)).toBe(false);
    }
  });

  it("a non-member may act on nobody", () => {
    for (const target of ROLES) {
      expect(canActOn(null, target)).toBe(false);
    }
  });
});

describe("leaving", () => {
  it("admins and members may leave", () => {
    expect(canLeave("ADMIN")).toBe(true);
    expect(canLeave("MEMBER")).toBe(true);
  });

  it("the owner may not, or the group is left with nobody in charge", () => {
    expect(canLeave("OWNER")).toBe(false);
  });

  it("a non-member has nothing to leave", () => {
    expect(canLeave(null)).toBe(false);
  });
});
