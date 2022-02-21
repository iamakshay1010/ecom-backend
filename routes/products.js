const { Product } = require('../models/product');
const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
//-------tut 37-------

//----------------multor part for upload of the pics here---------starts--------
//-----uploadOptions.single('image')------>dont forget to put this in route---(refer line 68)
const FILE_TYPE_MAP = { //---MIME TYPE 
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];//---to validate file 
        let uploadError = new Error('invalid image type');

        if (isValid) {
            uploadError = null; 
        }
        cb(uploadError, 'public/uploads');//---cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');//----find spaces and replace with(-)
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);//----to add extension at the end here
    },
});
const uploadOptions = multer({ storage: storage });//--reefer line 66 for more info

//----------------multor part for upload of the pics here---------ends here--------


//-----find products by categories-----------
//----http:local:8000/api/v1/products/
//----http:local:8000/api/v1/products?categories=2324,2444--->(this is categry id)
router.get(`/`, async (req, res) => {
    let filter = {};
    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') };
    }
   //const productList = await Product.find().select('name image');//----return only name and images
  //const productList = await Product.find().select('name image -id');//----(minus id)dont dispplay id

    const productList = await Product.find(filter).populate('category');

    if (!productList) {
        res.status(500).json({ success: false });
    }
    res.send(productList);
});

router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');//---this will get all details of category

    if (!product) {
        res.status(500).json({ success: false });
    }
    res.send(product);
});
//-----create product
//----http:local:8000/api/v1/products/
//--(TO FILL DATA)-->CLICK ON BODY---->FORM DATA -->ENTER KEY VALUE PAIRS
//-------
//for category first create category and then pass id of it here
router.post(`/`, uploadOptions.single('image'), async (req, res) => {//------uploadOptions is multor part here
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const file = req.file;//----make sure file is there otherwise reuquest is not possible
    if (!file) return res.status(400).send('No image in the request');

    const fileName = file.filename;//----filename is coming from line 26
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    //--------------// "http://localhost:3000/public/upload/image-2323232"
    //-------------${req.protocol}------->http:
    //-------------${req.get('host')}---->localhost:3000
    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`, // "http://localhost:3000/public/upload/image-2323232"
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    });

    product = await product.save();

    if (!product) return res.status(500).send('The product cannot be created');

    res.send(product);
});

//-----update product
//------http://localhost:3000/api/v1/products/621373383dbce305ff1a467a
router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {  //----to check if the id is valid and in databse or not
        return res.status(400).send('Invalid Product Id');//-----try and catch could also be used 
    }
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send('Invalid Product!');

    //-----if the fileis getting updated--------
    const file = req.file;
    let imagepath;

    if (file) {
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagepath = `${basePath}${fileName}`;
    } else {
        imagepath = product.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagepath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        },
        { new: true }
    );

    if (!updatedProduct)
        return res.status(500).send('the product cannot be updated!');

    res.send(updatedProduct);
});

//-----
//----http://localhost:3000/api/v1/products/6213736b3dbce305ff1a4680
router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id)
        .then((product) => {
            if (product) {
                return res
                    .status(200)
                    .json({
                        success: true,
                        message: 'the product is deleted!',
                    });
            } else {
                return res
                    .status(404)
                    .json({ success: false, message: 'product not found!' });
            }
        })
        .catch((err) => {
            return res.status(500).json({ success: false, error: err });
        });
});
//---TO GET COUNT OF PRODUCTS
//----http://localhost:3000/api/v1/products/get/count
router.get(`/get/count`, async (req, res) => {//-----to get count of products 
    const productCount = await Product.countDocuments((count) => count);

    if (!productCount) {
        res.status(500).json({ success: false });
    }
    res.send({
        productCount: productCount,
    });
});

//---TO GET FEATURED PRODUCTS
//----http://localhost:3000/api/v1/products/get/featured
router.get(`/get/featured`, async (req, res) => {//-----to get count of products 
    const products = await Product.find({isFeatured:true});

    if (!products) {
        res.status(500).json({ success: false });
    }
    res.send(products);
});

//---TO GET FEATURED PRODUCTS
//----http://localhost:3000/api/v1/products/get/featured/4
//---show only 4 products here
router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const products = await Product.find({ isFeatured: true }).limit(+count);//plus to convert it to number from string

    if (!products) {
        res.status(500).json({ success: false });
    }
    res.send(products);
});

//--------uploading multiple images here-----------
//-------id is product id here
router.put(
    '/gallery-images/:id',
    uploadOptions.array('images', 10),//-------option is array  10 is no of files upload limit 
    async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid Product Id');
        }
        const files = req.files;
        let imagesPaths = [];
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

        if (files) {
            files.map((file) => {//---map files and put them in array
                imagesPaths.push(`${basePath}${file.filename}`);
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                images: imagesPaths,
            },
            { new: true }
        );

        if (!product)
            return res.status(500).send('the gallery cannot be updated!');

        res.send(product);
    }
);

module.exports = router;
