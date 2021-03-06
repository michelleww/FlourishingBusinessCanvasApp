var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
var http = require('http').Server(app);
var io = require('socket.io')(http);

require('./connect.js');
require('./models/canvas.js');
require('./models/sticky.js');
require('./models/user.js');
var async = require('async');

//model name
const User = mongoose.model('User');
const Sticky = mongoose.model('Sticky');
const Canvas = mongoose.model('Canvas');
mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/assets'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.static('files'));
app.use('/static', express.static('public'));


// socket.io settings
io.on("connection", (socket) => {
  console.log("Socket connection is established.")
  socket.on('stickyUpdateSize', function (data) {
    socket.broadcast.emit('stickyUpdateSize', data);
  });
  socket.on('stickyUpdatePos', function (data) {
    socket.broadcast.emit('stickyUpdatePos', data);
  });
  socket.on('stickyAdd', function (data) {
    socket.broadcast.emit('stickyAdd', data);
  });
  socket.on('stickyUpdateComment', function (data) {
    socket.broadcast.emit('stickyUpdateComment', data);
  });
  socket.on('stickyUpdateColor', function (data) {
    socket.broadcast.emit('stickyUpdateColor', data);
  });
  socket.on('stickyDelete', function (data) {
    socket.broadcast.emit('stickyDelete', data);
  });
  socket.on('stickyUpdateContent', function (data) {
    socket.broadcast.emit('stickyUpdateContent', data);
  });
  socket.on('stickyUpdateOptional', function (data) {
    socket.broadcast.emit('stickyUpdateOptional', data);
  });
  socket.on('disconnect', function () {
    console.log("Socket has disconnected");
  });
})

const fal = 'false';
const denied = 'denied';
const tru = 'true';
const regUser = 2;
const manager = 3;
const admin = 4;
const registrationRquest = new Array();
const changeType = ['content', 'position', 'size', 'color', 'add comment', 'delete comment', 'optionalFields'];

// render login page
app.get('/login', function (req, res) {
  res.clearCookie('id');
  res.clearCookie('email');
  res.clearCookie('name');
  res.render('login');
});

// render canvas page
app.get('/canvas', function (req, res) {
  res.render('canvas', { name: req.cookies.name, email: req.cookies.email, id: req.cookies.id });
});

// render manager page
app.get('/manager', function (req, res) {
  res.render('manager', { name: req.cookies.name, email: req.cookies.email });
});

// render admin page
app.get('/admin', function (req, res) {
  res.render('admin', { name: req.cookies.name, email: req.cookies.email });
});

// render user page
app.get('/user', function (req, res) {
  res.render('user', { name: req.cookies.name, email: req.cookies.email });
});

// render profile page
app.get('/profile', function (req, res) {
  res.render('profile', { name: req.cookies.name, email: req.cookies.email });
});

// render password page
app.get('/password', function (req, res) {
  res.render('password', { name: req.cookies.name, email: req.cookies.email });
});

// ------------------------------------- LOGIN AND REGISTER ------------------------------------------------

// user login request
app.post('/login', function (req, res) {
  var email = req.body.email;
  var pwd = req.body.pwd;
  var name;
  // need to find the user with requested email in 'approved' status
  User.find({
    email:email,
    status:2
  }).then((result) => {
    if (result.length == 0){
      console.log('user does not exist or does not have the authorization to login!');
      res.send(denied);
    } else {
      var user = result[0];
      name = user.name;
      role = user.role;
      // if the user existed, compare incoming password with the passward in the database
      if (pwd === user.pwd) {
        // user cookie for future usage
        res.cookie('name', name);
        res.cookie('email', email);
        res.send(role.toString());
      } else {
        res.send(fal)
      }
    }
  }).catch((err) =>{
    console.log(err)
    res.send(err)
  })
});


