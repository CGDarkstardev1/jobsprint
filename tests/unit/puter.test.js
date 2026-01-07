/**
 * Unit tests for Puter.js Integration
 */

import { PuterIntegration, PuterError } from '../../src/frontend/js/core/puter.js';

// Mock Puter.js SDK
global.puter = {
    auth: {
        signIn: jest.fn(),
        signOut: jest.fn(),
        isSignedIn: jest.fn(),
        getUser: jest.fn(),
        getMonthlyUsage: jest.fn()
    },
    fs: {
        write: jest.fn(),
        read: jest.fn(),
        mkdir: jest.fn(),
        readdir: jest.fn(),
        stat: jest.fn(),
        delete: jest.fn(),
        rename: jest.fn(),
        copy: jest.fn(),
        move: jest.fn(),
        upload: jest.fn(),
        getReadURL: jest.fn()
    },
    kv: {
        set: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        incr: jest.fn()
    },
    randName: jest.fn(() => 'random-name-123')
};

describe('PuterIntegration', () => {
    let puter;

    beforeEach(() => {
        puter = new PuterIntegration({
            appName: 'TestApp',
            debugMode: true
        });
        
        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should create instance with default config', () => {
            const defaultPuter = new PuterIntegration();
            expect(defaultPuter.config.appName).toBe('Jobsprint');
            expect(defaultPuter.config.maxRetries).toBe(3);
            expect(defaultPuter.config.retryDelay).toBe(1000);
        });

        test('should initialize successfully', async () => {
            puter.auth.isSignedIn.mockResolvedValue(false);
            
            const result = await puter.initialize();
            
            expect(result).toBe(true);
            expect(puter.isInitialized).toBe(true);
        });

        test('should initialize with authenticated user', async () => {
            const mockUser = { username: 'testuser', email: 'test@example.com' };
            puter.auth.isSignedIn.mockResolvedValue(true);
            puter.auth.getUser.mockResolvedValue(mockUser);
            
            await puter.initialize();
            
            expect(puter.currentUser).toEqual(mockUser);
        });

        test('should throw error if Puter.js not loaded', async () => {
            delete global.puter;
            
            const errorPuter = new PuterIntegration();
            await expect(errorPuter.initialize()).rejects.toThrow('SDK_NOT_LOADED');
        });
    });

    describe('Authentication', () => {
        beforeEach(async () => {
            puter.auth.isSignedIn.mockResolvedValue(false);
            await puter.initialize();
        });

        test('should check authentication status', async () => {
            puter.auth.isSignedIn.mockResolvedValue(true);
            
            const result = await puter.isAuthenticated();
            
            expect(result).toBe(true);
            expect(puter.auth.isSignedIn).toHaveBeenCalled();
        });

        test('should sign in user', async () => {
            const mockUser = { username: 'testuser', email: 'test@example.com' };
            puter.auth.signIn.mockResolvedValue(true);
            puter.auth.getUser.mockResolvedValue(mockUser);
            
            const onSuccess = jest.fn();
            const result = await puter.signIn(onSuccess);
            
            expect(result).toEqual(mockUser);
            expect(onSuccess).toHaveBeenCalledWith(mockUser);
        });

        test('should sign out user', async () => {
            puter.currentUser = { username: 'testuser' };
            puter.auth.signOut.mockResolvedValue(undefined);
            
            const result = await puter.signOut();
            
            expect(result).toBe(true);
            expect(puter.currentUser).toBe(null);
        });
    });

    describe('File Operations', () => {
        beforeEach(async () => {
            puter.auth.isSignedIn.mockResolvedValue(true);
            await puter.initialize();
        });

        test('should write file', async () => {
            puter.fs.write.mockResolvedValue({ path: '/test.txt' });
            
            const result = await puter.writeFile('test.txt', 'Hello, world!');
            
            expect(puter.fs.write).toHaveBeenCalledWith('test.txt', 'Hello, world!', {});
            expect(result.path).toBe('/test.txt');
        });

        test('should read file', async () => {
            const mockBlob = new Blob(['Hello, world!']);
            puter.fs.read.mockResolvedValue(mockBlob);
            
            const result = await puter.readFile('test.txt');
            
            expect(puter.fs.read).toHaveBeenCalledWith('test.txt', {});
            expect(result).toBe(mockBlob);
        });

        test('should read text file', async () => {
            const mockBlob = new Blob(['Hello, world!']);
            puter.fs.read.mockResolvedValue(mockBlob);
            
            const result = await puter.readTextFile('test.txt');
            
            expect(result).toBe('Hello, world!');
        });

        test('should read JSON file', async () => {
            const mockData = { test: 'data' };
            const mockBlob = new Blob([JSON.stringify(mockData)]);
            puter.fs.read.mockResolvedValue(mockBlob);
            
            const result = await puter.readJSONFile('test.json');
            
            expect(result).toEqual(mockData);
        });

        test('should create directory', async () => {
            puter.fs.mkdir.mockResolvedValue({ path: '/test-dir' });
            
            const result = await puter.createDirectory('test-dir');
            
            expect(puter.fs.mkdir).toHaveBeenCalledWith('test-dir', {});
            expect(result.path).toBe('/test-dir');
        });

        test('should list directory', async () => {
            const mockItems = [
                { path: '/file1.txt', name: 'file1.txt' },
                { path: '/file2.txt', name: 'file2.txt' }
            ];
            puter.fs.readdir.mockResolvedValue(mockItems);
            
            const result = await puter.listDirectory('./');
            
            expect(result).toEqual(mockItems);
            expect(result.length).toBe(2);
        });

        test('should get metadata', async () => {
            const mockMetadata = {
                name: 'test.txt',
                path: '/test.txt',
                size: 1024,
                created: '2025-01-01T00:00:00.000Z'
            };
            puter.fs.stat.mockResolvedValue(mockMetadata);
            
            const result = await puter.getMetadata('test.txt');
            
            expect(result).toEqual(mockMetadata);
        });

        test('should delete file', async () => {
            puter.fs.delete.mockResolvedValue(undefined);
            
            const result = await puter.delete('test.txt');
            
            expect(result).toBe(true);
            expect(puter.fs.delete).toHaveBeenCalledWith('test.txt');
        });

        test('should rename file', async () => {
            puter.fs.rename.mockResolvedValue({ path: '/newname.txt' });
            
            const result = await puter.rename('old.txt', 'newname.txt');
            
            expect(result.path).toBe('/newname.txt');
        });

        test('should copy file', async () => {
            puter.fs.copy.mockResolvedValue({ path: '/copy.txt' });
            
            const result = await puter.copy('original.txt', 'copy.txt');
            
            expect(result.path).toBe('/copy.txt');
        });

        test('should move file', async () => {
            puter.fs.move.mockResolvedValue({ path: '/moved.txt' });
            
            const result = await puter.move('file.txt', '/newpath/moved.txt');
            
            expect(result.path).toBe('/moved.txt');
        });
    });

    describe('Key-Value Store', () => {
        beforeEach(async () => {
            puter.auth.isSignedIn.mockResolvedValue(true);
            await puter.initialize();
        });

        test('should set KV value', async () => {
            puter.kv.set.mockResolvedValue(undefined);
            
            const result = await puter.setKV('test-key', 'test-value');
            
            expect(result).toBe(true);
            expect(puter.kv.set).toHaveBeenCalledWith('test-key', 'test-value');
        });

        test('should get KV value', async () => {
            puter.kv.get.mockResolvedValue('test-value');
            
            const result = await puter.getKV('test-key');
            
            expect(result).toBe('test-value');
        });

        test('should delete KV value', async () => {
            puter.kv.del.mockResolvedValue(undefined);
            
            const result = await puter.deleteKV('test-key');
            
            expect(result).toBe(true);
            expect(puter.kv.del).toHaveBeenCalledWith('test-key');
        });

        test('should increment KV value', async () => {
            puter.kv.incr.mockResolvedValue(5);
            
            const result = await puter.incrementKV('counter', 2);
            
            expect(result).toBe(5);
            expect(puter.kv.incr).toHaveBeenCalledWith('counter', 2);
        });
    });

    describe('Error Handling', () => {
        test('should retry operations on failure', async () => {
            puter.auth.isSignedIn.mockResolvedValue(true);
            await puter.initialize();
            
            // Fail twice, succeed on third try
            puter.fs.write
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({ path: '/test.txt' });
            
            const result = await puter.writeFile('test.txt', 'data');
            
            expect(result.path).toBe('/test.txt');
            expect(puter.fs.write).toHaveBeenCalledTimes(3);
        });

        test('should fail after max retries', async () => {
            puter.auth.isSignedIn.mockResolvedValue(true);
            await puter.initialize();
            
            puter.fs.write.mockRejectedValue(new Error('Persistent error'));
            
            await expect(puter.writeFile('test.txt', 'data')).rejects.toThrow('MAX_RETRIES_EXCEEDED');
            expect(puter.fs.write).toHaveBeenCalledTimes(3); // maxRetries = 3
        });
    });

    describe('Event System', () => {
        test('should add event listener', () => {
            const callback = jest.fn();
            puter.on('test-event', callback);
            
            expect(puter.eventListeners.has('test-event')).toBe(true);
            expect(puter.eventListeners.get('test-event')).toContain(callback);
        });

        test('should remove event listener', () => {
            const callback = jest.fn();
            puter.on('test-event', callback);
            puter.off('test-event', callback);
            
            expect(puter.eventListeners.get('test-event')).not.toContain(callback);
        });

        test('should trigger event', () => {
            const callback = jest.fn();
            puter.on('test-event', callback);
            
            puter._triggerEvent('test-event', { data: 'test' });
            
            expect(callback).toHaveBeenCalledWith({ data: 'test' });
        });
    });

    describe('Utility Functions', () => {
        test('should check if path exists', async () => {
            puter.auth.isSignedIn.mockResolvedValue(true);
            await puter.initialize();
            
            puter.fs.stat.mockResolvedValue({ name: 'test.txt' });
            
            const exists = await puter.exists('test.txt');
            
            expect(exists).toBe(true);
        });

        test('should return false for non-existent path', async () => {
            puter.auth.isSignedIn.mockResolvedValue(true);
            await puter.initialize();
            
            puter.fs.stat.mockRejectedValue(new Error('Not found'));
            
            const exists = await puter.exists('test.txt');
            
            expect(exists).toBe(false);
        });

        test('should ensure directory exists', async () => {
            puter.auth.isSignedIn.mockResolvedValue(true);
            await puter.initialize();
            
            // Path doesn't exist
            puter.fs.stat.mockRejectedValue(new Error('Not found'));
            puter.fs.mkdir.mockResolvedValue({ path: '/new-dir' });
            
            const result = await puter.ensureDirectory('new-dir');
            
            expect(result).toBe(true);
            expect(puter.fs.mkdir).toHaveBeenCalled();
        });
    });
});
