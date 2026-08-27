"use client";

import { createContext, useContext, useMemo } from "react";
import type { MessageKey } from "./dictionaries";

/**
 * The resolved strings for one request, handed to the client.
 *
 * Server components call `getTranslator()`. Client components cannot - they
 * have no access to cookies or the database - so the layout resolves the whole
 * dictionary once and passes it down here. It is a few kilobytes of text, which
 * is cheaper than threading a `labels` prop through every component.
 */
type Messages = Record<string, string>;

const MessagesContext = createContext<Messages | null>(null);

/*
 * The language tag as well as the strings.
 *
 * A client component that formats a date needs it - the number and date
 * formats of a locale are not in the dictionary, and a component cannot read
 * the cookie the server resolved it from.
 */
const LocaleContext = createContext<string>("en");

export function LocaleProvider({
  messages,
  locale,
  children,
}: {
  messages: Messages;
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>
      <MessagesContext.Provider value={messages}>
        {children}
      </MessagesContext.Provider>
    </LocaleContext.Provider>
  );
}

/** The reader's language tag, for formatting a date or a number. */
export function useLocale(): string {
  return useContext(LocaleContext);
}

/**
 * `const t = useT()` then `t("action.save")`.
 *
 * Falls back to the key itself outside a provider, so a component rendered in a
 * test or a story still shows something readable rather than crashing.
 */
export function useT() {
  const messages = useContext(MessagesContext);

  return useMemo(
    () =>
      (key: MessageKey): string =>
        messages?.[key] ?? key,
    [messages],
  );
}
