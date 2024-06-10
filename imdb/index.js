const express = require("express");
const path = require('path');
const passport = require('passport');
const session = require("express-session");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userRoutes = require("./routes/users");

const app = express();

// Set view engine
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

// Middleware setup
app.use(express.static('public'));
app.use(express.static('node_modules'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: 'saklı_bir_anahtar',
    resave: false,
    saveUninitialized: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: "899102746902-2dncmirk0dbcp0cnuocmvpdbic28krus.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    // You can use database calls here to find/create a user
    return cb(null, profile);
  }
));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Routes
app.use('/', userRoutes);

// Start server
app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
