import RedisMock from 'redis-mock';

//Mock redis Client
jest.mock('../../src/config/redisClient', () => ({
    createClient: jest.fn(() => RedisMock.createClient()),
}));

import { jest } from '@jest/globals';
import { checkCache } from "../../src/middlewares/checkCache.js";
import redisClient from "../../src/config/redisClient.js";

describe("checkCache Middleware", () => {

    beforeEach(async () => {
        // Reset mocks before each test
        jest.clearAllMocks();
        // Connect the Redis client
        await redisClient.connect();
        await redisClient.flushDb(); // Clear RedisMock database
    })

    afterEach(async () => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        await redisClient.disconnect(); // Disconnect after each test
    });

    // urlList is empty 
    test("should call next when URL list is empty", async () => {
        const req = { body: { urls: [] } };
        const res = { json: jest.fn() };
        const next = jest.fn();

        await checkCache(req, res, next);

        expect(next).toHaveBeenCalled();

    })

    test("should return partially cached results and invoke next function", async () => {
        const mockUrls = ['url1', 'url2', 'url3'];
        const mockCachedMetadata = { metadata: 'some data' };

        // Set up mock data in RedisMock
        await redisClient.set('url1', JSON.stringify(mockCachedMetadata));
        await redisClient.set('url2', JSON.stringify(mockCachedMetadata));

        const req = { body: { urls: mockUrls } };
        const res = { json: jest.fn() };
        const next = jest.fn();

        await checkCache(req, res, next);

        expect(req.cachedResults).toEqual([
            { url: 'url1', metadata: mockCachedMetadata, source: 'cache' },
            { url: 'url2', metadata: mockCachedMetadata, source: 'cache' }
        ]);
        expect(next).toHaveBeenCalled();
        // Assert `res.json` was NOT called, as some URLs are not cached
        expect(res.json).not.toHaveBeenCalled();

    })

    // test when cache full;
    test("should return cached results if all URLs are cached", async () => {
        const mockUrls = ['url1', 'url2'];
        const mockCachedMetadata = { metadata: 'some data' };

        // Set up mock data in RedisMock
        await redisClient.set('url1', JSON.stringify(mockCachedMetadata));
        await redisClient.set('url2', JSON.stringify(mockCachedMetadata));

        const req = { body: { urls: mockUrls } };
        const res = { json: jest.fn() };
        const next = jest.fn();

        await checkCache(req, res, next);

        expect(res.json).toHaveBeenCalledWith([
            { url: 'url1', metadata: mockCachedMetadata, source: 'cache' },
            { url: 'url2', metadata: mockCachedMetadata, source: 'cache' }
        ]);
        expect(next).not.toHaveBeenCalled();
    })

    // error handling
    test("should call next with an error if redisClient.get throws an error", async () => {
        const mockUrls = ['url1', 'url2'];

        // Mock redisClient.get to throw an error
        jest.spyOn(redisClient, 'get').mockImplementation(() => {
            throw new Error('Redis error');
        });

        // Mock console.error
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const req = { body: { urls: mockUrls } };
        const res = { json: jest.fn() };
        const next = jest.fn();

        await checkCache(req, res, next);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error in cache middleware:',
            expect.any(Error)
        );

        // Assert `next` was called (but without an error argument)
        expect(next).toHaveBeenCalled();

        // Clean up mocks
        redisClient.get.mockRestore();
        consoleErrorSpy.mockRestore();
    });
})