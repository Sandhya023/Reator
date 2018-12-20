function myFunction () {
  var x = document.getElementById('chatbar')
  if (x.style.display === 'none') {
    x.style.display = 'block'
  } else {
    x.style.display = 'none'
  }
}

var socket = io()

socket.on('connect', function () {
  console.log('Connected to server')
})

socket.on('disconnect', function () {
  console.log('Disconnected from server')
})
var username = 'Anonymous'
var today = new Date()

socket.on('newMessage', function (message) {
  console.log('newMessage', message)
  var li = jQuery('<li></li>')
  li.text(`${message.from}: ${message.text}      ${today.getHours()}:${today.getMinutes()}`)

  jQuery('#messages').append(li)
})

jQuery('#send-username').on('click', function (e) {
  if (jQuery('[name=username]').val() != '') {
    username = jQuery('[name=username]').val()
  }
})
jQuery('#send-message').on('click', function (e) {
  socket.emit('createMessage', {
    from: username,
    text: jQuery('[name=message]').val()
  }, function () {
    jQuery('[name=message]').val('')
  })
})
//
// // Emit a username

// //
// // // Emit typing
// // message.bind('keypress', () => {
// //   socket.emit('typing')
// // })
// //
// // // Listen on typing
// // socket.on('typing', (data) => {
// //   feedback.html('<p><i>' + data.username + ' is typing a message...' + '</i></p>')
// // })
//
// // <input class="modal-input" placeholder="Nickname" value="" type="text">

// make connection
//   var socket = io()
//
//   socket.on('connect', function () {
//     console.log('Connected to server')
//   })
//
//   socket.on('disconnect', function () {
//     console.log('Disconnected from server')
//   })
//
//   // buttons and inputs
//   var message = $('#message')
//   var username = $('#username')
//   var send_message = $('#send_message')
//   var send_username = $('#send_username')
//   var chatroom = $('#chatroom')
//   var feedback = $('#feedback')
//
//   // Emit message
//   send_message.click(function () {
//     socket.emit('new_message', {message: message.val()})
//   })
//
//   // Listen on new_message
//   socket.on('new_message', (data) => {
//     feedback.html('')
//     message.val('')
//     chatroom.append("<p class='message'>" + data.username + ': ' + data.message + '</p>')
//   })
//
//   // Emit a username
//   send_username.click(function () {
//     socket.emit('change_username', {username: username.val()})
//   })
//   socket.on('newMessage', function (message, data) {
//     console.log('newMessage', message)
//     var li = jQuery('<li></li>')
//     li.text(`${data.username}: ${data.message}`)
//
//     jQuery('#messages').append(li)
//   })
//
//   jQuery('#send-message').on('click', function (e) {
//     // alert("button is clicked")
//     socket.emit('createMessage', {
//       from: username.val(),
//       text: message.val()
//     }, function () {
//       e.reset()
//     })
//   })
//   // Emit typing
//   // message.bind('keypress', () => {
//   //   socket.emit('typing')
//   // })
//
//   // Listen on typing
//   // socket.on('typing', (data) => {
//   //   feedback.html('<p><i>' + data.username + ' is typing a message...' + '</i></p>')
//   // })
//   //
