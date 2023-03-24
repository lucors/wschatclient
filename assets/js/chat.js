// CHAT VARIABLES


// CHAT UTILS
function chatNewMem(who) {
    const elem = $("<div>");
    elem.addClass("client")
        .attr("who", who)
        .html(who)
        .css({"filter": `hue-rotate(${nicknameHue(who)}deg)`});
    $("#chat-clients").append(elem);
}
function chatDelMem(who) {
    $(`.client[who="${who}"]`)
        .each((i, elem) => elem.remove());
}
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
function chatSetOnlineCounter(count = "") {
    if (count === "") {
        $("#chat-clients-count-title").html("Офлайн");
        $("#chat-clients-count").html("");
    }
    else {
        $("#chat-clients-count-title").html("Онлайн:");
        $("#chat-clients-count").html(count);
    }
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

// Common wssMessage Handlers
wssMessageHandlers.push({
    mode: "COUNT",
    func: function(message){
        chatSetOnlineCounter(message[1]);
    }
});
wssMessageHandlers.push({
    mode: "CLIENTS",
    func: function(message){
        message[1].forEach(client => {
            chatNewMem(client);
        });
    }
});
wssMessageHandlers.push({
    mode: "DELMEM",
    func: function(message){
        chatDelMem(message[1]);
        chatPutMessage("notify", `${message[1]} отключился`);
    }
});
wssMessageHandlers.push({
    mode: "NEWMEM",
    func: function(message){
        const newMemMsg = `
        <div 
        class="msgwho" 
        style="filter: hue-rotate(${nicknameHue(message[1])}deg);"
        >
        ${message[1]}</div> подключился
        `; 
        chatNewMem(message[1]);
        chatPutMessage("notify", newMemMsg);
    }
});
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
        if (message[1].who !== nickname) type = "outer";
        chatPutMessage(type, message[1].msg, message[1].who);
    }
});



// CHAT Stage Handler
stages["chat"]["entry"] = function(){
    Cookies.set("wscname", nickname);
    hue = nicknameHue(nickname);
    $("#chat-send-form").css({"filter": `hue-rotate(${hue}deg)`})
    // Отправка сообщений
    $("#chat-send").click(wssSendMessage);
    $("#chat-input").on("keydown", function(e) {
        if (e.key === "Enter") return wssSendMessage();
    });
}
stages["chat"]["exit"] = function(){
    if (flags.debug) console.log("chat exit ОК");
}

