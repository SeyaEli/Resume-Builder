import { createAiHandler } from '../server/groq.js';

export const config = { maxDuration: 30 };
export default createAiHandler();
