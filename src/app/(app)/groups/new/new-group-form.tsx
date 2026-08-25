"use client";

import { useActionState } from "react";
import { createGroup, type GroupState } from "../actions";
import { useT } from "@/lib/i18n/provider";

export function NewGroupForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState<GroupState, FormData>(
    createGroup,
    {},
  );

  return (
    <form action={formAction} className="card space-y-4 p-4">
      <label className="block">
        <span className="label">{t("groups.name")}</span>
        <input
          required
          name="name"
          minLength={3}
          maxLength={80}
          placeholder={t("groups.namePlaceholder")}
          className="input mt-1"
        />
      </label>

      <label className="block">
        <span className="label">{t("groups.purpose")}</span>
        <textarea
          name="description"
          rows={3}
          maxLength={1000}
          placeholder={t("groups.purposePlaceholder")}
          className="input mt-1 resize-none"
        />
      </label>

      <fieldset>
        <legend className="label">{t("groups.whoCanJoin")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="chip">
            <input
              type="radio"
              name="visibility"
              value="PUBLIC"
              defaultChecked
              className="sr-only"
            />
            {t("groups.visPublicHint")}
          </label>
          <label className="chip">
            <input
              type="radio"
              name="visibility"
              value="PRIVATE"
              className="sr-only"
            />
            {t("groups.visPrivateHint")}
          </label>
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? t("groups.creating") : t("groups.createGroup")}
      </button>
    </form>
  );
}
