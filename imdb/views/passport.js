const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: "899102746902-2dncmirk0dbcp0cnuocmvpdbic28krus.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    // Kullanıcıyı veritabanında arayabilir veya kaydedebilirsiniz
    return cb(null, profile);
  }
));
