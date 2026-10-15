// Single source of truth for site navigation.
// Drives: Nav.jsx, useActiveSection, World.jsx (3D constellation)

import { CONTACT_EMAIL, CONTACT_MAILTO } from './contact.js';

export const SECTIONS = [
  { id: 'hero', label: 'Home', index: '01', color: 0xffffff, blurb: 'Welcome' },
  { id: 'projects', label: 'Work', index: '02', color: 0xd4d4d4, blurb: 'Shipped products' },
  { id: 'about', label: 'About', index: '03', color: 0xa1a1aa, blurb: 'The operator' },
  { id: 'stack', label: 'Stack', index: '04', color: 0xe4e4e7, blurb: 'Tools of the trade' },
  { id: 'games', label: 'Playroom', index: '05', color: 0x8a8a8a, blurb: 'Playable experiments' },
  { id: 'contact', label: 'Contact', index: '06', color: 0xbcbcbc, blurb: 'Start a project' },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);

export const SOCIALS = [
  { icon: 'github', label: 'GitHub', handle: 'LenovoBeast', href: 'https://github.com/LenovoBeast' },
  { icon: 'twitter', label: 'Twitter', handle: '@LenovoBeast', href: 'https://twitter.com/LenovoBeast' },
  { icon: 'linkedin', label: 'LinkedIn', handle: '/in/lenovobeast', href: 'https://linkedin.com/in/lenovobeast' },
  { icon: 'mail', label: 'Email', handle: CONTACT_EMAIL, href: CONTACT_MAILTO },
];