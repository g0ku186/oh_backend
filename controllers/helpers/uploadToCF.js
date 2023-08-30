const axios = require('axios');
const FormData = require('form-data');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const uploadToCF = async (url, retries = 3, delay = 5000) => {
    try {
        const body = new FormData();
        body.append("url", url);
        const res = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_accountId}/images/v1`, body,
            {
                headers: { "Authorization": `Bearer ${process.env.CF_apiKey}`, ...body.getHeaders() }, // Include form boundary
            }
        );
        return res.data;

    } catch (err) {
        if (retries > 0) {
            console.log('Failed to upload to CF. Retrying...');
            await sleep(delay); // wait for the given delay
            return uploadToCF(url, retries - 1, delay); // recursively retry
        } else {
            console.log("=============ERROR: Cloudflare Upload Error=============");
            throw err;
        }
    }
}

module.exports = uploadToCF;
