// Single source of truth for the site's contact address.
//
// NOTE: the value below is an RFC 2606 reserved placeholder (example.com)
// that cannot receive mail. The owner has reviewed this and chosen to keep
// it as-is — do not "fix" it to some invented address. Every mailto handoff,
// footer link, and social link reads from here, so if a real inbox is ever
// wanted, this one line is the whole change.
export const CONTACT_EMAIL = 'lenovobeast@example.com';

export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;
