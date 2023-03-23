const express = require('express');
const {auth, resolver, loaders} = require('@iden3/js-iden3-auth')
const getRawBody = require('raw-body')

const app = express();
const port = 4005;

app.use(express.static('static'));

app.get("/api/sign-in", (req, res) => {
    console.log('get Auth Request');
    GetAuthRequest(req,res);
});

app.post("/api/callback", (req, res) => {
    console.log('callback');
    Callback(req,res);
});

app.listen(port, () => {
    console.log(`server running on port ${port}`);
});

// Create a map to store the auth requests and their session IDs
const requestMap = new Map();

// GetQR returns auth request
async function GetAuthRequest(req,res) {
    // public accessible callback url
    const hostUrl = `http://138.201.206.172:${port}`;
    const callbackURL = "/api/callback"
    // use issuer did as audience
    const audience = "did:polygonid:polygon:mumbai:2qMw4SH4a5WvWkPSEzxaNi3tf6MYiuCLVvy7T7rCHT"
    const sessionId = 1;

    const uri = `${hostUrl}${callbackURL}?sessionId=${sessionId}`;

    // Generate request for basic authentication
    const request = auth.createAuthorizationRequestWithMessage(
        'bastic authorization',
        'WIW want to get your did',
        audience,
        uri,
    );

    request.id = '7f38a193-0918-4a48-9fac-36adfdb8b542';
    request.thid = '7f38a193-0918-4a48-9fac-36adfdb8b542';

    // Track session id throughout the authorization flow, could ignore
    requestMap.set(`${sessionId}`, request);

    // TODO: in practice, the request json could be converted to QR code for polygonID user to scan
    return res.status(200).set('Content-Type', 'application/json').send(request);
}

// Callback verifies the proof after sign-in callbacks
async function Callback(req,res) {
    console.log("Receiving callback")
    console.log(JSON.stringify(req))

    // Get session ID from request
    const sessionId = req.query.sessionId;

    // get JWZ token params from the post request
    // JWZ: https://0xpolygonid.github.io/tutorials/wallet/wallet-sdk/polygonid-sdk/iden3comm/jwz/#header
    const raw = await getRawBody(req);
    const jwzToken = raw.toString().trim();
    const payload = jwzToken.split('.')[1]
    const decodedPayload = new Buffer(payload, 'base64').toString('utf-8')
    console.log(decodedPayload)
    const payloadJson = JSON.parse(decodedPayload)
    console.log(JSON.stringify(payloadJson))

    // need to return 200 response to mobile App in time.
    return res.status(200).set('Content-Type', 'application/json').send("Successfully authenticated");
}