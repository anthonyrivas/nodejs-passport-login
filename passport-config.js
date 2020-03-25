// just a simple username/password for passport
const LocalStrategy = require('passport-local').Strategy;
// bcryptjs works better than bcrypt
const bcryptjs = require('bcryptjs');

function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    // get user from email
    const user = getUserByEmail(email);
    // check if user exists
    if (user === null) {
      // no user, alert end user
      return done(null, false, { message: 'No user with that email' });
    }

    try {
      // compare end user password with db password
      if (await bcryptjs.compare(password, user.password)) {
        return done(null, user);
      } else {
        // wrong password
        return done(null, false, { message: 'Password incorrect' });
      }
    } catch (e) {
      return done(e);
    }
  };
  // don't need to pass password as sent by default
  // pass email and password to function above
  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id));
  });
}

module.exports = initialize;
