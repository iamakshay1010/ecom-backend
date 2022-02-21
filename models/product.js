const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    richDescription: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    images: [{
        type: String
    }],
    brand: {
        type: String,
        default: ''
    },
    price : {
        type: Number,
        default:0
    },
    category: {//-------while making get request populate data to get data
        type: mongoose.Schema.Types.ObjectId, //----pick up the id from caregory schema
        ref: 'Category',
        required:true
    },
    countInStock: {
        type: Number,
        required: true,
        min: 0,
        max: 255
    },
    rating: {
        type: Number,
        default: 0,
    },
    numReviews: {
        type: Number,
        default: 0,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    },
})

productSchema.method('toJSON', function(){//---tut 43--------logic to convert (_id to id)
    const { __v, ...object } = this.toObject();
    const { _id:id, ...result } = object;
    return { ...result, id };
});


exports.Product = mongoose.model('Product', productSchema);
