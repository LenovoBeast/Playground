// Single source of truth for the portfolio's project catalogue.
//
// `projects.json` is the canonical file (readable by tooling, non-JS
// consumers, and the contract enforced by `test/portfolioData.test.js`).
// This module re-exports it so the rendered UI can never drift from the JSON.
//
// Keep the two in sync: editing the JSON is the only way to change what the
// site shows. Do not hand-edit the array here.

import projects from '../../projects.json' with { type: 'json' }

export { projects }
export default projects