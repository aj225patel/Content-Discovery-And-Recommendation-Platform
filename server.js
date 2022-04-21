require('dotenv').config();


const express = require('express');
const app = express();
const path = require('path');
const indexRouter = require('./routes/router');
const itemRouter = express.Router({mergeParams: true});
const searchRouter = express.Router();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const db  = require('./model/dbConnection');
const Typesense = require('typesense');
const rec = require('./public/src/data/Movies_test2.json');

// Google Auth
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = process.env.G_AUTH_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);


const PORT = process.env.PORT || 7000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
    //extended: true
}));


app.set('view engine', 'ejs');
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(express.static(__dirname + '/public'));

itemRouter.use(express.static(__dirname + '/public'));
indexRouter.use('/movies', itemRouter);
searchRouter.use(express.static(__dirname + '/public'));
//indexRouter.use('/search', itemRouter);

app.use('/', indexRouter);
app.use('/search', searchRouter);


/*
app.get('/', (req, res)=>{
    res.render('index');
});
*/

let temp = rec.movies.sort( (a,b) => (a.weight < b.weight) ? 1 : (a.weight > b.weight) ? -1 : 0)
top_picks = temp.splice(0,10);

for(let i=0; i<10; i++){
    if(top_picks[i].genre_ids){
        top_picks[i].genre_ids = top_picks[i].genre_ids.map( function(val){
            const g = ['Action & Adventure','Animation','Comedy','Crime','Documentary','Drama',
            'Fantasy','History','Horror','Kids & Family','Music & Musical','Mystery & Thriller',
            'Romance','Science-Fiction','Sport','War & Military','Western','Reality TV','Made in Europe']
            return g[val-1];
        });
    }
}

app.get('/', checkAuthenticated , (req, res)=>{
    //res.sendFile(path.join(__dirname + '/views/landing.html'));
    let user = req.user;
    console.log('User Info :::',user);
    //console.log(top_picks);

    res.render('home', {user,top_picks});
});

app.get('/login', (req,res)=>{
    res.sendFile(path.join(__dirname + '/views/login.html'));
})

app.post('/googlelogin', (req,res)=>{
    let token = req.body.token;
    console.log(token);

    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID, 
        });
        const payload = ticket.getPayload();
        console.log(payload);
        const userid = payload['sub'];
      }
      verify()
      .then(()=>{
          res.cookie('session-token', token);
          res.send('success');
      })
      .catch(console.error);

})

app.get('/profile',checkAuthenticated, (req, res)=>{
    let user = req.user;
    console.log('User Info :::',user);
    //res.sendFile(path.join(__dirname + '/views/register.html'));
    res.render('search', {user});
});


searchRouter.get('/:slug', checkAuthenticated , (req, res)=>{
    //res.sendFile(path.join(__dirname + '/views/landing.html'));
    console.log('You are in a search route');
    let user = req.user;
    let search_text = req.params.slug;
    console.log('search_text=', search_text);

    console.log('User Info :::',user);
    res.render('search', {user, search_text});
});

app.post('/logout', (req, res)=>{
    res.clearCookie('session-token');
    res.clearCookie('jwt-cookie');
    const token = req.body.refreshToken;
    if (token) {
        db.query(`UPDATE userData.users SET token = null where token = '${token}'`);
        res.send({"success": "logged out successfully"});
    }
    //res.redirect('/');
});

let Tclient = new Typesense.Client({
    'nodes': [{
      'host': process.env.TYPESENSE_HOST, // For Typesense Cloud use xxx.a1.typesense.net
      'port': process.env.TYPESENSE_PORT,      // For Typesense Cloud use 443
      'protocol': process.env.TYPESENSE_PROTOCOL   // For Typesense Cloud use https
    }],
    'apiKey': process.env.TYPESENSE_SEARCH_ONLY_API_KEY,
    'connectionTimeoutSeconds': 2
});

app.post('/search',checkAuthenticated,(req,res)=>{

    let searchText = req.body.search_text;
    console.log(searchText);

    let pageNo = parseInt(req.body.page);
    console.log(pageNo);

    let Filter = req.body.Filter;
    //let genreFilter = req.body.genreFilter;
    let sorting = req.body.sorting;

    let moviePerPage = parseInt(req.body.moviePerPage);


    let searchParameters = {
        'q'         : searchText,
        'query_by'  : 'title',
        //'query_by_weights' : '16,2',
        'filter_by' : Filter,
        'sort_by'   : sorting,
        'per_page'  : moviePerPage,
        'page'      : pageNo
    }

    //console.log(Tclient.collections('movies').documents().search(searchParameters));

    Tclient.collections('movies')
    .documents()
    .search(searchParameters).then(function(searchResults){
        res.send(searchResults);
    });

});

