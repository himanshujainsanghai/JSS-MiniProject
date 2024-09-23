const express = require('express');
const app = express();
const mongoose = require('mongoose');
const validator = require('email-validator');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const bodyParser = require('body-parser');

const port = 3000;
const path = require('path');
const { exit } = require('process');
// const { error } = require('console');
// const port = process.env.Port || 8080;
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));

// app.get('/',(req,res)=>{
//     res.sendFile('index.html',{root:__dirname});
// });

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + "/index.html"));
});

app.get('/about', (req, res) => {
    res.sendFile('about.html', { root: __dirname });
});

// app.use((req, res) => {
//     res.status(404).sendFile('404.html', { root: __dirname });
// });


app.listen(port, () => {
    console.log('Express app is listening at port 3000 ');
});


// Database

const db_link = 'mongodb+srv://himanshujainhj70662:3SuFxUoYB6a4Ryce@cluster0.fur6b1w.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(db_link, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(function (db) {
        console.log("db connected");
        // console.log(db);
    })
    .catch(function (err) {
        console.log(err);
    });

// const userSchema = mongoose.Schema({
//     name: {
//         type: String,
//         required: true
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true,
//         // validate: function () {
//         //     return validator.validate(this.email);
//         // }
//     },
//     // password: {
//     //     type: String,
//     //     required: true,
//     //     minLength: 8
//     // },
//     // confirm_password: {
//     //     type: String,
//     //     required: true,
//     //     minLength: 8,
//     //     validate: function () {
//     //         return this.confirm_password == this.password;
//     //     }

//     // }

// });

// userSchema.pre('save', async function () {
//     let salt = await bcrypt.genSalt();
//     let hashedString = await bcrypt.hash(this.password, salt);
//     // console.log("hashed string be :",hashedString);
//     this.password = hashedString;
// });

// const userModel = mongoose.model('userModel', userSchema);

const User = mongoose.model('User', {
    email: String,
    username: String,
    isEmailVerified: Boolean,
    otp: String,
    // otpExpiration: Date
});


// test function to create a user in database
// (async function createUser(){
//     let user={

//         name:'abhishek',
//         email:'abcd@gmail.com',
//         password:'12345678',
//         confirm_password:'12345678'
//     };
//     let data =await userModel.create(user);
//     console.log(data);
// })();


otpStorage = new Map();
console.log("otpstorage_before :", otpStorage);
app.post('/send-otp', async (req, res) => {
    // Assuming the client sends the email address in the request body
    const email = req.body.email;
    const username = req.body.username;

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

    // Send the OTP via email
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

});

// Function to send an email using Nodemailer
function sendEmail(email, otp) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'email@gmail.com', // Replace with your Gmail email address
            pass: 'password', // Replace with your Gmail password
        },
    });

    const mailOptions = {
        from: 'email@gmail.com', // Replace with your Gmail email address
        to: email,
        subject: 'Your OTP',
        text: `Your OTP is: ${otp}`,
    };

    return transporter.sendMail(mailOptions);
}


app.post('/verify-otp', async (req, res) => {
    const email = req.body.email;
    const enteredOTP = req.body.otp;
    const username = req.body.username;

    console.log("/verify-otp_email_received :", email);
    console.log("/verify-otp_entered_otp :", enteredOTP);

    // const {email,otp} =req.body;

    // Retrieve the stored OTP for the user
    const storedOTP = otpStorage.get(email);
    console.log("/verify-otp_storedotp :", storedOTP);

    if (!storedOTP) {
        return res.status(400).json({ error: 'OTP not found. Please generate a new OTP.' });
    }

    // Compare the entered OTP with the stored OTP
    if (enteredOTP === storedOTP) {
        // Successful verification
        otpStorage.delete(email); // Remove the used OTP
        console.log("email has been verified");
        res.json({ success: true, message: 'OTP verified successfully.And New user registered' });
        //   check if map has cleared that data 
        console.log(otpStorage);
        const user = await User.findOne({ email });
        user.isEmailVerified = true;
        user.otp = undefined;
        await user.save();

       



    }
    else {
        // Failed verification
        res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }
});

async function post_user_registered(email, username) {
    let data_obj = req.body;
    let user = await userModel.create(data_obj);
    console.log("requested user :", user);
    res.json({ message: "user registered" });
};
