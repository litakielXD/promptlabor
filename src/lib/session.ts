type SessionLike = {
  user?: unknown;
} | null | undefined;

type SessionUserFlags = {
  role?: unknown;
  approved?: unknown;
};

function getSessionUser(session: SessionLike) {
  return session?.user as SessionUserFlags | undefined;
}

export function isAdminSession(session: SessionLike) {
  return getSessionUser(session)?.role === "ADMIN";
}

export function isApprovedSession(session: SessionLike) {
  const user = getSessionUser(session);
  return user?.approved === true || user?.role === "ADMIN";
}
