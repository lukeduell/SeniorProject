const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

admin.initializeApp({
    credential: admin.credential.cert(require('./firebase-key.json')),
    databaseURL: 'https://finalproject-29944.firebaseio.com'
});

// Middleware to check admin role
async function checkAdmin(req, res, next) {
    const userToken = req.headers.authorization;
    if (!userToken) {
        return res.status(403).send('Unauthorized');
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(userToken.replace('Bearer ', ''));
        const userDoc = await admin.firestore().collection('UsersCollection').doc(decodedToken.uid).get();

        if (userDoc.exists && userDoc.data().role === 'admin') {
            req.user = decodedToken;
            next();
        } else {
            res.status(403).send('Unauthorized');
        }
    } catch (error) {
        res.status(403).send('Unauthorized');
    }
}

// Endpoint to list all users
app.get('/users', checkAdmin, async (req, res) => {
    try {
        const listUsersResult = await admin.auth().listUsers();
        const users = listUsersResult.users;

        const db = admin.firestore();

        const userDetails = await Promise.all(users.map(async (user) => {
            const userDoc = await db.collection('UsersCollection').doc(user.uid).get();
            return {
                uid: user.uid,
                email: user.email,
                role: userDoc.exists ? userDoc.data().role : 'unknown'
            };
        }));

        res.send(userDetails);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Endpoint to add a new user without logging in
app.post('/addUser', checkAdmin, async (req, res) => {
    const { email, password } = req.body;
    try {
        const userRecord = await admin.auth().createUser({ email, password });
        const db = admin.firestore();
        await db.collection('UsersCollection').doc(userRecord.uid).set({ email, role: 'customer' });
        res.send(userRecord);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Endpoint to delete a user
app.delete('/deleteUser/:uid', checkAdmin, async (req, res) => {
    const uid = req.params.uid;
    try {
        await admin.auth().deleteUser(uid);
        const db = admin.firestore();
        await db.collection('UsersCollection').doc(uid).delete();
        res.send({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Endpoint to update fields
app.put('/fields', checkAdmin, async (req, res) => {
    const updatedFields = req.body;
    const db = admin.firestore();

    try {
        // Update the AdminFields document
        const adminFieldsRef = db.collection('AdminFieldDB').doc('AdminFields');
        await adminFieldsRef.update(updatedFields);

        // Set corresponding fields to null in all entries if they are removed
        const customerCollectionRef = db.collection('CustomerCollection');
        const snapshot = await customerCollectionRef.get();
        
        snapshot.forEach(async (doc) => {
            const updateData = {};
            for (const [key, value] of Object.entries(updatedFields)) {
                if (value === null) {
                    updateData[key] = null;
                }
            }
            await doc.ref.update(updateData);
        });

        res.send({ message: 'Fields updated and entries cleaned successfully!' });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
