export const addTechSkill = (skills, newSkill) => [...skills, newSkill];
export const addSoftSkill = (skills, newSkill) => [...skills, newSkill];
export const removeTechSkill = (skills, idx) => skills.filter((_, i) => i !== idx);
export const removeSoftSkill = (skills, idx) => skills.filter((_, i) => i !== idx);