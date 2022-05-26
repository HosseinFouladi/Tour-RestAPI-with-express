const UserModel=require('../models/UserModel');
const catchAsync=require('../utilities/CatchError')
const jwt=require('jsonwebtoken');
const{promisify}=require('util');
const AppError=require('../utilities/AppError')
const sendEmail=require('../utilities/Email');
const crypto=require('crypto');


const createJWT=id=>{
    return jwt.sign({id},process.env.JWT_SECRET_KEY,{
        expiresIn:process.env.JWT_EXPIRES_IN
    })
}

const sendJwtToken=(user,statusCode,res)=>{
    const token=createJWT(user._id);
    const cookieOptions={
         expires:new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN*1000*60*60),
         httpOnly:true
    }

     if(process.env.NODE_ENV === 'production')cookieOptions.secure =true;

     res.cookie('jwt',token,cookieOptions);

    res.status(statusCode).json({
        status:'OK',
        token,
        data:{
           user
        }
    })
}

exports.signup=catchAsync(async(req,res)=>{

    const user=await UserModel.create(req.body);
    sendJwtToken(user,200,res);
    
})


exports.login=catchAsync(async(req,res,next)=>{
    //1)check email and password exists or not
    const {email,password}=req.body;

    if(!email||!password){
        return next(new AppError('please insert email and password',401))
    }
    //2) check email exist and correct password
    const user=await UserModel.findOne({email:email}).select("+password");//+password for bringing password in object because password select is false

    if(!user||(!await user.correctPassword(password,user.password))) {
        return next(new AppError('incorrect email or password!',401))
    }
    //3) if everything ok send token to client
    sendJwtToken(user,201,res);
})

//protect route
exports.protect=catchAsync(async(req,res,next)=>{
    let token;
    //1)check token exist in header or not:
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer ")){
        token=req.headers.authorization.split(' ')[1];
    }
    if(!token) return next(new AppError('can`t get access to this route without loggin in',401))
    //2)verification token
    const decoded=await promisify(jwt.verify)(token,process.env.JWT_SECRET_KEY);
    //3)check user still exists:
    const freshUser=await UserModel.findById(decoded.id);
    if(!freshUser) return next(new AppError('user belong to this token no longer exists!'),401)

    req.user=freshUser

    next()
})

//handle Roles
exports.permissionTo=(...roles)=>{
    return (req,res,next)=>{// we cant directly pass parameters to middleware function se we wrapp middleware into function
        if(!roles.includes(req.user.role)){
            return next(new AppError('you dont have access to perform this action',403))
        }

        next();
    }
}

//reset correctPassword
exports.forgetPassword=catchAsync(async(req,res,next)=>{

    //1)find user by his email
    const user=await UserModel.findOne({email:req.body.email});
    if(!user) return next(new AppError('user not found!',404))

    //2)create crypto token for sent to user email
    const userInfo = user.createResetToken();
    //standard way : await user.save({validateBeforeSave})
    await UserModel.findByIdAndUpdate(user._id,
        {resetPassword:userInfo.resetPassword,
            expiresResetPassword:userInfo.expiresResetPassword})//we dont want to pass required field to body such as name so we should use this option

    const resetLink=`${req.protocol}//127.0.0.1:${process.env.PORT}/users/forgetPassword/${userInfo.resetCrypto}`;

    try{

        await sendEmail({email:user.email,message:resetLink});
        res.status(201).json({
            status:'success'
        })

    }catch(err){

        console.log(err);
        return next(new AppError('try again',403));
    }
})

exports.resetPssword=catchAsync(async(req,res,next)=>{

    const crypted=req.params.crypto;
    const hashedToken=crypto.createHash('sha256').update(crypted).digest('hex');

    const user=await UserModel.findOne({resetPassword:hashedToken})
    if(!user) return next(new AppError('user not found or expired reset token'),401);

    user.password=req.body.password;
    user.confirmPassword=req.body.confirmPassword;
    user.resetPassword=undefined;
    user.expiresResetPassword=undefined;

    await user.save();
   sendJwtToken(user,201,res);
})

exports.updatePassword=catchAsync(async(req,res,next)=>{
    const user=await UserModel.findById(req.user._id);
    if(!user)return next(new AppError('user not found'),404);

    if(! user.correctPassword(req.body.password,user.password))return next(new AppError('your current passwod is wrong ',401))

    const newPassword=req.body.newPassword;
    user.password=newPassword;
    user.confirmPassword=req.body.confirmPassword
    await user.save();
 
    const token=sendJwtToken(user,201,res);
})