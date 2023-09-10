import crypto from "crypto";
import fetch from "node-fetch";

async function getOpenOrders() {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;

    // Create signature by hashing the query string with your secret key
    const signature = crypto
        .createHmac("sha256", SECRET)
        .update(queryString)
        .digest("hex");

    // Make API request to get all open orders
    const url = `${baseUrl}/api/v3/openOrders?${queryString}&signature=${signature}`;
    const headers = { "X-MBX-APIKEY": APIKEY };
    fetch(url, { headers })
        .then((response) => response.json())
        .then((orders) => {
            console.log(orders);
        })
        .catch((error) => {
            console.error(error);
        });
}

async function cancelOrder(orderId) {
    const timestamp = Date.now();
    const queryString = `symbol=ETHUSDT&orderId=${orderId}&timestamp=${timestamp}`;

    // Create signature by hashing the query string with your secret key
    const signature = crypto
        .createHmac("sha256", SECRET)
        .update(queryString)
        .digest("hex");

    // Make API request to cancel the order
    const url = `${baseUrl}/api/v3/order?${queryString}&signature=${signature}`;
    const headers = { "X-MBX-APIKEY": APIKEY };
    fetch(url, {
        method: "DELETE",
        headers,
    })
        .then((response) => response.json())
        .then((result) => {
            console.log(result);
        })
        .catch((error) => {
            console.error(error);
        });
}

export { getOpenOrders, cancelOrder };