// register for new user
app.post('/register', function (req, res) {
  var name = req.body.name;
  var pwd = req.body.pwd;
  var email = req.body.email;
  var canvasList = new Array();

  // the initial status of an approved user does not have password
  // the functionality of register is actually updating the user name and password
  User.findOneAndUpdate({ 'email': email, 'pwd': '', 'status': 2 }, { name: name, pwd: pwd })
  .then((result) => {
    // if there is no user in initial status it can be multiple situations
    // it can be an outside using is trying to login to this website
    // or an outside user is signing up more than once
    // or the password has been updated, so there is no need to signup again
    if (result === null){
      User.find({email:email}).then((result)=>{
        if (result.length !== 0){
          console.log('The email has been registered in the system!');
          res.send(fal);
        } else {
          // only when an outside user trying to signup at the first time, then create new user
          var newRequest = { userEmail: email, userTime: new Date(), userName: name };
          var user = new User({
            name: name,
            email: email,
            pwd: pwd,
            role: regUser,
            canvas: canvasList,
            occupation: '',
            status: 1,
            phone: '',
            company: '',
            notification: canvasList
          });
          User.create(user).then((result)=>{
            if (result == null){
              res.send(err)
            }
            User.findOneAndUpdate({ role: admin }, { $push: { notification: newRequest } })
            .then((result)=>{
              if (result == null){
                res.send(fal)
              }
              res.send("1");
            })
          })
        }
      })
    } else {
      res.cookie('name', name);    //cookie now store both name and email
      res.cookie('email', email);
      var resp = result.role;
      res.send(resp.toString());
    }
  }).catch((err)=>{
    console.log(err)
    res.send(err)
  })
});

// ------------------------------------------- CANVAS PAGE ------------------------------------------------

// get canvas at the beginning
app.get('/canvas/get', function (req, res) {
  var canvasId = req.cookies.id;
  Canvas.find({ _id: canvasId }, function (err, result) {
    if (err) {
      console.log(err);
    } else if (result.length !== 0) {
      var canvas = result[0];
      var re = {
        'canvasId': canvasId,
        'owner': canvas.owner,
        'company': canvas.company,
        'title': canvas.title,
        'createDate': canvas.createDate
      };
      // constract the sticky list that the result need
      var stickies = canvas.stickies; // list of sticky ID, use each of the id to find the actual Sticky
      Sticky.find({_id:{$in : stickies}}).then((sti) =>{
        re.stickies = sti;
        res.send(re);
      })
    }
  });
});

// copy the covas
app.post('/canvas/copy', function (req, res) {
  var canvasId = req.body.canId;
  var newTitle = req.body.title;
  Canvas.find({ _id: canvasId }, function (err, result) {
    if (err) {
      console.log(err);
      res.send(err);
    } else if (result.length !== 0) {
      var canvas = result[0];
      var users = canvas.users;
      var newDate = new Date();
      var stickies = canvas.stickies;
      var newHis = {
        user: req.cookies.email,
        content: 'Added ' + stickies.length + ' stickies to the Canvas',
        modifiedTime: newDate
      };
      var newCanvas = new Canvas(
        {
          owner: canvas.owner,
          email: req.cookies.email,
          title: newTitle,
          company: canvas.company,
          users: users,
          stickies: canvas.stickies,
          createDate: newDate,
          editHistory: [newHis]
        }
      );
      Canvas.create(newCanvas, function (err, created) {
        if (err) {
          console.log(err);
        } else {
          var newCanvasId = created.id;
          User.findOneAndUpdate({ email: req.cookies.email }, { $push: { canvas: newCanvasId } }, function (err, updated) {
            if (err) {
              console.log(err);
            }
            else {
              var re = {
                'id': newCanvasId,
                'users': created.users
              };
              res.send(re);
            }
          });
        }
      });
    }
  });
});

