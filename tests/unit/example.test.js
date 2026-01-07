/**
 * Example Unit Test
 * Demonstrates testing patterns for Jobsprint
 */

describe('Example Tests', () => {
    describe('Basic assertions', () => {
        test('should add two numbers correctly', () => {
            const result = 2 + 2;
            expect(result).toBe(4);
        });

        test('should handle async operations', async () => {
            const promise = Promise.resolve('success');
            await expect(promise).resolves.toBe('success');
        });
    });

    describe('Object testing', () => {
        const user = {
            id: 1,
            name: 'Test User',
            email: 'test@jobsprint.local',
        };

        test('should have correct properties', () => {
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('name', 'Test User');
        });

        test('should match object structure', () => {
            expect(user).toMatchObject({
                name: 'Test User',
                email: 'test@jobsprint.local',
            });
        });
    });

    describe('Array testing', () => {
        const items = [1, 2, 3, 4, 5];

        test('should contain expected items', () => {
            expect(items).toContain(3);
            expect(items).toHaveLength(5);
        });

        test('should have items greater than 2', () => {
            expect(items.filter(item => item > 2)).toEqual([3, 4, 5]);
        });
    });
});
