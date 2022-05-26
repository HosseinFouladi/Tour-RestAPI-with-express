const app=require('../app');
const express=require('express');
const UserController=require('../controllers/UserController')
const UserRouter=express.Router();
const AuthController=require('../controllers/AuthController')
const LimitAttemts=require('../controllers/LimitAttempts');


UserRouter.post('/signup',AuthController.signup)
UserRouter.post('/login',AuthController.login)
UserRouter.post('/forgetpassword',AuthController.forgetPassword);
UserRouter.patch('/forgetPassword/:crypto',AuthController.resetPssword)
UserRouter.patch('/updatePassword',AuthController.protect,AuthController.updatePassword)
UserRouter.patch('/updateUserData',AuthController.protect,UserController.updateMe);
UserRouter.delete('/deleteMe',AuthController.protect,UserController.deleteMe)

UserRouter.route('/').get(UserController.getAllUsers).post(UserController.insertUser);
UserRouter.route('/:id').get(UserController.getUserById).patch(UserController.updateUser)
.delete(UserController.deleteUser);
module.exports=UserRouter;