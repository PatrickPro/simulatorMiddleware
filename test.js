/**
 * Created by patrickpro on 8/12/2015.
 */
var net = require('net');
var sockets = [];
var port = 49500;


var server = net.createServer(function (socket) {


    sockets.push(socket);


    // When client sends data
    socket.on('data', function (data) {

        var message = data.toString();
        //
        //broadcast(clientName, message);
        //
        //// Log it to the server output
        process.stdout.write(message);
    });


    // When client leaves
    socket.on('end', function () {


        // Log it to the server output
        process.stdout.write(message);

        // Remove client from socket array
        removeSocket(socket);

        // Notify all clients
        broadcast("1", message);
    });


    // When socket gets errors
    socket.on('error', function (error) {

        console.log('Socket got problems: ', error.message);

    });
});


// Broadcast to others, excluding the sender
function broadcast(from, message) {

    // If there are no sockets, then don't broadcast any messages
    if (sockets.length === 0) {
        process.stdout.write('Everyone left the chat');
        return;
    }

    // If there are clients remaining then broadcast message
    sockets.forEach(function (socket, index, array) {
        // Dont send any messages to the sender
        if (socket.nickname === from) return;

        socket.write(message);

    });

};

// Remove disconnected client from sockets array
function removeSocket(socket) {

    sockets.splice(sockets.indexOf(socket), 1);

};


// Listening for any problems with the server
server.on('error', function (error) {

    //console.log("So we got problems!", error.message);

});

// Listen for a WsPort to telnet to
// then in the terminal just run 'telnet localhost [WsPort]'
server.listen(port, function () {

    console.log("Server listening at http://localhost:" + port);

});