app.post('/canvas/add', function (req, res) {
  var canvas = req.body.canvasId;
  var sticky = req.body.sticky;
  var re = {};
  re.status = fal;
  Canvas.find({ _id: canvas }, function (err, result) {
    if (err) {
      console.log(err);
      res.send(re);
    } else if (result.length == 0) {
      res.send(re);
    } else {
      // create new sticky

      sticky.canvasId = canvas;
      sticky.modifiedTime = new Date()
      var newStic = new Sticky(sticky)
      Sticky.create(newStic, function (err, newlyCreated) {
        if (err) {
          console.log(err);
          res.send(re);
        } else if (newlyCreated == null) {
          res.send(re);
        }
        else {
          // add sticky index to the canava
          var newHistory = {
            stickyID: newlyCreated._id,
            user: req.cookies.email,
            content: 'Add new sticky',
            modifiedTime: new Date()
          };
          Canvas.findOneAndUpdate({ _id: canvas },
            { $push: { stickies: newlyCreated._id, editHistory: newHistory } },
            function (err, updated) {
              if (err) {
                console.log(err);
                res.send(re);
              } else if (updated == null) {
                re.status = fal;
                res.send(re);
              } else {
                re.status = tru;
                re.id = newlyCreated._id;
                res.send(re);
              };
            });
        }
      });
    }
  });
});

app.delete('/canvas/delete', function (req, res) {
  var canvas = req.body.canvasId;
  var sticky = req.body.stickyId;
  var newHistory = {
    stickyID: sticky,
    user: req.cookies.email,
    content: 'Delete sticky',
    modifiedTime: new Date()
  };
  Canvas.findOneAndUpdate({ _id: canvas }, {
    $pull: { stickies: sticky }, // delete sticky id from the sticky list in canvas
    $push: { editHistory: newHistory } // add new history to the canvas
  }, function (err, result) {
    if (err) {
      console.log(err);
      res.send(fal);
    } else if (result == null) {
      res.send(fal);
    } else {
      // delete the canvas by the requested id
      Sticky.findOneAndDelete({ _id: sticky }, function (err, deleted) {
        if (err) {
          console.log(err);
          res.send(fal);
        } else if (deleted == null) {
          res.send(fal);
        } else {
          res.send(tru);
        };
      });
    };
  });
});

app.post('/canvas/edit', function(req, res){
  var email = req.cookies.email;
  var canvas = req.body.canvasId;
  var sticky = req.body.stickyId;
  var type = req.body.type;
  var change = req.body.change;
  var newDate = new Date();
  if (changeType.indexOf(type) !== -1) {
    if (type.includes('comment')) {
      if (type === 'add comment') {
        // create new comment
        var newCom = {
          user: email,
          content: change,
          modifiedTime: newDate
        };
        // add new comment to the corresponding sticky
        Sticky.findOneAndUpdate({ _id: sticky }, { $push: { comment: newCom } }, function (err, result) {
          if (err) {
            console.log(err);
            res.send(fal);
          } else if (result == null) {
            res.send(fal);
          } else {
            createHistory(req.cookies.email, type, newDate, canvas, res);
          };
        });
      }
      else {
        // delete comment from the corresponding sticky
        Sticky.findOneAndUpdate({ _id: sticky }, { $pull: { comment: change } }, function (err, result) {
          if (err) {
            console.log(err);
            res.send(fal);
          } else if (result == null) {
            res.send(fal);
          } else {
            createHistory(email, type, newDate, canvas, res);
          };
        });
      }
    }
    else {
      // update sticky information only
      Sticky.findOneAndUpdate({ _id: sticky }, { [type]: change, modifiedTime: new Date() }, { new: true }, function (err, result) {
        if (err) {
          console.log(err);
          res.send(fal);
        } else if (result == null) {
          res.send(fal);
        } else {
          createHistory(email, type, newDate, canvas, res);
        }
      });
    }
  }
});
// helper function for creating history
function createHistory(email, type, newDate, canvasId, res) {
  var cont;
  if (type.includes('comment')) {
    cont = type;
  } else {
    cont = 'Modified' + type;
  }
  var newHis = {
    user: email,
    content: cont,
    modifiedTime: newDate
  };
  Canvas.findOneAndUpdate({ _id: canvasId }, { $push: { editHistory: newHis } }, function (err, updated) {
    if (err) {
      console.log(err);
      res.send(fal);
    } else if (updated == null) {
      res.send(fal);
    } else {
      if (type === 'add comment') {
        res.send(newDate)
      } else {
        res.send(tru);
      }
    }
  });
}

