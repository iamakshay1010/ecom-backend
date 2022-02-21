const expressJwt = require('express-jwt');

function authJwt() {//---tut 51-----
    const secret = process.env.secret;
    const api = process.env.API_URL;
    return expressJwt({
        secret,
        algorithms: ['HS256'],//----algorithm from jwt
        isRevoked: isRevoked  //--this is function below
    }).unless({//------exclude this paths from authentication
        path: [//----this is regular expression here--->here * means everything after 
            {url: /\/public\/uploads(.*)/ , methods: ['GET', 'OPTIONS'] },//----allow to access the static files of folder
            {url: /\/api\/v1\/products(.*)/ , methods: ['GET', 'OPTIONS'] }, //----allow ot get products but not post
            {url: /\/api\/v1\/categories(.*)/ , methods: ['GET', 'OPTIONS'] },
            {url: /\/api\/v1\/orders(.*)/,methods: ['GET', 'OPTIONS', 'POST']},
            `${api}/users/login`,
            `${api}/users/register`,
        ]
    })
}

//-------explaination here
//----- {url: /\/api\/v1\/products(.*)/ , methods: ['GET', 'OPTIONS'] },
//-----here * means everything after products is allowed to GET
//----use regex101.com to test ur regular epressions
//----/api/v1/products/get/featured/3---->this will work
//----/api/v1/products/---->this will also work
async function isRevoked(req, payload, done) {
    if(!payload.isAdmin) {//----reject the call if the user is not admin here
        done(null, true)
    }

    done();
}

//-----FOR ISREVOKED FUNCTION----
//-----during the login token is generated(refer line 100 of users)
//---this token contains (userid and isAdmin) we are checking if the user is admin or not  

module.exports = authJwt