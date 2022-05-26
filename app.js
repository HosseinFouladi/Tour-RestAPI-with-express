const express=require("express");
const app=express();
const morgan=require("morgan");
const TourRouter=require('./routers/TourRouter');
const AppError=require('./utilities/AppError');
const globalErrorHandler=require('./controllers/GlobalErrorHandler');
const UserRouter=require('./routers/UserRouter');
const rateLimiting=require('express-rate-limit')
const helmet=require('helmet');
const dataSanitize=require('express-mongo-sanitize');
const xss=require('xss-clean');
const hpp=require('hpp');

//for adding some header middleware to http requests
app.use(helmet());

app.use(express.json({limit:'10kb'}));//neccessary for geting data from clint and insert it to file or db

//data sanitization against NOSql query injection like {email:$gt:''}
app.use(dataSanitize());
//data sanitization against xss (html code )
app.use(xss());

//prevent parameter pollution: tours/sort=duration&sort=price . if we usee hpp it applies last query string exepts white list fiels
app.use(hpp({
    whitelist:['duration','difficulty','price']
}))
//custom middlewares:

app.use((req,res,next)=>{
    req.requestTime=Date.now();
    next();
})
//3RD party middlewares
app.use(morgan('dev'))//shows information about http requests

const limiting=rateLimiting({
    max: 100,
    windowMs:1000*60*60,//in what duration?
    message:'too many requests sended in a hour!'
})
app.use(limiting);

//get request
//app.get("/person",getPerson);

//post request
//app.post("/person",inserPerson);

//getting parametrs of url:req.params     :id?-->optional
//app.get("/person/:id/:age?",getPersonById)

//or we can use app.route("/").get(getPerson).post(inserPerson)

app.use('/tour',TourRouter);
app.use('/users',UserRouter);

app.all('*',(req,res,next)=>{

    next(new AppError(`this page note found with this url:${req.originalUrl} `,404))//when we pass param to next its jump to middleware that handles errors
})

app.use(globalErrorHandler)

module.exports=app;
