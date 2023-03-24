let nickname = "";
let hue = 0;
let socket = null;
let wssMessageHandlers = []; //[{mode: string, func: function()},...]
let currentStage = null;
let stages = {
    "auth": {
        entry: null,
        exit: null,
    },
    "rooms": {
        entry: null,
        exit: null,
    },
    "chat": {
        entry: null,
        exit: null,
    },
};
let flags = {
    debug: false
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
function scrollToBottom(selector) {
    $(selector).each((i, elem) => {
        elem.scrollTop = elem.scrollHeight;
    });
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
function wssConnect() {
    if (flags.debug){
        socket = new WebSocket("ws://127.0.0.1:9000");
    }
    else {
        socket = new WebSocket("wss://lucors.ru/wschatserver/");
    }
    //Обработчики сокета
    socket.onopen = wssOpen;
    socket.onclose = wssClose;
    socket.onerror = wssError;
    socket.onmessage = wssMessage;
}


//-------WEBSOCKET INCOMING HANDLERS-------
function wssOpen() {
    $("#auth-send").click(wssSendName);
    $(document.body).on("keydown", function (e) {
        if (!$(document.body).hasClass("auth")) return;
        if (e.key === "Enter") return wssSendName();
        $("#auth-input").focus();
    });
}
function wssClose(event) {
    if ($("#auth-error").html() !== "Ошибка соединения"){
        $("#auth-error").html("Соединение закрыто. Обновите страницу");
    }
    console.warn("Соединение закрыто");
    chatPutMessage("notify", "Соединение закрыто");
    chatSetOnlineCounter();
}
function wssError(event) {
    $("#auth-error").html("Ошибка соединения");
    console.error("Ошибка WebSocket");
    chatPutMessage("notify", "Ошибка WebSocket");
    socket.close();
}
function wssMessage(event) {
    try {
        if (flags.debug) console.log(`Получено: ` + event.data);
        const message = JSON.parse(event.data);
        _done = false;
        wssMessageHandlers.forEach(handler => {
            if (handler.mode == message[0]) {
                handler.func(message);
                _done = true;
                return;
            }
        });
        if (!_done) {
            console.error(`Ошибка обработки сообщения. mode: ${message[0]}`);
        }
    }
    catch (error) {
        console.error("Ошибка: ", error);
    }
}
function wssSend(mode, data = undefined) {
    let msg = [mode];
    if (data) msg.push(data);
    return socket.send(JSON.stringify(msg))
}


// Обработка этапов
function setStage(stage) {
    if (!(stage in stages)) return;
    if (currentStage) {
        if (flags.debug) console.log(`Завершение этапа: ${currentStage}`);
        if (!stages[currentStage]["exit"]) {
            console.error(`Не описан обязательный обработчик для события exit, этап: ${currentStage}`);
            return;
        }
        stages[currentStage]["exit"]();
    }
    if (flags.debug) console.log(`Начало этапа: ${stage}`);
    currentStage = stage;
    $(document.body)
        .removeClass(Object.keys(stages).join(" "))
        .addClass(stage);
    if (!stages[stage]["entry"]) {
        console.error(`Не описан обязательный обработчик для события entry, этап: ${stage}`);
        return;
    }
    stages[stage]["entry"]();
}

// Common wssMessage Handlers
wssMessageHandlers.push({
    mode: "ERROR",
    func: function(message){
        console.error(`SERVER ERROR: ${message[1]}`);
    }
});