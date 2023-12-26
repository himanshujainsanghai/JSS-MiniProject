const express = require('express');
const app = express();
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
