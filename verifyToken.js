const jwt = require('jsonwebtoken');
const secretKey = process.env.secretKey;
function verifyToken(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ message: 'Token not provided' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            console.log('Token invalid or expired');
            return res.status(401).json({ message: 'Token invalid or expired' });
        }

        // Store the decoded information in the request object for use in route handlers
        req.user = decoded;
        next();
    });
}

module.exports = verifyToken;
