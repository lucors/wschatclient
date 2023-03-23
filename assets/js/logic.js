let nickname = "";
let hue = 0;
let socket = null;
let currentStage = null;
let stages = {
    "auth": {
        entry: null,
        exit: null,
    },
    "chat": {
        entry: null,
        exit: null,
    },
}



//-------COMMON UTILS-------
function nicknameHue(nick) {
    return (hashCode(nick) + 318) % 360;
}
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
    document.getElementById('chat-clients').append(elem);
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
    document.getElementById('chat-messages').append(elem);
    scrollToBottom("chat-messages");
}
function setOnlineCounter(count = "") {
    if (count === "") {
        document.getElementById('chat-clients-count-title').innerHTML = "Офлайн";
        document.getElementById('chat-clients-count').innerHTML = "";
    }
    else {
        document.getElementById('chat-clients-count-title').innerHTML = "Онлайн:";
        document.getElementById('chat-clients-count').innerHTML = count;
    }
}

//-------WEBSOCKET INCOMING HANDLERS-------
function wssSendName() {
    nickname = $("#auth-input").val();
    nickname = nickname.slice(0, 50);
    if (nickname === "") {
        $("#auth-error").html("Введите имя");
        return;
    };
    socket
        .send(JSON.stringify({
            type: "NEWMEM",
            data: {
                who: nickname
            }
        }))
}
function wssOpen() {}
function wssClose(event) {
    console.log("Соединение закрыто");
    chatPutMessage("notify", "Соединение закрыто");
    setOnlineCounter();
}
function wssError(event) {
    $("#auth-error").html("Ошибка соединения");
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
            case "NEWMEM_OK":
                setStage("chat"); 
                break;
            case "NEWMEM_CHANGE_NICK":
                console.error(`NEWMEM_CHANGE_NICK: ${message.data}`);
                nickname = "";
                $("#auth-error").html("Имя занято. Введите другое имя");
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
    let message = document.getElementById('chat-input').value.slice(0, 2000);
    if (message === "") {
        console.warn("Не отправляйте пустые сообщения");
        return false;
    }
    socket
        .send(JSON.stringify({
            type: "MSG",
            data: {
                msg: message
            }
        }))
    document.getElementById('chat-input').value = "";
    return true;
}




// Обработка этапов
function setStage(stage) {
    if (!(stage in stages)) return;
    if (currentStage) {
        console.log(`Завершение этапа: ${currentStage}`);
        stages[currentStage]["exit"]();
    }
    console.log(`Начало этапа: ${stage}`);
    currentStage = stage;
    $(document.body)
        .removeClass(Object.keys(stages).join(" "))
        .addClass(stage);
    stages[stage]["entry"]();
}

stages["auth"]["entry"] = function(){
    nickname = Cookies.get("wscname") || "";
    if (nickname) $("#auth-input").val(nickname);
    socket = new WebSocket("wss://lucors.ru/wschatserver/");
    // socket = new WebSocket("ws://127.0.0.1:9000");
    //Обработчики сокета
    socket.onopen = wssOpen;
    socket.onclose = wssClose;
    socket.onerror = wssError;
    socket.onmessage = wssMessage;
    // Отправка сообщений
    document.getElementById('auth-send').onclick = wssSendName;
    document.getElementById('auth-input').addEventListener('keydown', function (e) {
        if (e.key === "Enter") return wssSendName();
    });
}
stages["auth"]["exit"] = function(){
    $("#auth-error").html("");
    console.log("auth exit ОК");
}
stages["chat"]["entry"] = function(){
    Cookies.set("wscname", nickname);
    hue = nicknameHue(nickname);
    document.getElementById("chat-send-form").style = `filter: hue-rotate(${hue}deg);`;
    // Отправка сообщений
    document.getElementById('chat-send').onclick = wssSendMessage;
    document.getElementById('chat-input').addEventListener('keydown', function (e) {
        if (e.key === "Enter") return wssSendMessage();
    });
}
stages["chat"]["exit"] = function(){
    console.log("chat exit ОК");
}


//-------------------------------------------------------------------------------------------------------
// DOCUMENT READY EVENT
//-------------------------------------------------------------------------------------------------------
$(document).ready(function(){
    setStage("auth");
});