
const TourModel=require('../models/TourModel')
const tours=require('../data/tours-simple.json')
const APIFeatures=require('../utilities/Features')
const catchAsync=require('../utilities/CatchError')

exports.getTours=catchAsync(async(req,res)=>{

    //  /tours?duration=5--> req.query={duration:5}
    //  /tours?page[gt]=5&page[lt]=10--> req.query={page:{lt:10,gt:5}}
    // se we need convert req.query to mongo query with $ sign
   /* const queryObject={...req.query};

    let queryStr=JSON.stringify(queryObject);
    const re = /(gt|gte|lt|lte)/gi;

    queryStr = queryStr.replace(re, match => `$${match}`);

    let query=TourModel.find(JSON.parse(queryStr));//if properties of req.query exist in req.body object
    //sortng based on certain field
    if(req.query.sort){
        const sortBy=req.query.sort.split(',').join(' ');
        query=query.sort(sortBy);
    }

    //limit fields:
    if(req.query.fields){

        const fields=req.query.fields.split(',').join(' ');
        console.log(fields);
        query=query.select(fields);
    }else{
        query=query.select("-__v")//all fields exepts __v
    }

    //pagination:
    const page=req.query.page||1;
    const limit=req.query.limit||3;
    const skip=(page-1)*limit;

    if(req.query.page){
        const numOfDucuments=await TourModel.countDocuments();
        if(skip>=numOfDucuments) throw new Error('this page not exist!')
    }
    query=query.skip(skip).limit(limit);*/

    const numOfDucuments=await TourModel.countDocuments();
    const features=new APIFeatures(TourModel.find(),req.query).sort().limit().paginate(numOfDucuments);
    const Tours=await features.query;
    //const Tours=await TourModel.find();

        res.status(200).json({
            status:"sucess",
            data:{
                AllTours:Tours
            }
        })

})

exports.checkId=(req,res,next,val)=>{
    if(req.params.id>43){
        return res.status(404).json({
            status:'not found',
            message:"id greater than 43"
        })
    }
    next();
}


exports.inserTour=catchAsync(async(req,res)=>{
    
        const Tour=await TourModel.create(req.body);
        res.status(200).json({
            status:'201',
            data:{
                newTour:Tour
            }
        })

});

exports.getTourById=catchAsync(async(req,res)=>{
    //console.log(req.requestTime)
   // const id=req.params.id*1//*1 for invering to integer;
   // const age=req.params.age;
    

        const Tour=await TourModel.findById(req.params.id);
        res.status(200).json({
            status:"sucess",
            data:{
                foundedTour:Tour
            }
        })
})
exports.updateTour=catchAsync(async(req,res)=>{
        const updatedTour=await TourModel.findByIdAndUpdate(req.params.id,req.body,{
            new:true,
            runValidators:true
        });
        res.status(200).json({
            status:"sucess",
            data:{
                updatedTour
            }
        })
})
exports.deleteTour=catchAsync(async(req,res)=>{

        const deletedTour=await TourModel.findByIdAndDelete(req.params.id)
        res.status(200).json({
            status:"sucess",
            data:{
                deletedTour
            }
        })
})

//we can use middleware instead of queries in url to filter results
exports.limitFields=(req,res,next)=>{
    req.query.fields='name,duration,price';
    next();
}


//aggregiation pipeline: we can find objects based on a field of model and see different properties:
exports.getTourStats=catchAsync(async(req,res)=>{

        
        const stats=await TourModel.aggregate([

            {
                $group:{
                    _id:'$difficulty',
                    count:{$sum:1},
                    priceAverage:{$avg:'$price'}
                },

            },
          {
            $sort:{
                priceAverage:1
            }
          }
        ])

        res.status(200).json({
            status:'aggregiation',
            data:{
                stats
            }
        })
    
})

exports.getCountOfToursEachMonth=catchAsync(async (req,res)=>{
    const year=req.params.year*1;
        const tour=await TourModel.aggregate([
            {
                $unwind:{
                    path:'$startDates',
                    includeArrayIndex:'0'//destructure array
                }
            },
            {
                $match:{startDates:{$gte:new Date(`${year}-01-01`),
                                    $lte:new Date(`${year}-12-30`)}}
            },
            {
                $group:{
                    _id:{$month:'$startDates'},
                    countOfToursEachMonth:{$sum:1},
                    tours:{$push:'$name'},//push for showing arrays,
                 
                }
            },
            {
                $sort:{
                    countOfToursEachMonth:-1
                }
            }
        ])

        res.status(200).json({
            status:'aggregiation',
            data:{
                tour
            }
        })

})