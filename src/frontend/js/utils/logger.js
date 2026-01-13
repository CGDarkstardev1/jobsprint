export const logger = {
    info: (message, context = {}) => console.log(`[INFO] [${new Date().toISOString()}] ${message}`, context),
    error: (message, error = {}) => console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, error),
    warn: (message, context = {}) => console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, context),
    debug: (message, context = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG] [${new Date().toISOString()}] ${message}`, context);
        }
    }
};
