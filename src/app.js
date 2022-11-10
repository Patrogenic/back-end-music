/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
const config = require('../config')
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var axios = require('axios');
const bcrypt = require('bcryptjs');
const User = require('./models/user');

const mongoose = require('mongoose');
const user = require('./models/user');
 
mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true , useUnifiedTopology: true})
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

const backEndAPI = "http://localhost:8080/";
const frontEndURL = "http://127.0.0.1:3000/";
const prodAPI = "http://34.218.208.196/";
const client_id = config.CLIENT_ID; // Your client id
const client_secret = config.CLIENT_SECRET; // Your secret
const redirect_uri = backEndAPI + 'callback'; // Your redirect uri

/**
* Generates a random string containing numbers and letters
* @param  {number} length The length of the string
* @return {string} The generated string
*/
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
 
var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
  .use(cors())
  .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-currently-playing user-read-recently-played';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(`${prodAPI}?` +
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
        request.get(options, async function(error, response, body) {
          console.log(body);
          let email = body.email;

          const user = await User.findOne({ email });

          console.log("getting user", user);
          if(user !== null){
            // update token
            console.log("refresh", refresh_token)
            const userUpdated = { refresh_token, access_token };
            const userRes = await User.findOneAndUpdate({ email }, userUpdated);
          }else{
            // make user
            let user = await new User({ email, refresh_token, access_token, music_service: "Spotify" }).save();
            console.log("user saved");
            console.log(user);
          }

          res.redirect(`${prodAPI}?` +
            querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token,
            }));


          // decrypt refresh token from database
          // we will need tokens from the database when we query other people's data
          // const match = await bcrypt.compare(req.body.password, user.password);
        });

        // we can also pass the token to the browser to make requests from there
      } else {
        res.redirect(`${prodAPI}?` +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.get('/current_track', async function(req, res){
  let token = req.headers['x-access-token'];

  if(token){
    // verify token in database (stub for now)
    const spotifyRes = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", { headers: { 'Authorization': 'Bearer ' + token } })

    if(spotifyRes.status === 204){
      res.json({ data: null });
    }else{
      res.json({ data: spotifyRes.data });
    }
  }else{
    res.json({ error: "no token"})
  }
 });



app.get('/recently_played', async function(req, res){
  let token = req.headers['x-access-token'];

  if(token){
    // verify token in database (stub for now)
    const spotifyRes = await axios.get("https://api.spotify.com/v1/me/player/recently-played", { headers: { 'Authorization': 'Bearer ' + token } })
    res.json({ data: spotifyRes.data });
  }else{
    res.json({ error: "no token"})
  }
});

app.get('/user', async function(req, res){
  //get user from mongodb on load for front end so the user has context
  let access_token = req.headers['x-access-token'];
  let user = await User.find({ access_token });

  if(user){
    res.json({ user: user[0].email });
  }else{
    res.json({ user: null });
  }

})

// need to work on logic for pinging current track
// I think the current best solution to query on load, and then the user can hit a refresh button

// look into integrations for getting spotify web player on the site

 
 console.log('Listening on 8080');
 app.listen(8080);
 