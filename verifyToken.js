const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;
function verifyToken(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ message: 'Token not provided' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            console.log('JWT verification error:', err.message);
            console.log(token, secretKey);
            return res.status(401).json({ message: 'Token invalid or expired' });
        } else {
            console.log('JWT verification successful')
        }
        // Store the decoded information in the request object for use in route handlers
        req.user = decoded;
        next();
    });
}

module.exports = verifyToken;
