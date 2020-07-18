//EXPRESS
var express = require("express");
var app = express();
var cors = require('cors');
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cors({origin: true, credentials: true}));
app.listen(4000, () => {
 console.log("Server running on port 4000");
});

//CLOUD FIRESTORE
var admin = require("firebase-admin");
var serviceAccount = require("./verification.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://loginverification-aa939.firebaseio.com"
});
const db = admin.firestore();

//TWILIO
// Download the helper library from https://www.twilio.com/docs/node/install
// Your Account Sid and Auth Token from twilio.com/console
// DANGER! This is insecure. See http://twil.io/secure
const accountSid = 'AC34347314d8b83264377a35e9d9ba6ea5';
const authToken = 'd2161cfe66499912435f88188a348bf3';
const client = require('twilio')(accountSid, authToken);

async function sendToken(token, phoneNumber){
    await client.messages
    .create({
        body: token,
        from: '+12058595472',
        to: phoneNumber
    });
}

//GET VERIFICATION CODE
app.post("/", async (req, res) => {
    const token = Math.floor(100000 + Math.random() * 900000);
    try{
        await sendToken(token+'', req.body.phoneNumber);
        await db.collection('usersinfo').doc(req.body.phoneNumber).set({token: token+''});
        res.send({success:true});
    }catch(error){
        res.sendStatus(500);
    }
});

//VAlIDATE AUTHORIZATION
app.post("/validate", async (req, res) => {
    const phoneNumberRef = db.collection('usersinfo').doc(req.body.phoneNumber);
    try{
        const doc = await phoneNumberRef.get();
        if(!doc.exists || doc?.data() === undefined)
            res.sendStatus(404);
        else if(doc.data().token !== req.body.token){
            res.send({success:false});
        }else{
            await db.collection('usersinfo').doc(req.body.phoneNumber).set({token: ''});
            res.send({success:true});
        }   
    }catch(error){
        res.sendStatus(500);
    }
});



