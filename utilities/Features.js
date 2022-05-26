
class APIFeatures{
    constructor(query,queryString){
        this.query=query,
        this.queryString=queryString
    }

    filter(){
    const queryObject={...this.queryString};
    let queryStr=JSON.stringify(queryObject);

    const re = /(gt|gte|lt|lte)/gi;
    queryStr = queryStr.replace(re, match => `$${match}`);
    this.query.find(JSON.parse(queryStr));

    return this;

    }

    limit(){
        if(this.queryString.fields){

            const fields=this.queryString.fields.split(',').join(' ');
            this.query=this.query.select(fields);
        }else{
            this.query=this.query.select("-__v")//all fields exepts __v
        }

        return this;
    }

    paginate(numOfDucuments){
        const page=this.queryString.page*1||1;
        const limit=this.queryString.limit*1||3;
        const skip=(page-1)*limit;
    
        if(this.queryString.page){
            if(skip>=numOfDucuments) throw new Error('this page not exist!')
        }
        this.query=this.query.skip(skip).limit(limit);
        return this;
    }

    sort(){
        if(this.queryString.sort){
            const sortBy=this.queryString.sort.split(',').join(' ');
            this.query=this.query.sort(sortBy);
        }
      
        return this;
    }
}

module.exports=APIFeatures;