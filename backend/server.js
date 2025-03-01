import express from 'express';
import credentials from "./src/middlewares/credentials.js"
import cors from 'cors';
import corsOptions from './src/config/corsOptions.js';
import { } from 'dotenv/config';
import { logger } from './src/middlewares/logEvents.js';
import errorHandler from './src/middlewares/errorHandler.js';
import urlRouter from "./src/routes/url.js";
import { limiter } from './src/middlewares/limiter.js';
import redisClient from "./src/config/redisClient.js"



const PORT = process.env.PORT || 8080;
const app = express();


app.use(logger);

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(limiter);

// routes
app.use('/fetch-metadata', urlRouter); 

app.get('/', (req, res) => {
    res.send('<h1>Welcome to My Express Server on AWS App Runner 🚀</h1>');
});

app.all('*', (req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler); //!!!check 


const connection = async () => {
        await redisClient.connect(); // Ensure Redis is connected before starting the server
        app.listen(PORT, () => console.log(`Listen on port ${PORT}`));
}
connection().catch(err => console.log(err.message));

// Export the app object
export default app;