// get role of current user
app.get('/canvas/role', function (req, res) {
  var email = req.cookies.email;
  User.find({ 'email': email }, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      var user = result[0];
      res.send({ role: user.role });
    }
  });
});

// change owner, title and company in one post request
app.post('/canvas/change', function (req, res) {
  var change = req.body.change;
  var type = req.body.type;
  var canvasId = req.cookies.id;

  Canvas.findOneAndUpdate({ _id: canvasId }, { [type]: change }, function (err, result) {
    if (err) {
      console.log(err);
      res.send(fal);
    } else {
      res.send(tru);
    }
  });
});

// -------------------------------------------- USER AND MANAGER PAGE ---------------------------------------

// get canvas from library page
app.get('/library/get', function (req, res) {
  res.clearCookie('id');
  var email = req.cookies.email;
  User.find({
    email: email
  }).then((result) => {
    var user = result[0];
    var role = user.role;  // 2 regUser, 3 manager, 4 admin
    let c_list = user.canvas;

    var regTitle = new Array();
    var regId = new Array();
    var mngTitle = new Array();
    var mngId = new Array();
    var mngUsers = new Array();

    if (c_list.length != 0) {
      Canvas.find({
        _id: { $in: c_list }
      }).then((result) => {
        //result is a list of canvas, split into manager's canvas and other canvas
        var mng = result.filter(canvas => canvas.email == email)
        mngTitle = mng.map(canvas => canvas.title)
        mngId = mng.map(canvas => canvas.id)
        mngUsers = mng.map(canvas => canvas.users)

        var reg = result.filter(canvas => canvas.email != email)
        regId = reg.map(canvas => canvas.id)
        regTitle = reg.map(canvas => canvas.title)

        if (role == regUser) {   // only send regular canvas
          res.send({ regTitle: regTitle, regId: regId });
        } else if (role == manager) {  // send regular canvas and manager's canvas
          res.send({ regTitle: regTitle, regId: regId, mngTitle: mngTitle, mngId: mngId, mngUsers: mngUsers });
        }
      })
    }
  }).catch((err) => {
    console.error(err);
  });
});

// store the canvas id into cookie
app.post('/library/id', function (req, res) {
  var canvasId = req.body.canvasId;
  res.cookie('id', canvasId);
  res.send(tru);
});

// edit user in manage page
app.post('/manager/user', function (req, res) {
  var type = req.body.type;
  var id = req.body.canvasId;
  var email = req.body.email;
  var empty = new Array();
  Canvas.find({
    id: id
  }).then((result) => {
    if (type == "add") {
      User.find({
        email: email
      }).then((result) => {
        if (result.length == 0) {  // user in not in database
          var user = new User({
            name: '',
            email: email,
            pwd: '',
            role: regUser,
            canvas: [id],
            occupation: '',
            status: 2,
            phone: '',
            company: '',
            notification: empty
          });
          User.create(user).then((result) => {
            Canvas.findOneAndUpdate({ _id: id }, { $push: { users: email } })
              .then((result) => {
                res.send(tru)
              })
          })
        } else {  // user in database
          Canvas.findOneAndUpdate({ _id: id }, { $push: { users: email } })
            .then((result) => {
              User.findOneAndUpdate({ email: email }, { $push: { canvas: id } })
                .then((result) => {
                  res.send(tru)
                })
            })
        }
      })
    } else if (type == "remove") {
      User.findOneAndUpdate({ email: email }, { $pull: { canvas: id } })
      Canvas.findOneAndUpdate({ _id: id }, { $pull: { users: email } })
        .then((result) => {
          res.send(tru)
        })
    }
  }).catch((err) => {
    console.log(err)
    res.send(fal)
  })
});

