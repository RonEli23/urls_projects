import RedisMock from 'redis-mock';

//Mock redis Client
jest.mock('../../src/config/redisClient', () => ({
    createClient: jest.fn(() => RedisMock.createClient()),
}));

import { jest } from '@jest/globals';
import axios from 'axios';
import { handleUrls } from '../../src/controllers/url.controller';
import redisClient from "../../src/config/redisClient.js";


jest.mock('axios');
jest.mock('validator');

axios.get = jest.fn();
redisClient.set = jest.fn();

describe('handleUrls', () => {
    let req, res;

    beforeEach(async () => {
        req = {
            body: {
                urls: []
            },
            cachedResults: []
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await redisClient.connect();
        await redisClient.flushDb(); // Clear RedisMock database
    });

    afterEach(async () => {
        jest.clearAllMocks();  // Reset all mocks after each test
        await redisClient.disconnect(); // Disconnect after each test
    });

    it('should return 400 if less than 3 URLs are provided', async () => {
        req.body.urls = ['https://example.com'];

        await handleUrls(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'You must provide at least 3 valid URLs.' });
    });

    it('should fetch metadata for each URL and return results', async () => {
        req.body.urls = ['https://example.com', 'https://test.com', 'https://valid.com'];

        axios.get.mockResolvedValueOnce({ data: '<title>Example</title><meta name="description" content="Example description"><meta property="og:image" content="example.jpg">' });
        axios.get.mockResolvedValueOnce({ data: '<title>Test</title><meta name="description" content="Test description"><meta property="og:image" content="test.jpg">' });
        axios.get.mockResolvedValueOnce({ data: '<title>Valid</title><meta name="description" content="Valid description"><meta property="og:image" content="valid.jpg">' });

        await handleUrls(req, res);

        expect(res.json).toHaveBeenCalledWith([
            { url: 'https://example.com', metadata: { title: 'Example', description: 'Example description', image: 'example.jpg' } },
            { url: 'https://test.com', metadata: { title: 'Test', description: 'Test description', image: 'test.jpg' } },
            { url: 'https://valid.com', metadata: { title: 'Valid', description: 'Valid description', image: 'valid.jpg' } }
        ]);
    });

    it('should skip fetching for cached URLs and only fetch uncached URLs', async () => {
        req.body.urls = ['https://cached.com', 'https://test.com', 'https://valid.com'];
        req.cachedResults = [
            { url: 'https://cached.com', metadata: { title: 'Cached Example', description: 'Cached description', image: 'cached.jpg' } }
        ];

        axios.get.mockResolvedValueOnce({ data: '<title>Test</title><meta name="description" content="Test description"><meta property="og:image" content="test.jpg">' });
        axios.get.mockResolvedValueOnce({ data: '<title>Valid</title><meta name="description" content="Valid description"><meta property="og:image" content="valid.jpg">' });

        await handleUrls(req, res);

        expect(redisClient.set).toHaveBeenCalledTimes(2);
        expect(res.json).toHaveBeenCalledWith([
            { url: 'https://cached.com', metadata: { title: 'Cached Example', description: 'Cached description', image: 'cached.jpg' } },
            { url: 'https://test.com', metadata: { title: 'Test', description: 'Test description', image: 'test.jpg' } },
            { url: 'https://valid.com', metadata: { title: 'Valid', description: 'Valid description', image: 'valid.jpg' } }
        ]);
    });

    it('should return error metadata if any URL fetch fails', async () => {
        req.cachedResults = [];
        req.body.urls = ['https://example.com', 'https://test.com', 'https://valid.com'];
        
        axios.get.mockRejectedValueOnce(new Error('Network Error'));
        axios.get.mockResolvedValueOnce({ data: '<title>Test</title><meta name="description" content="Test description"><meta property="og:image" content="test.jpg">' });
        axios.get.mockResolvedValueOnce({ data: '<title>Valid</title><meta name="description" content="Valid description"><meta property="og:image" content="valid.jpg">' });

        await handleUrls(req, res);

        expect(redisClient.set).toHaveBeenCalledTimes(2); 
        expect(res.json).toHaveBeenCalledWith([
            { url: 'https://example.com', error: 'Failed to fetch metadata from https://example.com: Network Error' },
            { url: 'https://test.com', metadata: { title: 'Test', description: 'Test description', image: 'test.jpg' } },
            { url: 'https://valid.com', metadata: { title: 'Valid', description: 'Valid description', image: 'valid.jpg' } }
        ]);
    });
});