const mongoose=require('mongoose');
const validator=require('validator');
const bcrypt=require('bcryptjs');
const crypto=require('crypto')

const UserSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'user must have a name']
    },
    email:{
        type:String,
        unique:true,
        lowercase:true,
        required:true,
        validate:[validator.isEmail,'please insert email in correct format'],
    },
    photo:{
        type:String
    },
    role:{
        type:String,
        enum:['USER','LEAD-GUIDE','ADMIN'],
        default:'USER',
        uppercase:true
    },
    password:{
        type:String,
        required:[true,'user must have a password'],
        minlength:[8,'user password must be more than 8 charachters!'],
        select:false
    },
    confirmPassword:{
        type:String,
        required:[true,'user must have a confirmPassword'],
        minLength:[8,'user password must be more than 8 charachters!'],
        validate:{
            validator:function(confirm){
              return  this.password===confirm
            },
            message:'confirm password not match with password!'
        }
    },
    resetPassword:{
        type:String
    },
    expiresResetPassword:{
        type:Date
    },
    changedPasswordAt:Date,
    active:{
        type:Boolean,
        default:true,
        select:false
    },

})


//only work for .save() and create ethods (not update)
UserSchema.pre('save',async function(next){

    if(!this.isModified) return next();

    this.password=await bcrypt.hash(this.password,12);
    this.confirmPassword=undefined//because we dont need to save confirm pass into db.we need just to auth
    next();
})

//check password correction
UserSchema.methods.correctPassword=async function(enteredPass,oldPass){
   return await bcrypt.compare(enteredPass,oldPass);
}

//generate reset token
UserSchema.methods.createResetToken= function(){

    const resetCrypto= crypto.randomBytes(32).toString('hex');
    this.resetPassword=crypto.createHash('sha256').update(resetCrypto).digest('hex');
    this.expiresResetPassword=Date.now()+(10*1000*60);
    

    return {resetCrypto,resetPassword:this.resetPassword,expiresResetPassword:this.expiresResetPassword};
}

UserSchema.pre('save',function(next){
    if(!this.isModified||this.isNew) return next();
    this.changedPasswordAt=Date.now()-1000;
    next();
})

//dont show user if his activity is false
UserSchema.pre(/^find/,function(next){
    this.find({active:{$ne:false}})
    next();
})
const UserModel=mongoose.model('User',UserSchema);
module.exports=UserModel;