// add canvas from manager page
app.post('/manager/add', function (req, res) {
  var owner = req.cookies.name;
  var email = req.cookies.email;
  var title = req.body.title;
  var empty = new Array();
  var time = new Date();

  // create a new canvas with given owner and title.
  var canvas = new Canvas({
    owner: owner,
    email: email,
    title: title,
    company: '',
    users: [email],
    stickies: empty,
    createDate: time,
    editHistory: empty
  });

  // add canvas to database
  Canvas.create(canvas).then((result) => {
    console.log(result.id)
    User.find({ email: email }).update({ $push: { canvas: result.id } })
    .then(function(){
      res.send({id:result.id})
    })
  }).catch((err) => {
    console.log(err)
  })
});

// delete canvas from manager page
app.delete('/manager/del', function (req, res) {
  var id = req.body.canvasId;  //now is a list of canvasIds
  Canvas.findOneAndDelete({ _id: id }, function (err, result) {
    if (err) {
      console.log("cant find canvas")
      console.log(err);
      res.send(fal);
    } else {
      var u = result.users;
      var s = result.stickies;

      User.findOneAndUpdate({ email: result.email }, { $pull: { canvas: id } }, function (err, result) {
        User.find({
          email: { $in: u }
        }).updateMany(
          {
            $pull: { canvas: id }
          }
        ).then((result) => {
          Sticky.deleteMany({
            _id: {
              $in: s
            }
          }).then((result) => {
            res.send(tru)
          })
        }).catch((err) => {
          console.error(err);
          res.send(fal);
        })
      });
    }
  });
});

// ---------------------------------------------- PROFILE PAGE --------------------------------------------------

// get user information for profile page
app.get('/profile/get', function (req, res) {
  var email = req.cookies.email;
  User.find({ email: email }, function (err, result) {
    if (err) {
      console.log(err);
      res.send(fal);
    } else {
      var user = result[0];
      res.send({ phone: user.phone, company: user.company, occupation: user.occupation });
    }
  });
});

// edit user information for profile page
app.post('/profile/edit', function (req, res) {
  var n = req.body.name;
  var p = req.body.phone;
  var c = req.body.company;
  var o = req.body.occupation;
  var e = req.cookies.email;

  User.findOneAndUpdate({ email: e }, { $set: { name: n, phone: p, company: c, occupation: o } }, function (err, result) {
    if (err) {
      console.log(err);
      res.send(fal);
    } else {
      res.send(tru);
    }
  });
});

// get password for password page
app.get('/pwd/get', function (req, res) {
  var email = req.cookies.email;
  User.find({ email: email }, function (err, result) {
    if (err) {
      console.log(err);
      res.send(fal);
    } else {
      var user = result[0];
      res.send({ pwd: user.pwd });
    }
  });
});

// change password for password page
app.post('/pwd/edit', function (req, res) {
  var pwd = req.body.pwd;
  var email = req.cookies.email;
  User.findOneAndUpdate({ email: email }, { pwd: pwd }, function (err, result) {
    if (err) {
      console.log(err);
      res.send(fal);
    } else {
      res.send(tru);
    }
  });
});

// ---------------------------------------------- ADMINISTATOR PAGE --------------------------------------------------

// get notifications of the register request
app.get('/admin/notification', function (req, res) {
  var email = req.cookies.email;
  User.find({ email: email }, function (err, result) {
    if (err) {
      console.log(err);
      res.send(err);
    } else if (result.length === 0) {
      res.send(fal);
    } else {
      res.send(result[0].notification);
    }
  });
});

// get user information that the admin wants to decline the register request
app.post('/admin/decline', function (req, res) {
  var adminEmail = req.cookies.email;
  var email = req.body.email;
  User.findOneAndUpdate({ email: email }, { $set: { status: 0 } }, function (err, result) {
    if (err) {
      console.log(err);
      res.send(fal);
    } else {
      User.findOneAndUpdate({ email: adminEmail }, { $pull: { notification: { userEmail: email } } }, function (err, updated) {
        if (err) {
          console.log(err);
          res.send(fal);
        } else {
          res.send(tru);
        }
      });
    }
  });
});

