/**
 * The look of the mail this site sends.
 *
 * Written the way email has to be written rather than the way the site is:
 * tables for layout, every style inline, no flexbox, no grid, no stylesheet.
 * Outlook renders with Word's engine and Gmail strips <style> blocks, so the
 * modern version of this arrives as a column of unstyled text.
 *
 * Nothing here loads an image. Most clients block remote images until the
 * reader allows them, and a logo that starts as a broken icon is worse than a
 * wordmark that always draws. The colour and the type carry the brand instead.
 */

const BRAND = "#1B7CF0";
const INK = "#1B2430";
const MUTED = "#6B7684";
const LINE = "#E3E8EF";
const PAPER = "#F5F7FA";

/** Escape anything that came from a person before it goes near markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EmailContent = {
  /** The line under the subject in an inbox list. */
  preheader: string;
  heading: string;
  /** One paragraph per entry. Escaped for you. */
  paragraphs: string[];
  action?: { label: string; url: string };
  /** Small print under the rule. */
  footer?: string[];
};

export function renderEmail(content: EmailContent): string {
  const { preheader, heading, paragraphs, action, footer = [] } = content;

  const body = paragraphs
    .map(
      (line) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:26px;color:${INK};">${escapeHtml(line)}</p>`,
    )
    .join("");

  /*
   * The button is a table, not an anchor with padding.
   *
   * Outlook ignores padding on an inline element, which collapses a styled
   * link into blue text on a white background - still usable, but it stops
   * looking like the thing to press.
   */
  const button = action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
         <tr>
           <td align="center" bgcolor="${BRAND}" style="border-radius:8px;">
             <a href="${escapeHtml(action.url)}"
                style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(action.label)}</a>
           </td>
         </tr>
       </table>`
    : "";

  // The same address in full, for anyone whose client will not follow a button.
  const fallback = action
    ? `<p style="margin:0 0 4px;font-size:13px;line-height:20px;color:${MUTED};">${escapeHtml(
        "Or copy this address into your browser:",
      )}</p>
       <p style="margin:0 0 24px;font-size:13px;line-height:20px;word-break:break-all;"><a href="${escapeHtml(action.url)}" style="color:${BRAND};">${escapeHtml(action.url)}</a></p>`
    : "";

  const small = footer
    .map(
      (line) =>
        `<p style="margin:0 0 8px;font-size:13px;line-height:20px;color:${MUTED};">${escapeHtml(line)}</p>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};">
<!-- Shown beside the subject in the inbox, then hidden by the width of zero. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:14px;">
        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;letter-spacing:-0.3px;color:${BRAND};">gizycko</p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            <h1 style="margin:0 0 16px;font-size:22px;line-height:30px;font-weight:700;color:${INK};">${escapeHtml(heading)}</h1>
            ${body}
            ${button}
            ${fallback}
            ${small ? `<div style="margin-top:8px;padding-top:20px;border-top:1px solid ${LINE};">${small}</div>` : ""}
          </td>
        </tr>
      </table>

      <p style="margin:20px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:${MUTED};">gizycko.online</p>

    </td>
  </tr>
</table>
</body>
</html>`;
}
