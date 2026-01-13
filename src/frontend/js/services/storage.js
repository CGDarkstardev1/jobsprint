import fs from 'fs';
import path from 'path';
import crypto from 'crypto-js';
import { logger } from '../utils/logger.js';

export class StorageService {
    constructor(config = {}) {
        this.providers = new Map();
        this.config = {
            encryptionKey: config.encryptionKey,
            defaultProvider: config.defaultProvider || 'local',
            syncInterval: config.syncInterval || 300000,
            ...config
        };

        this.providers.set('local', new LocalStorageProvider(this.config));
        this.providers.set('google-drive', new GoogleDriveProvider(this.config));
    }

    async initialize() {
        await this.loadProviderConfigs();
        this.startSyncScheduler();
    }

    async configureProvider(providerName, config) {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Unknown storage provider: ${providerName}`);
        }

        await provider.authenticate(config);
        await this.saveProviderConfig(providerName, config);

        logger.info(`Configured storage provider: ${providerName}`);
        return provider;
    }

    async upload(filePath, data, options = {}) {
        const provider = this.getProvider(options.provider);
        const encryptedData = this.encryptData(data);

        return await provider.upload(filePath, encryptedData, options);
    }

    async download(filePath, options = {}) {
        const provider = this.getProvider(options.provider);
        const encryptedData = await provider.download(filePath, options);

        return this.decryptData(encryptedData);
    }

    async list(directory = '/', options = {}) {
        const provider = this.getProvider(options.provider);
        return await provider.list(directory, options);
    }

    async sync() {
        logger.info('Starting storage synchronization...');

        for (const [name, provider] of this.providers) {
            if (provider.isConfigured()) {
                try {
                    await provider.sync();
                    logger.debug(`Synced provider: ${name}`);
                } catch (error) {
                    logger.error(`Failed to sync provider ${name}:`, error);
                }
            }
        }

        logger.info('Storage synchronization completed');
    }

    getProvider(providerName = null) {
        const name = providerName || this.config.defaultProvider;
        const provider = this.providers.get(name);

        if (!provider) {
            throw new Error(`Storage provider not found: ${name}`);
        }

        return provider;
    }

    encryptData(data) {
        if (!this.config.encryptionKey) {
            return data;
        }

        const key = crypto.SHA256(this.config.encryptionKey).toString();
        return crypto.AES.encrypt(data, key).toString();
    }

    decryptData(encryptedData) {
        if (!this.config.encryptionKey) {
            return encryptedData;
        }

        const key = crypto.SHA256(this.config.encryptionKey).toString();
        const bytes = crypto.AES.decrypt(encryptedData, key);
        return bytes.toString(crypto.enc.Utf8);
    }

    async loadProviderConfigs() {
        const configPath = path.resolve('data', 'storage-config.json');

        try {
            if (fs.existsSync(configPath)) {
                const configs = JSON.parse(fs.readFileSync(configPath, 'utf8'));

                for (const [providerName, config] of Object.entries(configs)) {
                    if (config.enabled) {
                        await this.configureProvider(providerName, config);
                    }
                }
            }
        } catch (error) {
            logger.warn('Failed to load storage configurations:', error);
        }
    }

    async saveProviderConfig(providerName, config) {
        const configPath = path.resolve('data', 'storage-config.json');

        try {
            let configs = {};
            if (fs.existsSync(configPath)) {
                configs = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }

            configs[providerName] = { ...config, enabled: true };
            fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));
        } catch (error) {
            logger.error('Failed to save storage configuration:', error);
        }
    }

    startSyncScheduler() {
        setInterval(() => {
            this.sync().catch(error => {
                logger.error('Scheduled sync failed:', error);
            });
        }, this.config.syncInterval);
    }
}

class LocalStorageProvider {
    constructor(config) {
        this.config = config;
        this.basePath = path.resolve('data', 'storage');
        this.ensureDirectoryExists(this.basePath);
    }

    async authenticate(config) {
        return true;
    }

    async upload(filePath, data, options = {}) {
        const fullPath = path.join(this.basePath, filePath);
        this.ensureDirectoryExists(path.dirname(fullPath));

        fs.writeFileSync(fullPath, data);
        return { path: filePath, size: data.length };
    }

    async download(filePath, options = {}) {
        const fullPath = path.join(this.basePath, filePath);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        return fs.readFileSync(fullPath, 'utf8');
    }

    async list(directory = '/', options = {}) {
        const fullPath = path.join(this.basePath, directory);

        if (!fs.existsSync(fullPath)) {
            return [];
        }

        const items = fs.readdirSync(fullPath);
        return items.map(item => {
            const itemPath = path.join(fullPath, item);
            const stats = fs.statSync(itemPath);

            return {
                name: item,
                path: path.join(directory, item),
                type: stats.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                modified: stats.mtime
            };
        });
    }

    async delete(filePath) {
        const fullPath = path.join(this.basePath, filePath);

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            return true;
        }

        return false;
    }

    async sync() {
        return true;
    }

    isConfigured() {
        return true;
    }

    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
}

class GoogleDriveProvider {
    constructor(config) {
        this.config = config;
        this.drive = null;
        this.auth = null;
    }

async authenticate(config) {
        return true;
    }

    async upload(filePath, data, options = {}) {
        return { path: filePath, size: data.length };
    }

    async download(filePath, options = {}) {
        return 'mock data';
    }

    async list(directory = '/', options = {}) {
        return [];
    }

    async delete(fileId) {
        return true;
    }

    async sync() {
        return true;
    }

    isConfigured() {
        return false;
    }
}

export const storageService = new StorageService();