app.post('/rating', checkAuthenticated , (req,res) => {
    let userId = req.userId;
    let movieId = req.body.movieId;
    let rating = req.body.rating;

    if(req.body.rmRow){
        db.query(`DELETE FROM contentDB.user_rating WHERE user_id=${userId} AND movie_id=${movieId} `, (err, result) => {
            if(err){
                return res.status(400).send({ success:false , msg: err});
            }
            else{
                return res.status(200).send({ success:true , msg: "User Rating removed successfully!!"});
            }
        })
    }
    else{
        db.query(`SELECT * FROM contentDB.user_rating WHERE user_id=${userId} AND movie_id=${movieId} `,(e,result)=>{
            if(e){
                return res.status(400).send({ success:false , msg: e});
            }
            else{
                if( result.length !== 0){
                    db.query(`UPDATE contentDB.user_rating SET rating = '${rating}' WHERE user_id=${userId} AND movie_id=${movieId}`, (err, result) => {
                        if(err){
                            return res.status(400).send({ success:false , msg: err});
                        }
                        else{
                            return res.status(200).send({ success:true , msg: "User Rating updated successfully!!"});
                        }
                    });
    
                }
                else{
                    db.query(`INSERT INTO contentDB.user_rating (user_id, movie_id, rating) VALUES ('${userId}', ${movieId}, ${rating})`, (err, result) => {
                        if (err) {
                            return res.status(400).send({ success:false , msg: err});
                        }
                        else{
                            return res.status(200).send({ success:true , msg: "User Rating recorded successfully!!"});
                        }
                    });
                }
            }
        });
    }
});

itemRouter.get('/:slug', checkAuthenticated , (req, res) => {
    //res.status(200).send('hello item ' + req.params.slug);
    let user = req.user;
    console.log('User Info :::',user);

    db.query("SELECT * FROM contentDB.movie where slug=?", req.params.slug, function(err, result){
        if(err){
            console.log(err);
        }
        else{
            console.log(JSON.stringify(result,undefined,4));
            if(result[0].genres.length !== 0){
                result[0].genres = result[0].genres.map( function(val){
                    const g = ['Action & Adventure','Animation','Comedy','Crime','Documentary','Drama',
                    'Fantasy','History','Horror','Kids & Family','Music & Musical','Mystery & Thriller',
                    'Romance','Science-Fiction','Sport','War & Military','Western','Reality TV','Made in Europe']
    
                    return g[val-1];
                })

            }

            db.query(`SELECT rating FROM contentDB.user_rating WHERE user_id=${req.userId} AND movie_id=${result[0].id}`, (e, rating_score) => {
                if(e){
                    console.log(e);
                }
                else{
                    console.log(rating_score);
                    return res.render('movieinfo', {user, result, rating_score});
                }
            });
        }
    });
});





function checkAuthenticated(req, res, next){
    console.log(req.originalUrl);
    let user = {};

    if(req.cookies['session-token']){
        let token = req.cookies['session-token'];
        
        async function verify() {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: CLIENT_ID,  
            });
            const payload = ticket.getPayload();
            user.name = payload.name;
            user.email = payload.email;
            user.picture = payload.picture;
        }
        verify()
        .then(()=>{
            req.user = user;
            next();
        })
        .catch(err=>{
            //res.redirect('/login');
            res.sendFile(path.join(__dirname + '/views/landing.html'));
        });
    }
    else{
        //console.log(req.headers["Auth-Bearer-Token"]);
        if(!req.cookies['jwt-cookie']){
            
            // return res.status(422).json({
            //     message: "Please provide the token",
            // });
            
            // res.status(422).json({
            //     message: "Please provide the token",
            // });
            return res.sendFile(path.join(__dirname + '/views/landing.html'));
        }
        else{
            //console.log("Hello 2");
            const theToken = req.cookies['jwt-cookie'];
            const decoded = jwt.verify(theToken, process.env.JWT_ACCESS_SIGN, function (err, decoded){
                if(err){
                  res.status(403).json({ message : `User is not Authenticated !! ${err}`});
                  return res.sendFile(path.join(__dirname + '/views/landing.html'));
                }
                else{
                    return decoded;
                }
            });
            //console.log(decoded);
    
            db.query('SELECT * FROM userData.users where id=?', decoded.id, function (error, results, fields) {
                if (error){
                  console.log("error");
                  // return res.status(403).json({ message : "User is not Authenticated !!"});
                  res.status(403).json({ message : "User is not Authenticated !!"});
                  return res.sendFile(path.join(__dirname + '/views/landing.html'));
                }
                else {
                    user.name = results[0].name;
                    user.email = results[0].email;
                    user.picture = 'https://cdn.icon-icons.com/icons2/1378/PNG/512/avatardefault_92824.png';
                    req.user = user;
                    req.userId = results[0].id;
                    next();
                }   
            });
        }
    }
}



app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
})
