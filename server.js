// require express and other modules
var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  methodOverride = require("method-override");

// new additions 
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;

// require Post model
var db = require("./models"),
  Post = db.Post;
  User = db.User;

// middleware for auth 
app.use(cookieParser());
app.use(session({
  secret: 'supersecretkey', // change this!
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


// passport config
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// configure bodyParser (for receiving form data)
app.use(bodyParser.urlencoded({ extended: true, }));

// serve static files from public folder
app.use(express.static(__dirname + "/public"));

// set view engine to ejs
app.set("view engine", "ejs");

app.use(methodOverride("_method"));

// AUTH ROUTES

// show signup view
app.get('/signup', function (req, res) {
 res.render('signup');
});

app.post('/signup', function (req, res){
  User.register(new User({ username: req.body.username}), req.body.password,
    function (err, newUser){
      passport.authenticate('local')(req, res, function(){
        res.redirect('/');
      })
    });
});

// show login view
app.get('/login', function (req, res) {
 res.render('login');
});

// log in user
app.post('/login', passport.authenticate('local'), function (req, res) {
  console.log(req.user);
  res.redirect('/'); 
});

// log out user
app.get('/logout', function (req, res) {
  console.log("BEFORE logout", JSON.stringify(req.user));
  req.logout();
  console.log("AFTER logout", JSON.stringify(req.user));
  res.redirect('/');
});


// HOMEPAGE ROUTE
app.get("/", function (req, res) {
  Post.find(function (err, allPosts) {
    if (err) {
      res.status(500).json({ error: err.message, });
    } else {
      res.render("index", {user: req.user, posts: allPosts,});
    }
  });
});

app.get("/posts/:id", function(req, res) {
  Post.findById(req.params.id, function (err, foundPost) {
    if (err) {
      res.status(500).json({ error: err.message, });
    } else {
      res.render("posts/show", { post: foundPost, });
    }
  });
});

app.post("/posts", function(req, res) {


  if(req.user){
    var newPost = new Post(req.body);
    newPost.save(function (err) {
      if (err) {
        res.status(500).json({ error: err.message, });
      } else {
        res.redirect("/");
      }
    });
  } else {
    res.status(401).send({error: "Not Authorized! Please login first."})
  }
});

// update post
app.put("/posts/:id", function (req, res) {
  if(req.user){
    // get post id from url params (`req.params`)
    var postId = req.params.id;

    // find post in db by id
    Post.findOne({ _id: postId, }, function (err, foundPost) {
      if (err) {
        res.status(500).json({ error: err.message, });
      } else {
        // update the posts's attributes
        foundPost.title = req.body.title || foundPost.title;
        foundPost.description = req.body.description || foundPost.description;

        // save updated post in db
        foundPost.save(function (err, savedPost) {
          if (err) {
            res.status(500).json({ error: err.message, });
          } else {
            res.redirect("/posts/" + savedPost._id);
          }
        });
      }
    });
  } else {
    res.status(401).send({error: "Not Authorized! Please login first."})
  }
});


// delete post
app.delete("/posts/:id", function (req, res) {
  if(req.user){
    var postId = req.params.id;

    // find post in db by id and remove
    Post.findOneAndRemove({ _id: postId, }, function () {
      res.redirect("/");
    });
  }else {
    res.status(401).send({error: "Not Authorized! Please login first."})
  }
});


// API ROUTES

// get all posts
app.get("/api/posts", function (req, res) {
    // find all posts in db
    Post.find(function (err, allPosts) {
      if (err) {
        res.status(500).json({ error: err.message, });
      } else {
        res.json({ posts: allPosts, });
      }
    });
});

// create new post
app.post("/api/posts", function (req, res) {
  if(req.user){
    // create new post with form data (`req.body`)
    post.find().populate('User').exec(function(err,post){
    })
    var newPost = new Post(req.body);

    // save new post in db
    newPost.save(function (err, savedPost) {
      if (err) {
        res.status(500).json({ error: err.message, });
      } else {
        res.json(savedPost);
      }
    });
  } else{
      res.status(401).send({error: "Not Authorized! Please login first."})

  }
});

// get one post
app.get("/api/posts/:id", function (req, res) {
  // get post id from url params (`req.params`)
  var postId = req.params.id;

  // find post in db by id
  Post.findOne({ _id: postId, }, function (err, foundPost) {
    if (err) {
      if (err.name === "CastError") {
        res.status(404).json({ error: "Nothing found by this ID.", });
      } else {
        res.status(500).json({ error: err.message, });
      }
    } else {
      res.json(foundPost);
    }
  });
});

// update post
app.put("/api/posts/:id", function (req, res) {
  if(req.user){
    // get post id from url params (`req.params`)
    var postId = req.params.id;

    // find post in db by id
    Post.findOne({ _id: postId, }, function (err, foundPost) {
      if (err) {
        res.status(500).json({ error: err.message, });
      } else {
        // update the posts's attributes
        foundPost.title = req.body.title;
        foundPost.description = req.body.description;

        // save updated post in db
        foundPost.save(function (err, savedPost) {
          if (err) {
            res.status(500).json({ error: err.message, });
          } else {
            res.json(savedPost);
          }
        });
      }
    });
  }else{
    res.status(401).send({error: "Not Authorized! Please login first."})
  }
});

// delete post
app.delete("/api/posts/:id", function (req, res) {
  if(req.user){
    // get post id from url params (`req.params`)
    var postId = req.params.id;

    // find post in db by id and remove
    Post.findOneAndRemove({ _id: postId, }, function (err, deletedPost) {
      if (err) {
        res.status(500).json({ error: err.message, });
      } else {
        res.json(deletedPost);
      }
    });
  } else{
    res.status(401).send({error: "Not Authorized! Please login first."})
  }
});


// listen on port 3000
app.listen(3000, function() {
  console.log("server started");
});
