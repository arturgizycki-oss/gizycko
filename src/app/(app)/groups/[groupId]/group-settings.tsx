"use client";

import { useActionState, useTransition } from "react";
import { deleteGroup, updateGroup, type GroupState } from "../actions";
import { CollapsibleSection } from "@/components/collapsible-section";
import { useT } from "@/lib/i18n/provider";

const RULES_PLACEHOLDER = `One rule per line, for example:
Keep it about sailing.
No selling.
Be civil or leave.`;

export function GroupSettings({
  groupId,
  name,
  description,
  rules,
  visibility,
  canDelete,
}: {
  groupId: string;
  name: string;
  description: string | null;
  rules: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  canDelete: boolean;
}) {
  const t = useT();
  const action = updateGroup.bind(null, groupId);
  const [state, formAction, pending] = useActionState<GroupState, FormData>(
    action,
    {},
  );
  const [deleting, startDelete] = useTransition();

  return (
    <CollapsibleSection
      title={t("groups.settingsTitle")}
      hint={t("groups.settingsHint")}
    >
      <form action={formAction} className="space-y-4 px-2 py-2">
        <label className="block">
          <span className="label">{t("groups.name")}</span>
          <input
            required
            name="name"
            minLength={3}
            maxLength={80}
            defaultValue={name}
            className="input mt-1"
          />
        </label>

        <label className="block">
          <span className="label">{t("groups.description")}</span>
          <textarea
            name="description"
            rows={3}
            maxLength={1000}
            defaultValue={description ?? ""}
            className="input mt-1 resize-none"
          />
        </label>

        <label className="block">
          <span className="label">{t("groups.rules")}</span>
          <textarea
            name="rules"
            rows={4}
            maxLength={2000}
            defaultValue={rules ?? ""}
            placeholder={RULES_PLACEHOLDER}
            className="input mt-1 resize-none"
          />
          <span className="hint">{t("groups.rulesHint")}</span>
        </label>

        <fieldset>
          <legend className="label">{t("groups.whoCanJoin")}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="chip">
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                defaultChecked={visibility === "PUBLIC"}
                className="sr-only"
              />
              {t("groups.visPublic")}
            </label>
            <label className="chip">
              <input
                type="radio"
                name="visibility"
                value="PRIVATE"
                defaultChecked={visibility === "PRIVATE"}
                className="sr-only"
              />
              {t("groups.visPrivate")}
            </label>
          </div>
        </fieldset>

        {state.error && (
          <p role="alert" className="text-sm text-rose-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-sm"
        >
          {pending ? t("action.saving") : t("action.save")}
        </button>
      </form>

      {canDelete && (
        <div className="mt-2 border-t border-[var(--line)] px-2 pt-3">
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (!confirm(t("groups.deleteConfirm"))) return;
              startDelete(() => deleteGroup(groupId));
            }}
            className="text-xs text-rose-600 hover:underline disabled:opacity-60"
          >
            {deleting ? t("groups.deleting") : t("groups.deleteGroup")}
          </button>
        </div>
      )}
    </CollapsibleSection>
  );
}
