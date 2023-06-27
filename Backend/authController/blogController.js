const joi = require("joi");
const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;
const fs = require('fs');
const Blog = require("../models/blog");
const blogdetailsDTO = require("../dto/blog-details-dto")
const { BACKEND_PHOTOPATH } = require("../config/index");
const comment = require("../models/comment")
const blogDTO = require("../dto/blogdto");

const blogController = {
    async create(req, res, next) {
        // validate blog input,
        // Change the name of photopath
        // add to db
        // send response

        // Client side --> base64 encode string --> decode and save in db
        const createBlogSchema = joi.object({
            title: joi.string().required(),
            author: joi.string().regex(mongodbIdPattern).required(),
            content: joi.string().required(),
            photo: joi.string().required()
        });

        const { error } = createBlogSchema.validate(req.body);

        if (error) {
            return next(error);
        }
        const { title, author, content, photo } = req.body;
        // read as buffer

        const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''), 'base64');

        // allot a random name
        const imgPath = `${Date.now()}-${author}.png`;

        // save locally

        try {
            fs.writeFileSync(`storage/${imgPath}`, buffer);
        } catch (error) {
            return next(error);
        }
        let newBlog;
        try {
            newBlog = new Blog({
                title,
                content,
                author,
                photoPath: `${BACKEND_PHOTOPATH}/storage/${imgPath}`
            });
            await newBlog.save();
        } catch (error) {
            return next(error);
        }
        const blogdto = new blogDTO(newBlog);
        res.status(201).json({ blog: blogdto });
    },
    async getAll(req, res, next) {
        try {

            const blogs = await Blog.find({});
            let blogsDto = [];
            for (let i = 0; i < blogs.length; i++) {
                const dto = new blogDTO(blogs[i]);
                blogsDto.push(dto)
            }
            return res.status(200).json({ blogs: blogsDto })
        } catch (error) {
            return next(error)
        }
    },
    async getById(req, res, next) {
        //validate id
        //send resnsepo
        const getByIdSchema = joi.object({
            id: joi.string().regex(mongodbIdPattern).required()
        })

        const { error } = getByIdSchema.validate(req.params)
        if (error) {
            return next(error)
        }
        let blog
        const { id } = req.params
        try {
            blog = await Blog.findOne({ _id: id }).populate("author")

        }
        catch (e) {
            return next(e)
        }
        const blogdto = new blogdetailsDTO(blog)
        return res.status(200).json({ blog: blogdto })
    },
    async update(req, res, next) {

        //validate

        //responese send

        const updateblogSchema = joi.object({
            title: joi.string().required(),
            content: joi.string().required(),
            author: joi.string().regex(mongodbIdPattern).required(),
            blogId: joi.string().regex(mongodbIdPattern).required(),
            photo: joi.string()
        });

        const { error } = updateblogSchema.validate(req.body)
        if (error) {
            return next(error)
        }
        const { title, content, author, blogId, photo } = req.body;
        let blog
        try {
            blog = await Blog.findOne({ _id: blogId })

        } catch (error) {
            return next(error)
        }

        //Check the update of a photo

        if (photo) {
            let previousphoto = blog.photoPath
            previousphoto = previousphoto.split("/").at(-1)
            //delete previous photo

            fs.unlinkSync(`storage/${previousphoto}`)

            const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''), 'base64');

            // allot a random name
            const imgPath = `${Date.now()}-${author}.png`;

            // save locally

            try {
                fs.writeFileSync(`storage/${imgPath}`, buffer);
            } catch (error) {
                return next(error);
            }
            await Blog.updateOne({ _id: blogId },
                { title, content, photoPath: `${BACKEND_PHOTOPATH}/storage/${imgPath}` }
            )
        }
        else {
            await Blog.updateOne({ _id: blogId }, { title, content })
        }
        return res.status(200).json({ message: "Blog updated" })
    },
    async delete(req, res, next) {

        //validate id
        //send response
        const deleteBlogSchema = joi.object({
            id: joi.string().regex(mongodbIdPattern).required()
        });

        const { error } = deleteBlogSchema.validate(req.params);
        const { id } = req.params
        if (error) { 
            return next(error)
        }
        try {
            await Blog.deleteOne({ _id: id })
            await comment.deleteMany({ blog: id })
        } catch (error) {
            return next(error)
        }
        res.status(200).json({ message: "Blog deleted successfully" })
    }
};

module.exports = blogController;
