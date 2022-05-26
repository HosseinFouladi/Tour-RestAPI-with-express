const express=require("express");
const TourController=require('../controllers/TourController');
const TourRouter=express.Router();
const AuthController=require('../controllers/AuthController');

const allowedRoles=['ADMIN','LEAD-GUIDE'];
//custom midleware only for /person route 
TourRouter.use(AuthController.protect)
//getting parametrs of url:req.params     :id?-->optional
//TourRouter.get("/aggregate-props",TourController.getTourStats);
//TourRouter.get("/:year",TourController.getCountOfToursEachMonth);
TourRouter.route('/').get(TourController.getTours).post(TourController.inserTour);//specify a middleware to certain request
TourRouter.route('/:id').get(TourController.getTourById).patch(TourController.updateTour)
.delete(AuthController.permissionTo(...allowedRoles),TourController.deleteTour);
TourRouter.get("/limitbyurl",TourController.limitFields,TourController.getTours);



module.exports=TourRouter;