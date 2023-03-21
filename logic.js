let nickname = "";
let hue = 0;
function promptNickname(prompttitle = "Введите имя пользователя:") {
    while (nickname.length < 1 || nickname.length > 50) {
        nickname = prompt(prompttitle, "");
    }
    nickname = nickname.slice(0, 50);
    hue = nicknameHue(nickname);
}
function nicknameHue(nick) {
    return (hashCode(nick) + 318) % 360;
}
promptNickname();


//-------COMMON UTILS-------
function hashCode(str) {
    for(var i = 0, hc = 0; i < str.length; i++)
        hc = Math.imul(31, hc) + str.charCodeAt(i) | 0;
    return Math.abs(hc);
}
function scrollToBottom(id) {
    const elem = document.getElementById(id);
    elem.scrollTop = elem.scrollHeight;
}
function currentDatetime() {
    const today = new Date();
    let hours = today.getHours().toString();
    if (hours.length < 2) hours = `0${hours}`;
    // 
    let minutes = today.getMinutes().toString();
    if (minutes.length < 2) minutes = `0${minutes}`;
    // 
    let seconds = today.getSeconds().toString();
    if (seconds.length < 2) seconds = `0${seconds}`;
    return `${hours}:${minutes}:${seconds}`;
}

//-------CHAT UTILS-------
function chatNewMem(who) {
    const elem = document.createElement('div');
    elem.setAttribute("who", who);
    elem.className = "client";
    elem.innerHTML = who;
    elem.style = `filter: hue-rotate(${nicknameHue(who)}deg);`;
    document.getElementById('clients').append(elem);
}
function chatDelMem(who) {
    document
        .querySelectorAll(`.client[who="${who}"]`)
        .forEach((elem)=>elem.remove())
}
function chatPutMessage(type, msgtext, msgwho = "") {
    const elem = document.createElement('div');
    elem.className = "msg ";
    switch (type) {
        case "self":
            elem.style = `filter: hue-rotate(${hue}deg);`;
            break;
        case "outer": 
            elem.style = `filter: hue-rotate(${nicknameHue(msgwho)}deg);`;
            elem.className += "outer";
            break;
        case "notify":
            elem.className += "notify";
            break;
        default:
            break;
    }
    elem.innerHTML = "";
    
    if (msgwho !== "") {
        let msgtitle = `<div class="msgtitle">`
        msgtitle += `<div class="msgwho">${msgwho}</div>`;
        if (type !== "notify") {
            msgtitle += `<div class="msgtime">${currentDatetime()}</div>`;
        }
        msgtitle += `</div>`;
        elem.innerHTML += msgtitle;
    }
    elem.innerHTML += `<div class="msgtext">${msgtext}</div>`;
    document.getElementById('messages').append(elem);
    scrollToBottom("messages");
}
function setOnlineCounter(count = "") {
    if (count === "") {
        document.getElementById('counter-title').innerHTML = "Офлайн";
        document.getElementById('counter').innerHTML = "";
    }
    else {
        document.getElementById('counter-title').innerHTML = "Онлайн:";
        document.getElementById('counter').innerHTML = count;
    }
}

//-------WEBSOCKET INCOMING HANDLERS-------
function wssOpen() {
    if (nickname === "") return;
    socket
        .send(JSON.stringify({
            type: "NEWMEM",
            data: {
                who: nickname
            }
        }))
}
function wssClose(event) {
    console.log("Соединение закрыто");
    chatPutMessage("notify", "Соединение закрыто");
    setOnlineCounter();
    // socket.send("");
}
function wssError(event) {
    console.error("Ошибка WebSocket");
    chatPutMessage("notify", "Ошибка WebSocket");
    socket.close();
}
function wssMessage(event) {
    try {
        const message = JSON.parse(event.data);
        switch (message.type) {
            case "MSG":
                var type = "self";
                if (message.data.who !== nickname) {
                    type = "outer";
                }
                chatPutMessage(type, message.data.msg, message.data.who);
                break;
            case "NOTIFY":
                chatPutMessage("notify", message.data);
                break;
            case "NEWMEM":
                const newMemMsg = `
                <div 
                class="msgwho" 
                style="filter: hue-rotate(${nicknameHue(message.data)}deg);"
                >
                ${message.data}</div> подключился
                `; 
                chatNewMem(message.data);
                chatPutMessage("notify", newMemMsg);
                break;
            case "DELMEM":
                chatDelMem(message.data);
                chatPutMessage("notify", `${message.data} отключился`);
                break;
            case "CLIENTS":
                message.data.forEach(client => {
                    chatNewMem(client);
                });
                break;
            case "COUNT":
                setOnlineCounter(message.data);
                break;
            case "CHANGE_NICK":
                console.error(`CHANGE_NICK: ${message.data}`);
                nickname = "";
                promptNickname("Имя занято. Введите другое имя:");
                wssOpen();
                break;
            case "ERROR":
                console.error(`SERVER ERROR: ${message.data}`);
                break;
            default:
                console.error(`Ошибка определения типа сообщения: ${message.type}`);
        }
    }
    catch (error) {
        console.error("Ошибка: ", error);
    }
}
//-------WEBSOCKET OUTGOING HANDLERS-------
function wssSendMessage() {
    if (nickname === "") return;
    let message = document.getElementById('msginput').value.slice(0, 2000);
    if (message === "") {
        console.warn("Не отправляйте пустые сообщения");
        return false;
    }
    socket
        .send(JSON.stringify({
            type: "MSG",
            data: {
                who: nickname,
                msg: message
            }
        }))
    document.getElementById('msginput').value = "";
    return true;
}


// let socket = new WebSocket("wss://lucors.ru/wschatserver/");
// ws://localhost:9000
let socket = new WebSocket("ws://127.0.0.1:9000");
//Обработчики сокета
socket.onopen = wssOpen;
socket.onclose = wssClose;
socket.onerror = wssError;
socket.onmessage = wssMessage;

//Отправка сообщения
document.getElementById('msgsend').onclick = wssSendMessage;
document.querySelector('input').addEventListener('keydown', function (e) {
    if (e.key === "Enter") return wssSendMessage();
});

