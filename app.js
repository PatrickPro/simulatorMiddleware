var server = require('http').createServer()
    , url = require('url')
    , WebSocketServer = require('ws').Server
    , wss = new WebSocketServer({server: server})
    , express = require('express')
    , app = express()
    , WsPort = 4080;
var fs = require('fs');
var net = require('net');
var JSFtp = require("jsftp");

var ftp = new JSFtp({
    host: "ftp.proppe.me",
    port: 21,
    user: "riskygadgets@proppe.me",
    pass: "urbaninformatics2016"
});

var ws = null;
var sockets = [];
var webSockets = [];

var SocketPort = 49500;

var wsConnected = false;
var myWebsocket = null;
var guestId = 0;

var os = require('os');
var ifaces = os.networkInterfaces();

var localIP = "";


'use strict';


Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            return;
        }

        if (alias >= 1) {
            // this single interface has multiple ipv4 addresses
            console.log(ifname + ':' + alias, iface.address);
            console.log("Auto Upload will not work");
        } else {
            // this interface has only one ipv4 adress
            localIP = iface.address;

            fs.writeFile("ipaddress", iface.address, function (err) {
                if (err) {
                    return console.log(err);
                }

                ftp.put('ipaddress', '/ipaddress', function (hadError) {
                    if (!hadError) {
                        console.log("FTP upload successful!");
                    } else {
                        console.log("Error: " + hadError);
                    }

                });
            });
        }
        ++alias;
    });
});

var socketServer = net.createServer(function (socket) {


    sockets.push(socket);


    // When client sends data
    socket.on('data', function (data) {

        var message = data.toString();
        // only send if ws connected
        if (wsConnected && myWebsocket != null) {
            try {
                //process.stdout.write(message);
                broadcast(message);
                //myWebsocket.send(message);
            } catch (exception) {

                if (exception == "Error: not opened") {
                    console.log("A client dropped the connection, reconnecting to remaining clients");
                    // force reconnect, because on close function doenst work --> dirty fix
                    webSockets.forEach(function (webSockets, index, array) {
                        webSockets.close();
                    });
                    webSockets = [];
                    guestId = 0;
                } else {
                    console.log("WS exception: " + exception);
                }

            }
        }
    });


    // When client leaves
    socket.on('end', function () {
        console.log('Socket connection lost!');

        // Remove client from socket array
        removeSocket(socket);

    });

    // When socket gets errors
    socket.on('error', function (error) {

        console.log('Socket error: ', error.message);

    });
});

// Broadcast to others, excluding the sender
function broadcast(message) {

    // If there are no sockets, then don't broadcast any messages
    if (webSockets.length === 0) {
        console.log('No active clients!');
        return;
    }

    // If there are clients remaining then broadcast message
    webSockets.forEach(function (webSockets, index, array) {
        webSockets.send(message);


    });

};
// Remove disconnected client from sockets array
function removeSocket(socket) {

    sockets.splice(sockets.indexOf(socket), 1);

};


// Listening for any problems with the server
socketServer.on('error', function (error) {

    console.log("So we got problems!", error.message);

});

// Listen for a Port to telnet to
// then in the terminal just run 'telnet localhost [port]'
socketServer.listen(SocketPort, function () {

    console.log("Socket Server:    " + localIP + ":" + SocketPort);

});


wss.on('connection', function connection(ws) {
    console.log('Client #' + guestId + ' connected');
    guestId++;
    wsConnected = true;
    myWebsocket = ws;

    webSockets.push(ws);


});


wss.on('close', function close() {
    console.log('disconnected');


    wsConnected = false;
});


server.on('request', app);
server.listen(WsPort, function () {
    console.log('Websocket Server: ' + localIP + ":" + server.address().port)
});


module.exports = app;
