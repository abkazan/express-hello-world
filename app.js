const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');


const serviceAccount = require('/etc/secrets/FIREBASE_ENV.json');
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow requests from any origin
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.STORAGE_LINK,
});

app.post("/auth", (req, res) => {
    userInput = req.body.text;
    console.log('made it here: ', userInput);
    const db = admin.firestore();
    const docRef = db.collection('test').doc('BigBalls');

    docRef.get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                bcrypt.compare(userInput, data['key1'], (err, result) => {
                    if (err || !result) {
                        console.log('Auth failed')
                        return res.status(401).json({ "message": 'Authentication failed' });
                    } else {
                        console.log('Auth successful')
                        return res.json({ "message": 'Authentication successful' });
                    }
                    // Authentication successful
                    
                })
            } else {
                res.json({ "message": "data not found" });
            }
        })
        .catch((error) => {
            console.log('Error getting document:', error);
            res.status(500).json({ "message": "Internal Server Error" });
        });
    
});

app.get("/api", (req, res) => {
    const db = admin.firestore();
    const docRef = db.collection('test').doc('testData');

    docRef.get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                res.json({ "data": data });
            } else {
                res.json({ "data": [] });
            }
        })
        .catch((error) => {
            console.log('Error getting document:', error);
            res.status(500).json({ "error": "Internal Server Error" });
        });

});

app.get("/", (req, res) => res.send({"message": "hello from the server!"}));

const test = process.env.TEST;


const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

