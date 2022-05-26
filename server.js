const app=require('./app');
const dotenv=require('dotenv');
const mongoose=require('mongoose');
dotenv.config({path:'./config.env'})

process.on('uncaughtException',err=>{//for sync errors
    console.log(err);
    process.exit(1);
})
mongoose.connect(process.env.LOCAL_DATABASE,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false
})

const port=process.env.PORT;
const server=app.listen(port,()=>{
    console.log("express app runing ...");
})

process.on('unhandledRejection',err=>{//for async errs
    console.log(err.name,err.message);
    server.close(()=>{
        process.exit(1)//0 for success
    })
})
