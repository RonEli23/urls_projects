import redisClient from "../config/redisClient.js";

export const checkCache = async (req, res, next) => {
    const urlList = req.body.urls;
    
    if(urlList.length === 0){
        next();
    }
    
    try {
        const cachedResults = [];

        // Loop through URLs and check if they're cached
        for (let i = 0; i < urlList.length; i++) {
            const cachedMetadata = await redisClient.get(urlList[i]);
            if (cachedMetadata) {
                cachedResults.push({ url: urlList[i], metadata: JSON.parse(cachedMetadata), source: 'cache' });
            }
        }

        // If all URLs are cached, return the cached response
        if (cachedResults.length === urlList.length) {
            
            return res.json(cachedResults);
        }

        // Attach partially cached data to req object for use in controller
        req.cachedResults = cachedResults;

        next(); // Proceed to the controller if not all data is cached
    } catch (error) {
        console.error('Error in cache middleware:', error);
        next(); // Proceed to controller on error
    }
};
