import { logEvents } from '../middlewares/logEvents.js';

const errorHandler = (err, req, res) => {
    logEvents(`${err.name}: ${err.message}`, 'errLog.txt');
    console.error(err.stack)
    res.status(500).send(err.message);
}

export default errorHandler;