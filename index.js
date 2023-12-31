const express = require('express');
const app = express();
const mongoose = require('mongoose');
const validator = require('email-validator');
const bcrypt = require('bcrypt');
const port = 3000;
const path = require('path');
// const port = process.env.Port || 8080;

app.use(express.static(__dirname));

// app.get('/',(req,res)=>{
//     res.sendFile('index.html',{root:__dirname});
// });

app.get('/', function(req,res){
    res.sendFile(path.join(__dirname + "/index.html"));
});

app.get('/about',(req,res)=>{
    res.sendFile('about.html',{root:__dirname});
});

app.use((req,res)=>{
    res.status(404).sendFile('404.html',{root:__dirname});
});


app.listen(port,()=>{
    console.log('Express app is listening at port 3000 ');
});


// Database


mongoose.connect(db_link)
    .then(function (db) {
        console.log("db connected");
        // console.log(db);
    })
    .catch(function (err) {
        console.log(err);
    });

    const userSchema = mongoose.Schema({
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            validate: function () {
                return validator.validate(this.email);
            }
        },
        password: {
            type: String,
            required: true,
            minLength: 8
        },
        confirm_password: {
            type: String,
            required: true,
            minLength: 8,
            validate: function () {
                return this.confirm_password == this.password;
            }
    
        }
      
    });

    userSchema.pre('save', async function () {
        let salt = await bcrypt.genSalt();
        let hashedString = await bcrypt.hash(this.password, salt);
        // console.log("hashed string be :",hashedString);
        this.password = hashedString;
    });

    const userModel = mongoose.model('userModel',userSchema);


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