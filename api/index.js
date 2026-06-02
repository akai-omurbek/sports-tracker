// Tell Vercel to bundle the React build with this function
export const config = {
  includeFiles: 'frontend/build/**'
};

export { default } from '../backend/server.js';
