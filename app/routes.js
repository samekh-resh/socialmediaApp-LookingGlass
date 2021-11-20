module.exports = function(app, passport, db) {
  const multer = require('multer');
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/images/uploads')
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + ".png")
    }
  });
  const upload = multer({storage: storage}); 

  const ObjectId = require('mongodb').ObjectID

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================

    app.get('/profile', isLoggedIn, function (req, res) {
      console.log('bookmarks' , req.user.bookmarks)
      db.collection('posts').find({ postedBy: req.user._id }).toArray((err, result) => {
        if (err) return console.log(err)
        db.collection('posts').find({ _id: { $in: req.user.bookmarks } }).toArray((err, bookmarks) => {
          console.log(bookmarks)
          res.render('profile.ejs', {
            user: req.user,
            posts: result,
            bookmarks: bookmarks
          })
        })
      });
    })

    app.get('/feed', isLoggedIn, function(req, res) {
      db.collection('posts').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('feed.ejs', {
          user : req.user,
          posts: result
        })
      })
  });

  app.get('/post/:meme', isLoggedIn, function(req, res) {
    let postId = ObjectId(req.params.meme)
    console.log(postId)
    db.collection('posts').find({_id: postId}).toArray((err, result) => {
      if (err) return console.log(err)
      db.collection('comments').find({postId: req.params.meme}).toArray((err, comments) => {
        if (err) return console.log(err)
        res.render('post.ejs', {
          // users: users,
          posts: result,
          comments: comments 
        })
        console.log(comments)
      })
    })
  });

  app.get('/page/:id', isLoggedIn, function(req, res) {
    let postId = ObjectId(req.params.id)
    db.collection('posts').find({postedBy: postId}).toArray((err, result) => {
      if (err) return console.log(err)
      res.render('page.ejs', {
        posts: result
      })
    })
  });


  app.post('/post/comments/:id', isLoggedIn, function (req, res) {
    // let postId = req.params.id
    let user = req.user._id
    db.collection('comments').save({
    postedBy: user, 
    postId: req.params.id, 
    comment: req.body.comment
    }, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect(`/post/${req.params.id}`)
      })
    })


    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// message board routes ===============================================================

    app.post('/createPost', upload.single('file-to-upload'), (req, res) => {
      let user = req.user._id
      db.collection('posts').save({caption: req.body.caption, postedBy: user, thumbUp: 0, img: 'images/uploads/' + req.file.filename,}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
      })
    })

    app.put('/liked', (req, res) => {
      db.collection('posts')
      .findOneAndUpdate({_id: ObjectId(req.body.postId)}, {
        $set: {
          likes: req.body.likes + 1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })

    app.put('/bookmark', (req, res) => {
      db.collection('users')
        .findOneAndUpdate({ _id: req.user._id }, {
          $push: {
            bookmarks: ObjectId(req.body.postId)
          }
        }, {
          sort: { _id: -1 },
          upsert: false
        }, (err, result) => {
          if (err) return res.send(err)
          res.send(result)
        })
    })

    app.delete('/deletePost', (req, res) => {
      let postId = ObjectId(req.body.postId)
      db.collection('posts').findOneAndDelete({_id: postId}, (err, result) => {
        // there is a better way to target the post for deletion by the object id
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/feed', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
