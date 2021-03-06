var express = require('express');

var challengeRouter = function (router, multipartMiddleware, io, Challenge, Post, cloudinary) {
  router.post('/api/challenge/create', multipartMiddleware, function (req, res) {
    console.log(req.body);

    var postId = req.body.postid;
    var username = req.body.username;
    var time = new Date();
    var image = req.files.image;

    var tmpPath = image.path;

    Post.findOne({ _id: postId }, 'username, image', function (err, challengee) {
      cloudinary.uploader.upload(tmpPath, function (result) {
        console.log(result);
        var challenge = {
          postid: postId,
          challenger: username,
          challengee: challengee.username,
          challengeeUrl: challengee.image,
          challengerUrl: 'v' + result.version + '/' + result.public_id,
          datetime: time,
          likes: 0,
          done: false,
        };

        var newChallenge = new Challenge(challenge);
        newChallenge.save(function (err, docs) {
          if (err) console.log(err);
          res.json({ status: 'done' });
        });
      });
    });
  })

  .post('/api/challenge/remove', function (req, res) {
    var postId = req.body.postid;
    Challenge.find({ challengeid: postId }).remove(function (err, docs) {
      if (err) {
        res.json({ done: false });
      } else {
        res.json({ done: true });
      }

    });
  })

  .get('/api/challenge/post', function (req, res) {
    var postId = req.query.postid;

    Challenge.find({ postid: postId, done: false }, function (err, challenges) {
      if (err) console.log(err);

      res.json(challenges);
    });

  })

  .get('/api/challenge/my', function (req, res) {
    var username = req.query.username;

    Challenge.find({ challengee: username, done: false }, function (err, challenges) {
      if (err) console.log(err);

      calls = [];

      challenges.forEach(function(post) {
        calls.push(function(callback) {
          Like.find({ postid: post._id, username: username }, function (err, userLike) {
            if (err) {
              console.log(err);
            } else {
              if(userLike != '') {
                post.set('likestate', true, { strict: false });
                //res.json(post);
                
              }
              else {
                post.set('likestate', false, { strict: false });
                
              }
              callback(null, post);
            }
          });   
        });
      });
      async.parallel(calls, function(err, result) {
        if (err)
            return console.log(err);
        
        res.json(result);
      });

    });

  })

  .get('/api/challenge/byme', function (req, res) {
    var username = req.query.username;

    Challenge.find({ challenger: username, done: false }, function (err, challenges) {
      if (err) console.log(err);

      res.json(challenges);
    });
  });
};

module.exports = challengeRouter;
