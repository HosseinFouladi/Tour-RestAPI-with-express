
const handleDuplicate=(msg)=>{

    const message=msg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    console.log(message)
    return `duplicate value:${message}`;
}
module.exports=(err,req,res,next)=>{//if middleware has 4 parameter express figure out its error middleware

    const message=err.message;
    err.statusCode=err.statusCode||500;
    err.status=err.status||'unknown error';

    if(process.env.NODE_ENV!=="development"){
       res.status(err.statusCode).json({
            status:err.status,
            message,
            err   
        })
    }else if(process.env.NODE_ENV!=="production"){

        if(!err.isOperationalError){

            if(err.code===11000) err.message=handleDuplicate(err.message);

           res.status(err.statusCode).json({
                status:err.status,
                message:err.message ,
                
            })
        }else{
           res.status(err.statusCode).json({
                status:"error",
                message:"something went wrong!"   
            })
        }
    }
 

    next();
}

