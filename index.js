const fs=require('fs');
const http=require('http');
const url=require('url');
const hello="hello world";
const file=fs.readFileSync("H:\\test.txt",'utf-8');
console.log(file)
fs.writeFileSync('./dashax.txt',file);
console.log(hello);
const server=http.createServer((req,res)=>{
    res.end('hello web server');
    const {query,pathname}=url.parse(req.url,true);//url:product/id?=5=>quary=id
    console.log(query,pathname);
});
server.listen(8000,()=>{
    console.log('server is runing...')
})