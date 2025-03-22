import axios from 'axios';
const BASE_URL = process.env.REACT_APP_LOCAL_API_BASE_URL;
console.log(BASE_URL)

export default axios.create({
    baseURL: BASE_URL
});
