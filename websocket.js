const fs = require('fs');
const https = require('https');

//set the ssl certificate and key with node file system module
const options = 

    {
        key: fs.readFileSync('../etc/letsencrypt/live/codecat.pw/privkey.pem', 'utf8'),
        cert: fs.readFileSync('../etc/letsencrypt/live/codecat.pw/fullchain.pem', 'utf8')
    }

//create a simple https server with node https module
const server = https.createServer(options);

//websocket server class used to create the websocket server
const WebSocketServer = require('ws').Server;

//instantiate the websocket server class
const wss = new WebSocketServer({
    server: server
});

//create an array to store all incoming websocket connections
let connections = []

//create an array to store all incoming chat messages
let messages = []

wss.on('connection', ws =>{

    ws.send(JSON.stringify({
        type: 'Identify',
        msg: 'Who are you?'
    }))

    ws.on('message', message =>{

        let msg = JSON.parse(message)
        console.log(msg)

        if(msg.type == 'JoinChat') {

            connections.forEach((connection, i) =>{

                if(connection.uuid == msg.msg.uuid) {

                    connections.splice(i, 1)

                }

            })

            ws.uuid = msg.msg.uuid

            connections.push({

                lastSeen: Date.now(),
                uuid: msg.msg.uuid,
                username: msg.msg.username,
                ws: ws

            })

            connections.forEach(connection =>{

                if(connection.uuid !== msg.msg.uuid) {

                    connection.ws.send(JSON.stringify({

                        type: 'SomeoneJoined',
                        msg: {
                            uuid: msg.msg.uuid,
                            username: msg.msg.username,
                            sent: Date.now(),
                            message: `${msg.msg.username} joined the chat`,
                            connections: connections
                        }

                    }))

                } else {

                    ws.send(JSON.stringify({
                        
                        type: 'JoinedChat',
                        msg: {
                            connections: connections,
                            messages: messages
                        }

                    }))

                }

            })

        }

        if(msg.type == 'PostMessage') {

            messages.push(msg.msg)
            //Send updated messages to everyone in chat
            connections.forEach(connection =>{

                connection.ws.send(JSON.stringify({

                    type: 'NewMessage',
                    msg: messages

                }))

            })

        }

    })

    ws.on('close', close =>{

        console.log('client closed connection: ', close)
        connections.forEach((connection, i) =>{

            if(connection.ws.uuid == ws.uuid) {

                connections.splice(i, 1)

            }

        })

        connections.forEach(connection =>{

            connection.ws.send(JSON.stringify({

                type: 'SomeoneLeft',
                msg: connections

            }))

        })

    })

    ws.on('error', error =>{

        console.log(`an error has occurred: `, error)

    })

})

server.listen(2)