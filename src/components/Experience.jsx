import React from 'react';
import { SectionWrapper } from '../hoc';

/*
 * Experience component is temporarily disabled
 * The original component displayed a vertical timeline of professional experiences
 * with detailed information about roles, responsibilities, and achievements
 */

function Experience() {
  return null;
}
Experience.displayName = 'Experience';

const WrappedExperience = SectionWrapper(Experience, 'work');
WrappedExperience.displayName = 'WrappedExperience';

export default WrappedExperience;