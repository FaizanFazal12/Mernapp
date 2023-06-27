const joi=require("joi");
const comment=require("../models/comment")
const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;
const CommentDTO =require("../dto/comment")
const commentController={
async create(req,res,next){

const commentSchema=joi.object({
    content:joi.string().required(),
    blog:joi.string().regex(mongodbIdPattern).required(),
    author:joi.string().regex(mongodbIdPattern).required(),
})
const {error}=commentSchema.validate(req.body);

const {author,content,blog}=req.body
if(error){
    return next(error)
}

try {
    let newcomment=await new comment({
       content,blog,author
    })

    await newcomment.save()
} catch (error) {
    return next(error)
}
res.status(200).json({message:"comment created"})
},
async getById(req,res,next){

    const getbyIdSchema=joi.object({
        id:joi.string().regex(mongodbIdPattern).required()
    })

    const  {error}=getbyIdSchema.validate(req.params)

    if(error){
        return next(error)
    }
    const {id}=req.params
    let comments
    try {
        comments=await comment.find({blog:id}).populate("author")
    } catch (error) {
        return next(error)
    }
    let commentsDto = [];

    for(let i = 0; i < comments.length; i++){
        const obj = new CommentDTO(comments[i]);
        commentsDto.push(obj);
    }


    res.status(200).json({data:commentsDto})
}
}

module.exports=commentController