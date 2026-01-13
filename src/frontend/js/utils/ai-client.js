import { init as initPuter } from '@heyputer/puter.js/src/init.cjs';
import { logger } from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.PUTER_API_KEY) {
    logger.error('FATAL: PUTER_API_KEY not set in environment!');
    throw new Error('PUTER_API_KEY missing - cannot initialize AI Client');
}

let puter;
try {
    puter = initPuter(process.env.PUTER_API_KEY);
    logger.info('Puter.js client initialized successfully');
} catch (error) {
    logger.error('Failed to initialize Puter.js:', error.message);
    throw error;
}

export default puter;
