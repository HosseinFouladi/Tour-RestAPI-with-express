const UserModel=require('../models/UserModel');
const APIFeatures = require('../utilities/Features');
const catchAsync=require('../utilities/CatchError')
const AppError=require('../utilities/AppError');

const filterFields=(fields,...objects)=>{
    const filteredObj={};

    Object.keys(fields).forEach((el)=>{
        if(objects.includes(el)) filteredObj[el]=fields[el]
    })
    return filteredObj;
}


exports.getAllUsers=catchAsync(async(req,res)=>{

    const numOfDucuments=await UserModel.countDocuments();
   // const user=new APIFeatures(UserModel.find(),req.query).filter().limit().paginate(numOfDucuments);
    //const users=await user.query;
    const users=await UserModel.find();

    res.status(200).json({
        status:'OK',
        data:{
            users
        }
    })
    
})

exports.insertUser=catchAsync(async(req,res)=>{

  
    const user=await UserModel.create(req.body);

    res.status(200).json({
        status:'OK',
        data:{
           user
        }
    })
    
})


exports.getUserById=catchAsync(async(req,res)=>{

  
    const user=await UserModel.findById(req.params.id);

    res.status(201).json({
        status:'success',
        data:{
           user
        }
    })
    
})

exports.updateUser=catchAsync(async(req,res)=>{

  
    const user=await UserModel.findByIdAndUpdate(req.params.id);

    res.status(201).json({
        status:'success',
        data:{
           user
        }
    })
    
})

exports.deleteUser=catchAsync(async(req,res)=>{
    const user=await UserModel.findByIdAndDelete(req.params.id);
    res.status(201).json({
        status:'success',
        data:{
           user
        }
    })
    
})

exports.updateMe=catchAsync(async(req,res,next)=>{

    if(req.body.password||req.body.confirmPassword)
        return next(new AppError('for updating passsword go updatePassword route',400));
    
    const filteredObjects=filterFields(req.body,'name','email');
    const updatedUser=await UserModel.findByIdAndUpdate(req.user.id,filteredObjects,{
        new:true,
        runValidators:true
    })

    res.status(200).json({
        status:'success',
        data:{
            user:updatedUser
        }
    })

})

exports.deleteMe=catchAsync(async(req,res)=>{
    
    const deletedUser=await UserModel.findByIdAndUpdate(req.user._id,{active:false});

    res.status(204).json({
        status:'success',
        data:null
    })
})