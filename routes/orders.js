const {Order} = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-item');
const router = express.Router();

//-----
//----http://localhost:3000/api/v1/orders
router.get(`/`, async (req, res) =>{//--tut 62------- 
    const orderList = await Order.find().populate('user', 'name').sort({'dateOrdered': -1});//----order from new to old

    if(!orderList) {
        res.status(500).json({success: false})
    } 
    res.send(orderList);
})
//-----
//----http://localhost:3000/api/v1/orders
router.get(`/:id`, async (req, res) =>{//----tut 62------
    const order = await Order.findById(req.params.id)
    .populate('user', 'name')//----populating is showing detailed data
    .populate({ //------6.35(TS)----------(orderItems) is main attribute which contains(Quentity,product)
        path: 'orderItems', populate: {
            path : 'product', populate: 'category'} //-----product conatins category(also populate cats)
        });

    if(!order) {
        res.status(500).json({success: false})
    } 
    res.send(order);
})
//-----
//----http:local:8000/api/v1/orders/
//----put the token in authorisation header
//-----http://localhost:3000/api/v1/orders
//-----------data here to use-----------
// {
//     "orderItems":[
//         {
//         "quantity":3,
//         "product":"621373383dbce305ff1a467a"
//         },
//          {
//         "quantity":5,
//         "product":"621372fb3dbce305ff1a4677"
//         }
//     ],
//     "shippingAddress1":"home 1",
//     "shippingAddress2":"home 2",
//     "city":"banglore",
//     "zip":"0000",
//     "country":"india",
//     "phone":"8767997705",
//     "user": "62137a3358e91606f608aa17"
    
// }
router.post('/', async (req,res)=>{//-----tut 61---6.21(TS)-----
    const orderItemsIds = Promise.all(req.body.orderItems.map(async (orderItem) =>{//----first update in orderItem DB
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })

        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;//---then get the ids of the items and return them
    }))
    const orderItemsIdsResolved =  await orderItemsIds;//----bcz otherwise it will return promise instead of ids
  //----orderItemsIdsResolved---->this is returnung the ids of orderitems here
    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId)=>{
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice//----this retunrs twovalues in array
    }))

    const totalPrice = totalPrices.reduce((a,b) => a +b , 0);//----sum up those two values----->zero is initial value

    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
    })
    order = await order.save();

    if(!order)
    return res.status(400).send('the order cannot be created!')

    res.send(order);
})

//-----
//----http:local:8000/api/v1/orders/1234
//----we only update the status of order here
//-----http://localhost:3000/api/v1/orders/62137d4b5db7d40724e1da74
//---put the barer token for validation
//----data here----
// {
//     "orderItems":[
//         {
//         "quantity":50,
//         "product":"621373383dbce305ff1a467a"
//         },
//          {
//         "quantity":100,
//         "product":"621372fb3dbce305ff1a4677"
//         }
//     ],
//     "shippingAddress1":"home 1",
//     "shippingAddress2":"home 2",
//     "city":"banglore",
//     "zip":"0000",
//     "country":"india",
//     "phone":"8767997705",
//     "user": "62137a3358e91606f608aa17",
//     "status":"done"
    
// }
router.put('/:id',async (req, res)=> {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status
        },
        { new: true}
    )

    if(!order)
    return res.status(400).send('the order cannot be update!')

    res.send(order);
})

//-----
//----http://localhost:3000/api/v1/orders/62137e495db7d40724e1da7f
router.delete('/:id', (req, res)=>{
    Order.findByIdAndRemove(req.params.id).then(async order =>{
        if(order) {
            await order.orderItems.map(async orderItem => {//----Order/orderItems--->ths filed is inside order DB
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({success: true, message: 'the order is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "order not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})

//-------to get the total sales here---
//------http://localhost:3000/api/v1/orders/get/totalsales
router.get('/get/totalsales', async (req, res)=> {
    const totalSales= await Order.aggregate([
        { $group: { _id: null , totalsales : { $sum : '$totalPrice'}}}
    ]) //----give (id as null) and make field (totalsales)and assign value if totalprice to it

    if(!totalSales) {
        return res.status(400).send('The order sales cannot be generated')
    }

    res.send({totalsales: totalSales.pop().totalsales})//---we will pop the last value in array(totalsales)and get it
})

//------
//---to get the number of orders here
//----http://localhost:3000/api/v1/orders/get/count
router.get(`/get/count`, async (req, res) =>{
    const orderCount = await Order.countDocuments((count) => count)

    if(!orderCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        orderCount: orderCount
    });
})

//------
//-----to get the order of the specific user here 
//-----http://localhost:3000/api/v1/orders/get/userorders/62137a3358e91606f608aa17
router.get(`/get/userorders/:userid`, async (req, res) =>{
    const userOrderList = await Order.find({user: req.params.userid}).populate({ 
        path: 'orderItems', populate: {
            path : 'product', populate: 'category'} 
        }).sort({'dateOrdered': -1});

    if(!userOrderList) {
        res.status(500).json({success: false})
    } 
    res.send(userOrderList);
})



module.exports =router;