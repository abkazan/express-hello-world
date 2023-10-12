const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const Multer = require('multer');
const sharp = require('sharp');
const uuid = require('uuid');

app.use(bodyParser.json());

const serviceAccount = require('/etc/secrets/FIREBASE_ENV.json');

app.get('/testing69', function (req, res) {
    const userIP = req.ip;
    const message = "testing some new shit";
    const responseObj = {
        message: message,
        userIp: userIP,
    };
    res.json(responseObj);
    /* res.send('Hello World!'); */
});



app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Allow requests from any origin
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    console.log('Request IP:', req.ip);
    console.log('Request Headers IP:', req.headers['x-forwarded-for'];
    if (req.socket) {
        console.log(`socket remote address (another way of getting IP): ${req.socket.remoteAddress}`);
    }
    next();
});

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.STORAGE_LINK,
});

app.post("/auth", (req, res) => {
    const sessionId = uuid.v4();
    const userInput = req.body.text;
    // console.log('made it here: ', userInput);
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
                        console.log('Auth successful');
                        res.cookie('sessionId', sessionId, {
                            httpOnly: true,
                            secure: true,
                            sameSite: 'strict',
                            maxAge: 24 * 60 * 60 * 1000,
                        });
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

app.get("/getCurrentImage", (req, res) => {
    const db = admin.firestore();
    const docRef = db.collection('test').doc('changeCurrentImage');
    docRef.get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            res.json({ "data": data });
        } else {
            res.json({ "data": [] });
        }
    }).catch((error) => {
        console.log('Error getting document:', error);
        res.status(500).json({ "error": "Internal Server Error" });
    })
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

const upload = Multer({ storage: Multer.memoryStorage() });

app.post("/api/upload", upload.single('image'), async (req, res, next) => {
    // Get the uploaded file object

    const fileBuffer = req.file.buffer;
    const location = req.body.location;
    let retUrl = "";

    try {
        const webpBuffer = await sharp(fileBuffer).webp().toBuffer();
        const bucket = admin.storage().bucket();

        const fileRef = bucket.file(req.file.originalname.replace(/\.[^.]+$/, '.webp'));
        await fileRef.createWriteStream().end(webpBuffer);

        console.log("WebP image uploaded to storage");
        fileRef.getSignedUrl({
            action: 'read',
            expires: '03-17-2028' // Your expiration date goes here
        }).then((url) => {
            retUrl = url[0];
            // Store the URL in Firestore
            if (location === 'profile') {
                admin.firestore().collection('test').doc('changeCurrentImage').update({
                    [req.body.name]: url[0]
                });
            } else if (location === 'podcasts') {
                console.log('made it here')
                admin.firestore().collection('test').doc('podcasts').get().then(doc => {
                    const data = doc.data();
                    const newData = [...data['data']];
                    newData[parseInt(req.body.name, 10)].image = url[0];
                    admin.firestore().collection('test').doc('podcasts').update({
                        data: newData
                    });
                })

            } else {
                docRef = admin.firestore().collection('test').doc('podcasts');
                docRef.get()
                    .then((doc) => {
                        //console.log('req body: ', req.body);
                        if (doc.exists) {
                            const existingData = doc.data()
                            console.log(existingData.data.length)
                            const newData = [
                                {
                                    title: req.body.title,
                                    desc: req.body.description,
                                    image: url[0],
                                    spotify_link: req.body.spotifyLink,
                                    apple_link: req.body.appleLink,
                                    episode: existingData.data.length + 1
                                },
                                ...existingData.data,
                            ];
                            docRef.update({ data: newData });

                        }
                    })
            }
            console.log("image url uploaded to firestore");
            res.send(['File Uploaded Successfully', retUrl]);
        }).catch((error) => {
            console.error('Error updating document:', error);
        });

    } catch (error) {
        console.log('Error processing/loading webp image', error);
    }
});

app.get('/api/getPodcasts', (req, res) => {
    console.log('made it to the endpoint');
    const db = admin.firestore();
    db.collection('test').doc('podcasts').get().then((doc) => {
        if (doc.exists) {
            const data = doc.data().data;
            console.log('doc found');
            res.json({ data });
        } else {
            res.json({ "podcasts": [] });
        }
    }).catch((error) => {
        console.log('Error getting document:', error);
        res.status(500).json({ "error": "Internal Server Error" });
    })
});

app.get("/", (req, res) => res.send({ "message": "hello from the server!" }));

const test = process.env.TEST;


const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

