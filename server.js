// grab all environment variables
// are we in production?
if (process.env.NODE_ENV !== 'production') {
  // no, so grab environment variables
  require('dotenv').config();
}

// stuff we need for this app
const express = require('express');
const app = express();
const bcryptjs = require('bcryptjs');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');

// we are use passport for auth
const initializePassport = require('./passport-config');
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);

// poor man's Database
const users = [];

// we are using handlebars
const exphbs = require('express-handlebars');
app.engine('handlebars', exphbs());
app.set('view-engine', 'handlebars');

// grab stuff off of body
app.use(express.urlencoded({ extended: false }));
// share info with end users
app.use(flash());
// making sure sessions are working
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
// start up passport
app.use(passport.initialize());
// persist our variables the entire session our user has
// this works with app.use(session(...)) above
app.use(passport.session());
// in home.handlebars
// <form action="/logout?_method=DELETE" method="POST">
app.use(methodOverride('_method'));

// routes
// home page
app.get('/', checkAuthenticated, (req, res) => {
  res.render('home.handlebars', { name: req.user.name });
});

// login page
app.get('/login', checkNotAuthenticated, (req, res) => {
  // show the login form
  res.render('login.handlebars');
});

// make login form send data
app.post(
  '/login',
  checkNotAuthenticated,
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
  })
);

// register page
app.get('/register', checkNotAuthenticated, (req, res) => {
  // register form
  res.render('register.handlebars');
});

// make register form send data
app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcryptjs.hash(req.body.password, 10);
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    // now user can login so send them to login page
    // would be great if this auto-logged in but such is life
    res.redirect('/login');
  } catch {
    // problem houston, send back to register page
    res.redirect('/register');
  }
  // always good to test what users look like in terminal
  // console.log(users);
});

// logout
// we can't call this delete function from HTML
// We need to use a form and a POST method
// But delete is not supported by forms we can only use a POST
// To be able to delete we need to use a npm module called 'method-overide'
// (this will allow us to override our method that we're using so instead of using post we can actually call this delete method)
app.delete('/logout', (req, res) => {
  // passport gives us this method
  // it will clear our session and log our user out
  req.logOut();
  res.redirect('/login');
});

// check if the user is authenticated
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    // all good, proceed to next middleware!
    return next();
  }

  // if not, send them to login page
  res.redirect('/login');
}

// check if not authenticated
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    // send authententicated user to home page
    return res.redirect('/');
  }

  // if not, proceed to next middleware
  next();
}

// server is listening on port 3000
app.listen(3000);
