//Websocket
ws = {

    socket: null,
    port: 2,
    Boot: () =>{

        ws.socket = null;
        ws.socket = new WebSocket(`wss://codecat.pw:${ws.port}`);
        ws.socket.onmessage = e =>{

            let msg = JSON.parse(e.data);
            console.log(msg);

            if(msg.type == 'Identify') {

                if(chat.Data.username == null) {
                    chat.Data.MasterContainer.style.visibility = 'visible'
                } else {
                    ws.send('JoinChat', {
                        username: chat.Data.username,
                        uuid: chat.Data.uuid
                    })
                }
                chat.DOM.Disconnected.style.transform = ``

            }

            if(msg.type == 'JoinedChat') {

                chat.DOM.SetUsernameButton.removeEventListener('pointerdown', chat.joinChat)
                chat.DOM.ChatContainer.style.transform = `translateY(-100%)`
                chat.DOM.ChatContainer.style.opacity = 1
                chat.Data.connections = msg.msg.connections
                chat.DOM.OnlineUsersCount.innerText = msg.msg.connections.length
                chat.buildOnlineUserList()
                chat.buildMessagesList(msg.msg.messages)

            }

            if(msg.type == 'SomeoneJoined') {

                chat.Data.connections = msg.msg.connections
                chat.DOM.OnlineUsersCount.innerText = msg.msg.connections.length
                chat.buildOnlineUserList()

            }

            if(msg.type == 'SomeoneLeft') {

                chat.Data.connections = msg.msg
                chat.DOM.OnlineUsersCount.innerText = msg.msg.length
                chat.buildOnlineUserList()

            }

            if(msg.type == 'NewMessage') {

                chat.buildMessagesList(msg.msg)

            }

        }

        ws.socket.onclose = ()=>{
            ws.reconnect()
            chat.DOM.Disconnected.style.transform = `translateY(100%)`
        }
        ws.socket.onerror = e =>{
            chat.DOM.Disconnected.style.transform = `translateY(100%)`
        }

    },

    send: (type, msg) =>{

        ws.socket.send(JSON.stringify({

            type: type,
            msg: msg

        }))

    },

    reconnect: () => {

        if(ws.socket.readyState == 3 || ws.socket.readyState == 2 || ws.socket.readyState == null){

            ws.Boot(ws.port);
            setTimeout(ws.reconnect(), Math.random() * 2000);

        }
        
    }

}