// get user information that the admin wants to approve the register request
app.post('/admin/accept', function (req, res) {
  var adminEmail = req.cookies.email;
  var email = req.body.email;
  User.findOneAndUpdate({ email: email }, { status: 2 }, function (err, result) {
    if (err) {
      console.log(err);
      res.send(fal);
    } else {
      User.findOneAndUpdate({ email: adminEmail }, { $pull: { notification: { userEmail: email } } }, function (err, updated) {
        if (err) {
          console.log(err);
          res.send(fal);
        } else {
          res.send(tru);
        }
      });
    }
  });
});

app.get('/admin/get', function (req, res) {
  res.clearCookie('id');
  var email = req.cookies.email;
  getAllCanvas(email, res);
});

function getAllCanvas(email, res) {
  User.find({ email: email }).exec()
    .then(async function (result) {
      try {
        var user = result[0];
        var notification = user.notification;
        var regTitle = new Array();
        var regId = new Array();
        var mngTitle = new Array();
        var mngId = new Array();
        var mngUsers = new Array();
        const canvas = await Canvas.find().exec();
        if (canvas.length == 0) {
          res.send({ regTitle: regTitle, regId: regId, mngTitle: mngTitle, mngId: mngId, mngUsers: mngUsers, notification: notification });
        }
        for (var i = 0; i < canvas.length; i++) {
          var c = canvas[i];
          var id = c.id
          var t = c.title;
          if (c.email == email) {
            var user = c.users;
            mngId.push(id);
            mngTitle.push(t);
            mngUsers.push(user);
          } else {
            regTitle.push(t);
            regId.push(id);
          }
          if (i == canvas.length - 1) {
            res.send({ regTitle: regTitle, regId: regId, mngTitle: mngTitle, mngId: mngId, mngUsers: mngUsers, notification: notification });
          }
        }
      }
      catch (err) {
        console.log(err);
        res.send(err);
      }
    });
};


app.get('/admin/users', function (req, res) {
  var email = req.cookies.email;
  User.find({status :2})
  .then((result) =>{
    var re = result.filter(result => (result.email !== email)).map(result => result.email);
    res.send(re);

  }).catch((err) => {
    console.error(err);
    res.send(err);
  })
});

app.post('/admin/edit', function (req, res) {
  var type = req.body.type;
  var user = req.body.user;
  var email = req.cookies.email;
  if (type === 'remove'){  
      User.findOneAndDelete({email: user}, function(err, result){
        if(err){
          console.log(err);
          res.send(err);
        }else if (result == null){
          res.send(fal)
        }else{
          let can = result.canvas;
          Canvas.find({_id: {$in : can}}).updateMany({$pull: {users: user}})
          .then((result)=>{
            Canvas.find({email:user}, function(err, result){
              let ids = result.map(result => result.id);
              Canvas.deleteMany({email:user})
              .then((result) =>{
                Sticky.deleteMany({
                  canvasId: {
                    $in: ids
                  }
                }).then((result) => {
                  User.find({canvas: {$in : ids}}).updateMany({$pull: {canvas: {$in:ids}}})
                  .then((result) => {
                    getAllCanvas(email, res);
                  })
                })
              })
              
            })
          }).catch((err) => {
            console.error(err);
            res.send(fal);
          })
        }

      })
  }else{
    var user = new User({
      name: '',
      email: user,
      pwd: '',
      role: manager,
      canvas: new Array(),
      occupation: '',
      status: 2,
      phone: '',
      company: '',
      notification: new Array()
    });
    User.create(user, function (err, newlyCreated) {
      if (err) {
        console.log(err);
        res.send(err);
      } else if (newlyCreated == null) {
        res.send(err);
      } else {
        res.send(tru);
      }
    });
  }
});

// get user information from
// app.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });
http.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
