var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var cfenv = require('cfenv')
var signal = require('simple-signal-server')(io)
var path = require('path')

app.use('/', express.static(path.join(__dirname, 'reator-web')))
app.get('/', function (req, res, next) {
  res.sendFile(__dirname + '/reator-web/index.html')
})


var generateMessage = (from, text) => {
  return {
    from,
    text,
    createdAt: new Date().getTime()
  }
}

var calls = {}
var rooms = {}
var sockets = {}
io.on('connection', function (socket) {
  sockets[socket.id] = socket

  socket.emit('id', socket.id)

  socket.on('join', function (data) {
    if (!data) return
    if (!data.room) return

    socket.join(data.room)
    socket.room = data.room
    socket.nickname = data.nickname || 'Guest'
    socket.nop2p = data.nop2p
    // username = socket.nickname

    rooms[socket.room] = rooms[socket.room] || [] // create room if missing

    // do discovery (for no-p2p peers)
    rooms[socket.room].forEach(function (id) {
      socket.emit('peer-join', {
        id: id,
        nickname: sockets[id].nickname,
        nop2p: sockets[id].nop2p
      })
    })

    rooms[socket.room].push(socket.id) // add to room

    // announce connect (for no-p2p peers)
    socket.broadcast.to(socket.room).emit('peer-join', {
      id: socket.id,
      nickname: socket.nickname,
      nop2p: socket.nop2p
    })

    socket.emit('join')
  })

  // forward data (for no-p2p peers)
  socket.on('forward', function (data) {
    if (!socket.room || !data || !data.target) return
    data.id = socket.id
    data.nop2p = socket.nop2p

    if (socket.target === socket.room && !socket.nop2p) {
      // when sending to the whole room, we only want to send to those peers
      // that we don't already have a p2p connection with
      rooms[socket.room].forEach(function (id) {
        if (sockets[id].nop2p) {
          socket.broadcast.to(id).emit('forward', data)
        }
      })
    } else {
      socket.broadcast.to(data.target).emit('forward', data)
    }
  })

  // console.log('New user connected')

  // // default username
  // socket.username = 'Anonymous'
  //
  // // listen on change_username
  // socket.on('change_username', (data) => {
  //   socket.username = data.username
  // })
  //
  // // listen on new_message
  // socket.on('new_message', (data) => {
  //   // broadcast the new message
  //   io.sockets.emit('new_message', {message: data.message, username: socket.username})
  // })

  // listen on typing
  // socket.on('typing', (data) => {
  //   socket.broadcast.emit('typing', {username: socket.username})
  // })

  // console.log(nickname + "is connected")

  socket.on('createMessage', (message, callback, id) => {
    io.emit('newMessage', generateMessage(message.from, message.text))
    callback('This is from the server.')
    // socket.broadcast.emit('newMessage', {
    //   from: message.from,
    //   text: message.text,
    //   createdAt: new Date().getTime()
    // });
  })

  socket.on('disconnect', () => {
    console.log('User was disconnected')
  })

  socket.on('voice-join', function () {
    if (!socket.room) return

    socket.emit('voice-discover', calls[socket.room] || [])

    calls[socket.room] = calls[socket.room] || []
    calls[socket.room].push(socket.id)
  })

  socket.on('voice-leave', function () {
    if (!socket.room) return

    calls[socket.room] = calls[socket.room] || []
    var index = calls[socket.room].indexOf(socket.id)
    if (index !== -1) calls[socket.room].splice(index, 1)
  })

  socket.on('disconnect', function () {
    if (!socket.room) return

    // announce disconnect (for no-p2p peers)
    socket.broadcast.to(socket.room).emit('peer-leave', {
      id: socket.id,
      nickname: socket.nickname,
      nop2p: socket.nop2p
    })

    calls[socket.room] = calls[socket.room] || []
    var index = calls[socket.room].indexOf(socket.id)
    if (index !== -1) calls[socket.room].splice(index, 1)

    rooms[socket.room] = rooms[socket.room] || []
    index = rooms[socket.room].indexOf(socket.id)
    if (index !== -1) rooms[socket.room].splice(index, 1)

    // announce disconnect (for nop2p peers)
    socket.broadcast.to(socket.room).emit('peer-leave', {
      id: socket.id,
      nickname: socket.nickname,
      nop2p: socket.nop2p
    })

    delete sockets[socket.id]
  })
})

signal.on('discover', function (request) {
  if (!request.metadata.room) return

  var peerIDs = rooms[request.metadata.room] || []
  request.discover(peerIDs)
})

signal.on('request', function (request) {
  request.forward()
})

var appEnv = cfenv.getAppEnv()
server.listen(appEnv.port)
console.log('Running at ' + appEnv.url)
