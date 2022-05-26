const mongoose=require('mongoose');

const TourSchema=new mongoose.Schema({

        name: {
          type: String,
          required: [true, 'A tour must have a name'],
          unique: true,
          trim: true,
          maxlength: [40, 'A tour name must have less or equal then 40 characters'],
          minlength: [10, 'A tour name must have more or equal then 10 characters']
          // validate: [validator.isAlpha, 'Tour name must only contain characters']
        },
        duration: {
          type: Number,
          required: [true, 'A tour must have a duration']
        },
        maxGroupSize: {
          type: Number,
          required: [true, 'A tour must have a group size']
        },
        difficulty: {
          type: String,
          required: [true, 'A tour must have a difficulty'],
          enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
          }
        },
        ratingsAverage: {
          type: Number,
          default: 4.5,
          min: [1, 'Rating must be above 1.0'],
          max: [5, 'Rating must be below 5.0']
        },
        ratingsQuantity: {
          type: Number,
          default: 0
        },
        price: {
          type: Number,
          required: [true, 'A tour must have a price']
        },
        priceDiscount: {
          type: Number,
          validate: {
            validator: function(val) {//custom validation
              // this only points to current doc on NEW document creation
              return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price'
          }
        },
        summary: {
          type: String,
          trim: true,
          required: [true, 'A tour must have a description']
        },
        description: {
          type: String,
          trim: true
        },
        imageCover: {
          type: String,
          required: [true, 'A tour must have a cover image']
        },
        images: [String],
        createdAt: {
          type: Date,
          default: Date.now(),
          select: false
        },
        startDates: [Date],
        secretTour: {
          type: Boolean,
          default: false
        }
})

//DOCUMENT middleware:runs before create()and save()
TourSchema.pre('save',function(next){
    console.log('hello before insert');
    next();
})

TourSchema.post('save',function(doc,next){
    console.log('hello after insert');
    next();
})
//QUERY MIDDLEWARE:runs for find()
TourSchema.pre(/^find/,function(next){
    console.log(this);
    this.find({secretTour:{$ne:true}})
    next();
})

//AGGREGATION MIDDLEWARE:
TourSchema.pre('aggregate',function(next){
  this.pipeline().unshift({$match:{secretTour:{$ne:true}}})//this refers to current aggregate object
  next();
})


const TourModel=mongoose.model('tourModel',TourSchema);
module.exports=TourModel;