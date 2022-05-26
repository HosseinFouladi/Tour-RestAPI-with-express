module.exports=fn=>{
    return (req,res,next)=>{//because fn dont recognize req,res,next parameters we should use return for async callbak functions
        fn(req,res,next).catch(next)
    }
}