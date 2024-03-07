const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const exphbs = require('express-handlebars');
const userModel = require('./models/user');
const path = require("path");
const app = express();

app.use(express.static('public'));
const port = 4000;

// Setup Express Handlebars
const static_path = path.join(__dirname, "./public");
const templates_path = path.join(__dirname, "./templates/views");

app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", templates_path);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    key: 'user_sid',
    secret: 'thisisrandomstuff',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000 // 10 minutes
    }
}));

// Session checker middleware
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/dashboard');
    } else {
        next();
    }
};

// Routes
app.get('/', sessionChecker, (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', sessionChecker, (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    try {
        const newUser = new userModel({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password, // Ensure password hashing is handled
        });

        const savedUser = await newUser.save();
        req.session.user = savedUser;
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/signup');
    }
});

app.get('/dashboard', async (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.render('dashboard', { user: req.session.user });
    } else {
        res.redirect('/login');
    }
});

mongoose.connect('mongodb://127.0.0.1:27017/UserDB')
  .then(() => {
    console.log('Connected to MongoDB');

    app.route("/login")
      .get(sessionChecker, (req, res) => {
        res.sendFile(__dirname + "/public/login.html");
      })
      .post(async (req, res) => {
        var username = req.body.username;
        var password = req.body.password;

        try {
          var user = await userModel.findOne({ username: username });
          if (!user) {
            return res.redirect("/login");
          }

          user.comparePassword(password, (error, match) => {
            if (error || !match) {
              return res.redirect("/login");
            }
            console.log('User Session:', req.session.user);
            const con = user.Conn;

            mongoose.connection.close();
            console.log("connection closed");

            mongoose.connect(con, {})
              .then(() => {
                console.log('Connected to user-specific MongoDB', con);
                req.session.user = user;
                return res.redirect("/dashboard");
              })
              .catch((err) => {
                console.error('Error connecting to user-specific MongoDB:', err.message);
                res.redirect("/login");
              });
          });
        } catch (error) {
          console.error(error);
          res.redirect("/login");
        }
      });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
  });

  app.get('/logout', (req, res) => {
        // Ensure the mongoose connection is closed before opening a new one
        mongoose.connection.close();
            console.log("User-specific connection closed");

            // Connect to the default or new MongoDB here
            const defaultConnectionString = 'mongodb://127.0.0.1:27017/UserDB';
            mongoose.connect(defaultConnectionString, {})
            .then(() => {
                console.log('Connected to default MongoDB');
                res.redirect('/login');
            })
            .catch(err => {
                console.error('Error connecting to default MongoDB:', err);
                // Handle the connection error (e.g., redirect to an error page or login with an error message)
                res.redirect('/login'); // Modify as needed
            });
        
    });


app.listen(port, () => {
  console.log('Server is running on port 4000');
});
