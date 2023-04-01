// CHAT VARIABLES


// CHAT UTILS
function chatPutMessage(type, msgtext, msgwho = "", spec = 0) {
    const elem = $("<div>");
    elem
        .html("")
        .addClass("msg");
    switch (spec) {
        case 1:
            elem.addClass("direct");
            break;
        case 2: 
            elem.addClass("blur");
            break;
        default:
            break;
    }
    switch (type) {
        case "self":
            elem.css({"filter": `hue-rotate(${hue}deg)`});
            break;
        case "outer": 
            elem
                .css({"filter": `hue-rotate(${nicknameHue(msgwho)}deg)`})
                .addClass("outer");
            break;
        case "notify":
            elem.addClass("notify");
            break;
        default:
            break;
    }

    if (msgwho !== "") {
        let msgtitle = `<div class="msgtitle">`
        msgtitle += `<div class="msgwho">${msgwho}</div>`;
        if (type !== "notify") {
            msgtitle += `<div class="msgtime">${currentDatetime()}</div>`;
        }
        msgtitle += `</div>`;
        elem.html(msgtitle);
    }
    elem.html(elem.html() + `<div class="msgtext">${msgtext}</div>`);
    $("#chat-messages").append(elem);
    scrollToBottom("#chat-messages");
}
function getMessageDir(who) {
    var dir = "self";
    if (who !== nickname) dir = "outer";
    return dir;
}


// CHAT WEBSOCKET STUFF
function wssSendMessage() {
    if (nickname === "") return;
    let message = $("#chat-input").val().slice(0, 2000);
    if (message === "") {
        console.warn("Не отправляйте пустые сообщения");
        return false;
    }

    if (/^@blur/g.test(message)) {
        message = message.substr(message.indexOf(' ')+1);
        if (message === "") {
            console.warn("Не отправляйте пустые сообщения");
            return false;
        }
        wssSend("MSG_BLUR", message);
    }
    else if (/^@direct/g.test(message) || /^@dir/g.test(message)) {
        let whom = message.split(" ");
        if (whom.length < 3) {
            console.warn("Ошибка direct отправки");
            return false;
        }
        //TODO: изменить механизм определения whom и части сообщения
        wssSend("MSG_DIRECT", [whom[1], whom.slice(2).join(" ")]);
    }
    else {
        wssSend("MSG", message);
    }
    $("#chat-input").val("");
    return true;
}

// CHAT wssMessage HANDLERS
wssMessageHandlers.push({
    mode: "NOTIFY",
    func: function(message){
        chatPutMessage("notify", message[1]);
    }
});
wssMessageHandlers.push({
    mode: "MSG",
    func: function(message){
        chatPutMessage(getMessageDir(message[1][0]), message[1][1], message[1][0]);
    }
});
wssMessageHandlers.push({
    mode: "MSG_DIRECT",
    func: function(message){
        const who = `${message[1][0]} => ${message[1][1]}`;
        chatPutMessage(getMessageDir(message[1][0]), message[1][2], who, 1);
    }
});
wssMessageHandlers.push({
    mode: "MSG_BLUR",
    func: function(message){
        chatPutMessage(getMessageDir(message[1][0]), message[1][1], message[1][0], 2);
    }
});
wssMessageHandlers.push({
    mode: "HISTORY",
    func: function(message){
        message[1].forEach(data => {
            chatPutMessage(getMessageDir(data[0]), data[1], data[0]);
        });
    }
});


// CHAT STAGE HANDLERS
stages["chat"]["entry"] = function(){
    pingInterval = setInterval(()=> {
        wssSend("PING");
    }, 600*1000);

    Cookies.set("wscname", nickname);
    hue = nicknameHue(nickname);
    $("#chat-send-form").css({"filter": `hue-rotate(${hue}deg)`});
        
    // Отправка сообщений
    $("#chat-send").click(wssSendMessage);
    $("#chat-input").on("keydown", function(e) {
        if (e.key === "Enter") return wssSendMessage();
    });

    // Выбор комнаты
    $("#chat-rooms .room").click(changeRoom);
}
stages["chat"]["exit"] = function(){
    if (flags.debug) console.log("chat exit ОК");
}