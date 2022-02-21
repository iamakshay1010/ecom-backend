const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');//----cross origin resource sharing
require('dotenv/config');
const authJwt = require('./helpers/jwt');//-------impot is imporant
const errorHandler = require('./helpers/error-handler');


app.use(cors());
app.options('*', cors())//---start everything with cors

//middleware
app.use(express.json());  //-----to pass json data
app.use(morgan('tiny'));
app.use(authJwt());//-----tut 51----------thi is jwt part here to specify the algorithm
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));//----to access the static files with url
app.use(errorHandler);

//Routes
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const usersRoutes = require('./routes/users');
const ordersRoutes = require('./routes/orders');

const api = process.env.API_URL;

app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);

//Database
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    dbName: 'eshop-database' //---thisis dataabse in mongoose website
})
.then(()=>{
    console.log('Database Connection is ready...')
})
.catch((err)=> {
    console.log(err);
})
//---------refer tut 141 for deployment on heroku

//Server
app.listen(3000, ()=>{

    console.log('server is running http://localhost:3000');
})