import { createClient } from 'redis';
import { config } from 'dotenv';
config();

// Create Redis client using modern syntax
const redisClient = createClient({
    url: process.env.REDIS_URL, 
    socket: {
        tls: true, // Enables SSL/TLS (required for Upstash)
        rejectUnauthorized: false, // Bypasses SSL certificate issues
    }
});



// Handle connection events
redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

// // Explicitly connect to Redis
// await redisClient.connect();

export default redisClient;

