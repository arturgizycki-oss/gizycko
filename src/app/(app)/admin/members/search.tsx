"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Search over the member list.
 *
 * Submitted rather than debounced: staff usually paste a whole address out of
 * a complaint, and a query per keystroke against every account is a lot of
 * database work for something nobody reads half-typed.
 */
export function MemberSearch({
  initial,
  filter,
}: {
  initial: string;
  filter: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    if (filter !== "all") params.set("filter", filter);

    const query = params.toString();
    startTransition(() =>
      router.push(query ? `/admin/members?${query}` : "/admin/members"),
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search by name, email, or account id"
        aria-label="Search members"
        className="gh-input"
      />
      <button type="submit" disabled={pending} className="gh-btn shrink-0">
        {pending ? "Searching" : "Search"}
      </button>
    </form>
  );
}
