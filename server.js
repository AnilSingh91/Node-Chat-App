var express = require('express');
var app = express();
var path = require('path');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
const mongo = require('mongodb').MongoClient;
var ejs = require('ejs');
var path = require('path');

var ObjectId = require('mongodb').ObjectID;


app.use(express.static(path.join(__dirname, 'views')));

users = [];
connections = [];

server.listen(process.env.PORT || 3000);
console.log("Server Running !");

app.get('/', function (req, res) {
    res.render('pages/chat');
});




// MongoDB Connection
mongo.connect('mongodb://127.0.0.1/mongochat', function (err, db) {
    if (err) {
        throw err;
    }
    console.log("MongoDB Connected !");

    app.get('/account/:id', function (req, res) {
        var chatusers = db.collection('userdbs');
        chatusers.find({ name: req.params.id }).toArray(function (err, result) {
            console.log(result);
            res.render('pages/account', {user:result} );
        });
    });

    io.sockets.on('connection', function (socket) {
        var chat = db.collection('chatsdb');
        var chatusers = db.collection('userdbs');
        // Get Previous Chat
        chat.find().sort({ _id: 1 }).toArray(function (err, result) {
            if (err) {
                throw err;
            }
            socket.emit('output', result);
        });

        // Connect User
        connections.push(socket);
        console.log('Connected !')
        console.log('Connected:', connections.length);

        // Diconnect User
        socket.on('disconnect', function (data) {
            users.splice(users.indexOf(socket.username), 1);
            chatusers.update(
                {
                    name: socket.username
                },
                { $set: { isActive: false } },
                function (err, docs) {
                    updateUser();
                    connections.splice(connections.indexOf(socket), 1);
                    console.log('Disconnected !')
                    console.log('Connected:', connections.length);
                });
        });


        // Send Message
        socket.on('send message', function (data, user) {

            // updating Chat DB
            chat.insert({ name: user, message: data }, function () {
                io.sockets.emit('new message', { msg: data, username: user });
            });

        })

        // new user 
        socket.on('new user', function (data) {
            chatusers.find().sort({ _id: 1 }).toArray(function (err, result) {
                if (err) {
                    throw err;
                }
                var flag = false;
                for (let i = 0; i < result.length; i++) {
                    if (result[i].name.toLowerCase() == data.toLowerCase()) {
                        flag = true;
                        chatusers.update(
                            {
                                _id: ObjectId(result[i]._id)
                            },
                            { $set: { isActive: true } },
                            function (err, docs) {
                                socket.username = data;
                                updateUser();
                            });
                    }
                }

                if (!flag) {
                    chatusers.insert({ name: data, isActive: true }, function () {
                        socket.username = data;
                        updateUser();
                    });
                }

            });

        });

        function updateUser() {
            chatusers.find().sort({ _id: 1 }).toArray(function (err, result) {
                console.log(result);
                io.sockets.emit('get users', result);
            });

        }
    })
});






