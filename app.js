const express = require('express');
const app = express();
const mongoose = require('mongoose');
const validator = require('email-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieparser = require('cookie-parser');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cron = require('node-cron')

require('dotenv').config();
const jwt_key2 = process.env.key2;
const jwt_key = process.env.key1;
const dbLink = process.env.DB_LINK;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const path = require('path');
const { log } = require('console');

// const { log } = require('console');
// app.use(bodyParser.json())

otpStorage = new Map();
otpStorage2 = new Map();

console.log("otpstorage_before :", otpStorage);


app.use(express.json());
app.use(cookieparser());
app.use(express.static(__dirname));

app.listen(3000, (req, res) => {
    console.log("express app listening at port 3000");
});

const userR = express.Router();
app.use("/", userR);

const authenticateUser = (req, res, next) => {
    const token = req.cookies.LoggedinUser;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, jwt_key);
        req.user = decoded.payload;
        next();
    } catch (error) {
        console.error('Error in authentication middleware:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};


// App Routes

userR
    .route("/")
    .get(sendMiniproject);

userR.route("/send-otp").post(postRegister);

userR.route("/verify-otp").post(otpVerification);

userR.route("/login")
.post(postLoginMail);
// .get(authenticateUser, (req, res) => {
 
//     console.log("user logging in");
// });

userR.route("/userlogin").post(loginVerification);

userR.route("/logout").post((req, res) => {
    // res.clearCookie('UserhasLoggedIn');
    res.clearCookie('LoggedInUser', { path: '/', secure: true, httpOnly: true, sameSite: 'Strict' });
    console.log("user logging out");
    res.json({ success: true, message: "logout successful" });
});



function sendMiniproject(req, res) {
    res.sendFile(path.join(__dirname + "/index.html"));
};

async function postRegister(req, res) {
    const email = req.body.email;
    const username = req.body.username;

    try {

        if (validator.validate(email)) {

            const existingEmail = await User.findOne({ email: email });
            if (existingEmail) {
                return res.json({ exists: true, message: "user already registered!" });

            } else {



                console.log("received email", email);
                console.log("received username :", username);

                console.log("sending otp");
                // Generate a random OTP
                const otp = randomstring.generate({
                    length: 6,
                    charset: 'numeric',
                });

                otpStorage.set(email, otp.toString());

                const newUser = new User({
                    email,
                    username,
                    otp,
                    isEmailVerified: false
                });

                await newUser.save();

                sendEmail(email, otp)
                    .then(() => {
                        res.json({ success: true, message: 'OTP sent successfully' });
                    })
                    .catch((error) => {
                        console.error('Error sending email:', error);
                        res.status(500).json({ success: false, message: 'Error sending OTP' });
                    });
                console.log("otpstorage :", otpStorage);
                console.log("otp sent sucessfully");
            }

        }
        else {
            return res.json({ isValid: false, message: 'Invalid email format' });
        }

    } catch (error) {
        console.error('Error checking user registration:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }


};

function sendEmail(email, otp) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser, // Replace  Gmail email address
            pass: emailPass, // Replace  your Gmail password
        },
    });

    const mailOptions = {
        from: emailUser, // Replace with your Gmail email address
        to: email,
        subject: 'Register',
        text: `Your OTP for Email verification is: ${otp}`,
    };

    return transporter.sendMail(mailOptions);
};




async function otpVerification(req, res) {
    const email = req.body.email;
    const enteredOTP = req.body.otp;
    const username = req.body.username;

    console.log("/verify-otp_email_received :", email);
    console.log("/verify-otp_entered_otp :", enteredOTP);

    const storedOTP = otpStorage.get(email);
    console.log("/verify-otp_storedotp :", storedOTP);

    if (!storedOTP) {
        return res.status(400).json({ error: 'OTP not found. Please generate a new OTP.' });
    }

    try {
        if (enteredOTP === storedOTP) {
            // Successful verification
            otpStorage.delete(email); // Remove the used OTP
            console.log("email has been verified");

            const user = await User.findOne({ email });
            user.isEmailVerified = true;
            user.otp = undefined;
            await user.save();

            let uid = user['_id'];
            console.log("uid of the user :", uid);
            let jwt_token = jwt.sign({ payload: uid }, jwt_key , {expiresIn: '1h'});
            // res.cookie('LoggedinUser', jwt_token, { secure: true, httpOnly: true });

            res.json({ success: true, message: 'OTP verified successfully. And new user registered' ,jwt_token });
        } else {
            // Failed verification
            res.status(400).json({ error: 'Invalid OTP. Please try again.' });
        }
    } catch (error) {
        console.error("Error in otpVerification:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


async function postLoginMail(req, res) {
    const email = req.body.email;

    try {

        if (validator.validate(email)) {

            const existingEmail = await User.findOne({ email: email });
            if (existingEmail) {
                console.log("/loogin email:", email);
                
                // Generate a random OTP
                const Lotp = randomstring.generate({
                    length: 6,
                    charset: 'numeric',
                });
                
                otpStorage2.set(email, Lotp.toString());
                
                console.log("sending otp");
                sendEmail(email, Lotp)
                .then(() => {
                    res.json({ success: true, message: 'OTP sent successfully' });
                })
                .catch((error) => {
                    console.error('Error sending email:', error);
                    res.status(500).json({ success: false, message: 'Error sending OTP' });
                });
                console.log("otpstorage2:", otpStorage2);
                console.log("otp sent sucessfully for Logging in");
                
            } else {
                
                return res.json({ exists: true, message: "user not registered!" });


            }

        }
        else {
            return res.json({ isValid: false, message: 'Invalid email format' });
        }

    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }


};

async function loginVerification(req, res) {
    const email = req.body.email;
    const enteredOTP = req.body.otp;

    console.log("/verify-otp_email_received :", email);
    console.log("/verify-otp_entered_otp :", enteredOTP);

    const storedOTP = otpStorage2.get(email);
    console.log("/verify-otp_storedotp :", storedOTP);

    if (!storedOTP) {
        return res.status(400).json({ error: 'OTP not found. Please generate a new OTP.' });
    }

    try {
        if (enteredOTP === storedOTP) {
            // Successful verification
            otpStorage2.delete(email); // Remove the used OTP
            console.log("email has been verified");

            const user = await User.findOne({ email });

            let uid = user['_id'];
            console.log("uid to be logged in :", uid);
            const  token = jwt.sign({ payload: uid }, jwt_key2 , {expiresIn: '1h'});
            // res.cookie('LoggedinUser', jwt_token, { secure: true, httpOnly: true });

            res.json({ success: true, message: 'OTP verified successfully. And new user registered' , token });
        } else {
            // Failed verification
            res.status(400).json({ error: 'Invalid OTP. Please try again.' });
        }
    } catch (error) {
        console.error("Error in otpVerification:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const User = mongoose.model('User', {
    email: { type: String, unique: true, required: true },
    username: String,
    isEmailVerified: { type: Boolean, default: false },
    otp: String,
    // otpExpiration: Date
});

mongoose.connect(dbLink, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(function (db) {
        console.log("db connected");

        // Schedule a task to run every two minutes
        cron.schedule('0 0 * * *', async () => {
            try {
                // Find and delete users with unverified emails
                const result = await User.deleteMany({ isEmailVerified: false });

                console.log(`${result.deletedCount} unverified users deleted.`);
            } catch (error) {
                console.error('Error deleting unverified users:', error);
            }
        });

    })
    .catch(function (err) {
        console.log(err);
    });





