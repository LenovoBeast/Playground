// Single source of truth for site navigation.
// Drives: Nav.jsx, useActiveSection, World.jsx (3D constellation)

export const SECTIONS = [
  { id: 'hero', label: 'Home', index: '01', color: 0x3b82f6, blurb: 'Welcome' },
  { id: 'projects', label: 'Work', index: '02', color: 0x22d3ee, blurb: 'Shipped products' },
  { id: 'about', label: 'About', index: '03', color: 0x34d399, blurb: 'The operator' },
  { id: 'stack', label: 'Stack', index: '04', color: 0xf59e0b, blurb: 'Tools of the trade' },
  { id: 'games', label: 'Playroom', index: '05', color: 0xf43f5e, blurb: 'Playable experiments' },
  { id: 'contact', label: 'Contact', index: '06', color: 0xa855f7, blurb: 'Start a project' },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);

export const SOCIALS = [
  { icon: 'github', label: 'GitHub', handle: 'LenovoBeast', href: 'https://github.com/LenovoBeast' },
  { icon: 'twitter', label: 'Twitter', handle: '@LenovoBeast', href: 'https://twitter.com/LenovoBeast' },
  { icon: 'linkedin', label: 'LinkedIn', handle: '/in/lenovobeast', href: 'https://linkedin.com/in/lenovobeast' },
  { icon: 'mail', label: 'Email', handle: 'lenovobeast@example.com', href: 'mailto:lenovobeast@example.com' },
];