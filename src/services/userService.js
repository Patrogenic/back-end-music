const User = require('../models/user');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
var querystring = require('querystring');

const { body, validationResult } = require("express-validator");

const client_id = '922f5e5577b74b85b0b685cbc913b4eb'; // Your client id
const client_secret = '13b44e01d9c74fcfb8799de5d822b4be'; // Your secret
const redirect_uri = 'http://localhost:8080/api/user/callback'; // Your redirect uri


var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// this might need to actually be a secret key
var stateKey = 'spotify_auth_state';


const login = async function(req, res) {
 
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
};

const callback = async function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  console.log(req.query)
  console.log(req.cookies);

  if (state === null || state !== storedState) {
    res.redirect('http://127.0.0.1:3000/' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('http://127.0.0.1:3000/' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('http://127.0.0.1:3000/' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
};


module.exports = {
  login,
  callback,
}

// app.get('/refresh_token', function(req, res) {

//   // requesting access token from refresh token
//   var refresh_token = req.query.refresh_token;
//   var authOptions = {
//     url: 'https://accounts.spotify.com/api/token',
//     headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
//     form: {
//       grant_type: 'refresh_token',
//       refresh_token: refresh_token
//     },
//     json: true
//   };

//   request.post(authOptions, function(error, response, body) {
//     if (!error && response.statusCode === 200) {
//       var access_token = body.access_token;
//       res.send({
//         'access_token': access_token
//       });
//     }
//   });
// });


// const register = [
//   body('username', 'Username required').trim().isLength({min: 1}).escape(),
//   body('password', 'Password required').trim().isLength({min: 1}).escape(),
//   body('password_confirmed', 'Password required').trim().isLength({min: 1}).escape(),

//   async (req, res) => {
//     const errors = validationResult(req);

//     if(!errors.isEmpty()){
//       res.json(errors);
//     }else{
//       const user = await User.findOne({username: req.body.username});

//       if(user !== null){
//         throw new Error("Username Taken");
//       }else if(req.body.password !== req.body.password_confirmed){
//         throw new Error("Passwords Differ");
//       }else{
//         const user = await saveUser(req.body.username, req.body.password);
//         res.json(user);
//       }
//     }
//   }
// ]

// const saveUser = async (username, password) => {
//   password = await bcrypt.hash(password, 10);

//   let user = await new User({ username, password }).save();

//   const token = jwt.sign({ user }, process.env.TOKEN_SECRET, { expiresIn: '1h' });
//   return { username: user.username,  token};
// }

// const login = [
//   body('username', 'Username required').trim().isLength({min: 1}).escape(),
//   body('password', 'Password required').trim().isLength({min: 1}).escape(),

//    async (req, res) => {
//     const errors = validationResult(req);

//     if(!errors.isEmpty()){
//       res.json(errors);
//     }else{

//       const user = await User.findOne({ username: req.body.username });
      
//       if(user !== null){
//         const match = await bcrypt.compare(req.body.password, user.password);

//         if(match){
//           const token = jwt.sign({ user }, process.env.TOKEN_SECRET, { expiresIn: '1h' });
//           // res.json({ username: user.username, token, typingData });
//         }else{
//           throw new Error("Invalid Credentials");
//         }
//       }else{
//         throw new Error("Invalid Credentials");
//       }
//     }
//   }
// ]

// const validate = (req, res) => {
//   // verifyToken(req);
//   const token = req.headers['x-access-token'];

//   if(token){
//     let authData = jwt.verify(token, process.env.TOKEN_SECRET);
  
//     if(authData){
//       res.sendStatus(200);
//     }else{
//       res.sendStatus(403);
//     }
//   }else{
//     res.sendStatus(403);
//   }
// }

// module.exports = {
//   register,
//   login,
//   validate,
// }