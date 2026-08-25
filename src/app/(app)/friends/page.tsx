import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { hiddenUserIds } from "@/lib/social";
import { Avatar } from "@/components/avatar";
import { PRIMARY_PHOTO_WHERE, photoUrlOf } from "@/lib/avatar";
import { CollapsibleSection } from "@/components/collapsible-section";
import { FriendButton } from "@/components/friend-button";
import { openConversation } from "@/lib/actions/conversations";
import { getTranslator } from "@/lib/i18n";
import { SearchField } from "@/components/search-field";
import { readQuery, searchPeople } from "@/lib/search";
import type { FriendState } from "@/components/friend-button";

const PROFILE_AVATAR = {
  displayName: true,
  photos: { where: PRIMARY_PHOTO_WHERE, select: { url: true }, take: 1 },
};

const rowClass =
  "flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800";

const emptyClass = "px-2 py-3 text-sm text-neutral-500";

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { session } = await requireProfile();
  const me = session.user.id;
  const t = await getTranslator();

  const query = readQuery((await searchParams).q);
  const hidden = await hiddenUserIds(me);

  const [incoming, accepted, suggestions] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        addresseeId: me,
        status: "PENDING",
        requesterId: { notIn: hidden },
      },
      include: {
        requester: {
          select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: me }, { addresseeId: me }],
      },
      include: {
        requester: {
          select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
        },
        addressee: {
          select: { id: true, name: true, profile: { select: PROFILE_AVATAR } },
        },
      },
    }),
    prisma.profile.findMany({
      where: {
        completedAt: { not: null },
        isVisible: true,
        userId: { notIn: [me, ...hidden] },
        user: {
          bannedAt: null,
          friendRequestsSent: { none: { addresseeId: me } },
          friendRequestsReceived: { none: { requesterId: me } },
        },
      },
      orderBy: { lastActiveAt: "desc" },
      take: 20,
      select: {
        userId: true,
        displayName: true,
        city: true,
        photos: { where: PRIMARY_PHOTO_WHERE, select: { url: true }, take: 1 },
      },
    }),
  ]);

  const friends = accepted.map((row) =>
    row.requesterId === me ? row.addressee : row.requester,
  );

  if (query) {
    const found = await searchPeople(me, query);
    const states = await friendStates(
      me,
      found.map((person) => person.id),
    );

    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("friends.title")}
        </h1>

        <SearchField placeholder={t("search.people")} initial={query} />

        <section className="card p-2">
          <p className="label px-2 pt-1 pb-2">
            {t("search.results")} ({found.length})
          </p>

          {found.length === 0 ? (
            <p className={emptyClass}>{t("search.noPeople")}</p>
          ) : (
            <ul>
              {found.map((person) => (
                <li key={person.id} className={rowClass}>
                  <Link href={`/u/${person.id}`} aria-label={person.name}>
                    <Avatar name={person.name} src={person.photo} size={40} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/u/${person.id}`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {person.name}
                    </Link>
                    {person.city && <p className="hint">{person.city}</p>}
                  </div>
                  <FriendButton
                    userId={person.id}
                    state={states.get(person.id)?.state ?? "none"}
                    friendshipId={states.get(person.id)?.id ?? null}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">
        {t("friends.title")}
      </h1>

      <SearchField placeholder={t("search.people")} />

      <CollapsibleSection
        title={t("friends.requests")}
        count={incoming.length}
        hint={t("friends.requestsHint")}
        defaultOpen={incoming.length > 0}
      >
        {incoming.length === 0 ? (
          <p className={emptyClass}>{t("friends.requestsEmpty")}</p>
        ) : (
          <ul>
            {incoming.map((request) => {
              const name =
                request.requester.profile?.displayName ??
                request.requester.name;

              return (
                <li key={request.id} className={rowClass}>
                  <Link href={`/u/${request.requester.id}`} aria-label={name}>
                    <Avatar
                      name={name}
                      src={photoUrlOf(request.requester.profile)}
                      size={40}
                    />
                  </Link>
                  <Link
                    href={`/u/${request.requester.id}`}
                    className="flex-1 text-sm font-medium hover:underline"
                  >
                    {name}
                  </Link>
                  <FriendButton
                    userId={request.requester.id}
                    state="incoming"
                    friendshipId={request.id}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title={t("friends.yours")}
        count={friends.length}
        defaultOpen={friends.length > 0}
      >
        {friends.length === 0 ? (
          <p className={emptyClass}>{t("friends.yoursEmpty")}</p>
        ) : (
          <ul>
            {friends.map((friend) => {
              const name = friend.profile?.displayName ?? friend.name;

              return (
                <li key={friend.id} className={rowClass}>
                  <Link href={`/u/${friend.id}`} aria-label={name}>
                    <Avatar
                      name={name}
                      src={photoUrlOf(friend.profile)}
                      size={40}
                    />
                  </Link>
                  <Link
                    href={`/u/${friend.id}`}
                    className="flex-1 text-sm font-medium hover:underline"
                  >
                    {name}
                  </Link>
                  <form action={openConversation.bind(null, friend.id)}>
                    <button type="submit" className="btn btn-primary btn-sm">
                      {t("action.message")}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title={t("friends.suggestions")}
        count={suggestions.length}
        hint={t("friends.suggestionsHint")}
      >
        {suggestions.length === 0 ? (
          <p className={emptyClass}>{t("friends.suggestionsEmpty")}</p>
        ) : (
          <ul>
            {suggestions.map((person) => (
              <li key={person.userId} className={rowClass}>
                <Link
                  href={`/u/${person.userId}`}
                  aria-label={person.displayName}
                >
                  <Avatar
                    name={person.displayName}
                    src={photoUrlOf(person)}
                    size={40}
                  />
                </Link>
                <div className="flex-1">
                  <Link
                    href={`/u/${person.userId}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {person.displayName}
                  </Link>
                  {person.city && (
                    <p className="text-xs text-neutral-500">{person.city}</p>
                  )}
                </div>
                <FriendButton
                  userId={person.userId}
                  state="none"
                  friendshipId={null}
                />
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>
    </div>
  );
}

/**
 * Where the viewer stands with each of these people, in one query.
 *
 * The friend button needs a state per row, and asking per row would be a query
 * per result.
 */
async function friendStates(
  me: string,
  userIds: string[],
): Promise<Map<string, { state: FriendState; id: string | null }>> {
  const states = new Map<string, { state: FriendState; id: string | null }>();
  if (userIds.length === 0) return states;

  const rows = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: me, addresseeId: { in: userIds } },
        { addresseeId: me, requesterId: { in: userIds } },
      ],
    },
    select: {
      id: true,
      status: true,
      requesterId: true,
      addresseeId: true,
    },
  });

  for (const row of rows) {
    const other = row.requesterId === me ? row.addresseeId : row.requesterId;

    if (row.status === "ACCEPTED") {
      states.set(other, { state: "friends", id: row.id });
    } else if (row.status === "PENDING") {
      states.set(other, {
        state: row.requesterId === me ? "requested" : "incoming",
        id: row.id,
      });
    }
  }

  return states;
}
