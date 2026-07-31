import { test } from "node:test";
import assert from "node:assert/strict";
import { canAccessEpisode, type SessionUser } from "../../lib/auth";

// getSessionUser wraps a live Supabase auth call, so only the pure
// authorization predicate canAccessEpisode is unit-tested here.

const regular: SessionUser = {
  id: "user-1",
  email: "user@example.com",
  isAdmin: false,
};
const admin: SessionUser = {
  id: "admin-1",
  email: "admin@example.com",
  isAdmin: true,
};

test("owner can access their own episode", () => {
  assert.equal(canAccessEpisode(regular, "user-1"), true);
});

test("a non-owner cannot access someone else's episode", () => {
  assert.equal(canAccessEpisode(regular, "someone-else"), false);
});

test("admin cannot access a regular user's owned episode", () => {
  // Ownership is checked first; admin privilege only unlocks unowned episodes.
  assert.equal(canAccessEpisode(admin, "user-1"), false);
});

test("admin can access legacy unowned episodes", () => {
  assert.equal(canAccessEpisode(admin, undefined), true);
});

test("a regular user cannot access legacy unowned episodes", () => {
  assert.equal(canAccessEpisode(regular, undefined), false);
});

test("admin accessing their own owned episode still passes the owner check", () => {
  assert.equal(canAccessEpisode(admin, "admin-1"), true);
});
