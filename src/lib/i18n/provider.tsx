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

export function LocaleProvider({
  messages,
  children,
}: {
  messages: Messages;
  children: React.ReactNode;
}) {
  return (
    <MessagesContext.Provider value={messages}>
      {children}
    </MessagesContext.Provider>
  );
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
