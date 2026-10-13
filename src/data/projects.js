// Project data — re-exports projects.json verbatim.
// projects.json is the single source of truth. This module previously held a
// hand-maintained copy, which drifted the moment the JSON was edited; the
// portfolioData contract test now passes because the copy is gone.
import projectsData from '../../projects.json' with { type: 'json' };

export const projects = projectsData;

export default projectsData;
