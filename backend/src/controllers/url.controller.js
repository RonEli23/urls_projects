import * as cheerio from 'cheerio';
import axios from 'axios';
import validator from 'validator';
import redisClient from '../config/redisClient.js';


export const handleUrls = async (req, res) => {
    const urlList = req.body.urls;
    console.log(req.body);
    if (!Array.isArray(urlList) || urlList.length < 3) {
        return res.status(400).json({ error: 'You must provide at least 3 valid URLs.' });
    }

    const metadataResults = [...req.cachedResults]; // Start with cached results

    for (let i = 0; i < urlList.length; i++) {
        const url = urlList[i];

        // Skip if URL is already cached
        if (metadataResults.find(result => result.url === url)) {
            continue;
        }

        try {
            const metadata = await fetchMetadata(url);
            if (metadata.error) {
                // Push error in case of missing metadata
                metadataResults.push({ url, error: metadata.error });
            } else {
                // Cache the new metadata in Redis
                await redisClient.set(url, JSON.stringify(metadata), 'EX', 3600);
                // Push metadata if everything is fine
                metadataResults.push({ url, metadata });
            }
        } catch (error) {
            // Add error information in the response for failed URLs
            metadataResults.push({
                url,
                error: error.message
            });
        }

    }

    return res.json(metadataResults);
}

// Helper function to fetch metadata from a single URL
const fetchMetadata = async (url) => {
    if (!validator.isURL(url)) {
        throw new Error(`Invalid URL: ${url}`);
    }

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const title = $('head > title').text() || $('meta[property="og:title"]').attr('content');
        const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content');
        const image = $('meta[property="og:image"]').attr('content');

        if (!title || !description || !image) {
            return {
                error: `Metadata is incomplete for URL: ${url} - Missing: ${!title ? 'title' : ''} ${!description ? 'description' : ''} ${!image ? 'image' : ''}`
            };
        }

        return { title, description, image };
    } catch (error) {
        return {
            error: `Failed to fetch metadata from ${url}: ${error.response?.status === 404 ? 'URL does not exist (404 error)' : error.message}`
        };
    }
};