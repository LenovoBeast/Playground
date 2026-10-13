// Single source of truth for the site's contact address.
//
// TODO(owner): the value below is an RFC 2606 reserved placeholder
// (example.com) that CANNOT receive mail. Replace it with the real inbox
// address — every mailto handoff, footer link, and social link reads from
// here, so this one line is the whole contact path.
export const CONTACT_EMAIL = 'lenovobeast@example.com';

export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;
