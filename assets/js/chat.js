// CHAT VARIABLES


// CHAT UTILS
function chatPutMessage(type, msgtext, msgwho = "") {
    const elem = $("<div>");
    elem
        .html("")
        .addClass("msg");
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


// CHAT WEBSOCKET STUFF
function wssSendMessage() {
    if (nickname === "") return;
    let message = $("#chat-input").val().slice(0, 2000);
    if (message === "") {
        console.warn("Не отправляйте пустые сообщения");
        return false;
    }
    wssSend("MSG", {msg: message});
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
        var type = "self";
        if (message[1][0] !== nickname) type = "outer";
        chatPutMessage(type, message[1][1], message[1][0]);
    }
});
wssMessageHandlers.push({
    mode: "HISTORY",
    func: function(message){
        message[1].forEach(data => {
            var type = "self";
            if (data[0] !== nickname) type = "outer";
            chatPutMessage(type, data[1], data[0]);
        });
    }
});


// CHAT STAGE HANDLERS
stages["chat"]["entry"] = function(){
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