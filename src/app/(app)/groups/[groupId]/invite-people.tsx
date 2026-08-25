"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/avatar";
import {
  inviteToGroup,
  searchPeopleToInvite,
  type Invitable,
} from "../actions";
import { useT } from "@/lib/i18n/provider";

/**
 * Search anyone by name and invite them.
 *
 * The friends list below covers the common case; this covers building a group
 * out of people you have not befriended, which an owner usually needs.
 */
export function InvitePeople({ groupId }: { groupId: string }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Invitable[]>([]);
  const [invited, setInvited] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();

  function search(value: string) {
    setQuery(value);

    if (value.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    startTransition(async () => {
      setResults(await searchPeopleToInvite(groupId, value));
      setSearched(true);
    });
  }

  return (
    <div className="px-2 py-2">
      <label className="label" htmlFor="invite-search">
        {t("groups.inviteAnyone")}
      </label>
      <input
        id="invite-search"
        type="search"
        value={query}
        onChange={(event) => search(event.target.value)}
        placeholder={t("groups.searchPeople")}
        className="input mt-1"
      />

      {pending && <p className="hint mt-2">{t("groups.searching")}</p>}

      {!pending && searched && results.length === 0 && (
        <p className="hint mt-2">{t("groups.noMatches")}</p>
      )}

      {results.length > 0 && (
        <ul className="mt-2 space-y-1">
          {results.map((person) => (
            <li
              key={person.id}
              className="flex items-center gap-3 rounded-xl px-1 py-1.5"
            >
              <Avatar name={person.name} src={person.photo} size={32} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {person.name}
              </span>

              {invited.includes(person.id) ? (
                <span className="hint shrink-0">{t("action.invited")}</span>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await inviteToGroup(groupId, person.id);
                      setInvited((current) => [...current, person.id]);
                    })
                  }
                  className="btn btn-secondary btn-sm shrink-0"
                >
                  Invite
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
