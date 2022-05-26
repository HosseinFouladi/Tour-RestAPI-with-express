const fs=require('fs');
const server=require("http").createServer();


server.on("request",(req,res)=>{
    const readable=fs.createReadStream('./dashax.txt');
    readable.pipe(res);
})

server.listen('8085');