//Chat Functions
chat = {

    Data: {

        MasterContainer: document.querySelector('.MasterContainer'),
        UsernameButtonSet: 0,
        username: null,
        uuid: crypto.getRandomValues(new Int8Array(4)).join(''),
        connections: [],
        messageReadyToSend: 0,
        isMessageInputfocused: 0,

    },

    DOM: {

        Disconnected: document.querySelector('.Disconnected'),
        Logo: document.querySelector('.Logo'),
        ChatContainer: document.querySelector('.ChatContainer'),
        UsernameContainer: document.querySelector('.UsernameContainer'),
        UsernameInput: document.querySelector('.UsernameInput'),
        SetUsernameButton: document.querySelector('.SetUsernameButton'),
        OnlineUsersCount: document.querySelector('.OnlineUsersCount'),
        OnlineUsers: document.querySelector('.OnlineUsers'),
        ChatMessages: document.querySelector('.ChatMessages'),
        MessageInput: document.querySelector('.MessageInput'),
        SendButton: document.querySelector('.SendButton'),

    },

    Listen: () =>{

        chat.DOM.UsernameInput.addEventListener('input', chat.checkUsername)
        chat.DOM.UsernameInput.addEventListener('focus', chat.handleUsernameInputfocus)
        chat.DOM.UsernameInput.addEventListener('blur', chat.handleUsernameInputblur)
        chat.DOM.MessageInput.addEventListener('input', chat.handleMessageInput)
        chat.DOM.MessageInput.addEventListener('focus', chat.handleMessageInputfocus)

    },

    handleUsernameInputfocus: () =>{

        chat.DOM.UsernameInput.placeholder = ''
        chat.DOM.Logo.style.opacity = .2

    },

    handleUsernameInputblur: () =>{

        chat.DOM.UsernameInput.placeholder = 'type username here..'
        chat.DOM.Logo.style.opacity = 1

    },

    checkUsername: e =>{

        if(e.target.value.length > 0) {

            chat.Data.username = e.target.value

            if(chat.Data.UsernameButtonSet == 0) {

                chat.Data.UsernameButtonSet = 1
                chat.DOM.SetUsernameButton.style.opacity = 1
                chat.DOM.SetUsernameButton.addEventListener('pointerdown', chat.joinChat)
                console.log('added event listener')

            }

        } else {

            chat.Data.username = null
            chat.DOM.SetUsernameButton.style.opacity = ''
            chat.DOM.SetUsernameButton.removeEventListener('pointerdown', chat.joinChat)
            chat.Data.UsernameButtonSet = 0
            console.log('removed event listener')

        }

    },

    joinChat: () =>{

        ws.send('JoinChat', {
            username: chat.Data.username,
            uuid: chat.Data.uuid
        })

        chat.DOM.UsernameInput.blur()
        chat.DOM.UsernameContainer.style.transform = `translateY(100%)`
        chat.DOM.Logo.style.transform = `translateY(-100%)`
        chat.DOM.UsernameContainer.style.opacity = 0
        chat.DOM.Logo.style.opacity = 0

    },

    buildOnlineUserList: () =>{

        chat.DOM.OnlineUsers.innerHTML = ''
        chat.Data.connections.forEach(connection =>{

            let div = document.createElement('div')
            let image = document.createElement('div')
            let name = document.createElement('div')
            div.append(image)
            div.append(name)

            image.innerHTML = '<span class="iconify" data-icon="ant-design:user-outlined"></span>'
            name.innerText = connection.username

            div.connection = connection
            chat.DOM.OnlineUsers.append(div)

        })

    },

    handleMessageInput: e =>{

        let trimmed = e.target.value.trim()

        if(trimmed.length > 0) {

            if(chat.Data.messageReadyToSend == 0) {

                chat.DOM.MessageInput.value = trimmed
                chat.Data.messageReadyToSend = 1
                chat.DOM.SendButton.addEventListener('pointerdown', chat.sendMessage, {once:true})
                chat.DOM.MessageInput.addEventListener('keydown', chat.handleMessageInputKeydown)
                chat.DOM.SendButton.style.opacity = 1

            }

        } else {

            chat.Data.messageReadyToSend = 0
            chat.DOM.SendButton.removeEventListener('pointerdown', chat.sendMessage, {once:true})
            chat.DOM.MessageInput.removeEventListener('keydown', chat.handleMessageInputKeydown)
            chat.DOM.SendButton.style.opacity = ''

        }

    },

    handleMessageInputKeydown: e =>{

        if(e.key == 'Enter') {

            chat.sendMessage()

        }

    },

    handleMessageInputfocus: e =>{

        chat.Data.isMessageInputfocused = 1
        window.document.addEventListener('pointerdown', chat.handleBodypointerdown)

    },

    handleBodypointerdown: e =>{

        if(e.target.nodeName !== 'INPUT') {

            if(typeof(e.target.className) == 'undefined' || e.target.className !== 'SendButtonCover') {

                window.document.removeEventListener('pointerdown', chat.handleBodypointerdown)
                if(chat.Data.isMessageInputfocused == 1) {
    
                    chat.Data.isMessageInputfocused = 0
                    chat.DOM.MessageInput.blur()
    
                }

            }

        }

    },

    sendMessage: () =>{

        let message = {

            created: Date.now(),
            body: chat.DOM.MessageInput.value,
            id: crypto.getRandomValues(new Int8Array(4)).join(''),
            username: chat.Data.username,
            uuid: chat.Data.uuid

        }

        //Send message to websocket server
        ws.send('PostMessage', message)

        //Clear input and button
        chat.Data.messageReadyToSend = 0
        chat.DOM.MessageInput.value = ''
        chat.DOM.SendButton.removeEventListener('pointerdown', chat.sendMessage, {once:true})
        chat.DOM.MessageInput.removeEventListener('keydown', chat.handleMessageInputKeydown)
        chat.DOM.SendButton.style.opacity = ''

    },

    buildMessagesList: messages =>{

        chat.DOM.ChatMessages.innerHTML = ''
        messages.forEach(message =>{

            let div = document.createElement('div')
            let top = document.createElement('div')
            let bot = document.createElement('div')
            let usr = document.createElement('div')
            let body = document.createElement('div')
            let time = document.createElement('div')
            div.append(top)
            div.append(bot)
            top.append(usr)
            top.append(body)
            bot.append(time)

            //Fill elements with information
            usr.innerText = message.username;
            body.innerText = message.body;
            let date = new Date(message.created)
            let mer, hour, min;
            //Handle hours
            if(date.getHours() < 12) {
                mer = 'AM'
                hour = date.getHours()
            } else if(date.getHours() == 12) {
                mer = 'PM'
                hour = date.getHours()
            } else {
                mer = 'PM'
                hour = date.getHours() - 12
            }
            //Handle minutes
            if(date.getMinutes() < 10) {
                min = `0${date.getMinutes()}`
            } else {
                min = date.getMinutes()
            }
            //Set time
            time.innerText = `${hour}:${min} ${mer}`

            div.info = message;

            chat.DOM.ChatMessages.append(div)

            //Scroll to bottom of messages
            //Get height of all messages inside container
            let height = 0
            let children = Array.from(chat.DOM.ChatMessages.children);
            children.forEach(child =>{
                height += child.clientHeight
            })
            chat.DOM.ChatMessages.scrollTo(0, height)

        })

    }

}

chat.Listen()
ws.Boot()