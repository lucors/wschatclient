// MEMBERS VARIABLES


// MEMBERS UTILS
function nicknameHue(nick) {
    return (hashCode(nick) + 318) % 360;
}
function chatNewMem(who) {
    const elem = $("<div>");
    elem.addClass("member")
        .attr("who", who)
        .html(who)
        .css({"filter": `hue-rotate(${nicknameHue(who)}deg)`});
    $("#chat-members").append(elem);
}
function chatDelMem(who) {
    $(`.member[who="${who}"]`)
        .each((i, elem) => elem.remove());
}
function setChatOnlineCounter(count = "") {
    if (count === "") {
        $("#chat-members-count-title").html("Офлайн");
        $("#chat-members-count").html("");
    }
    else {
        $("#chat-members-count-title").html("Онлайн:");
        $("#chat-members-count").html(count);
    }
}
function setTotalOnlineCounter(count = "") {
    if (count === "") {
        $("#chat-clients-count-title").html("Офлайн");
        $("#chat-clients-count").html("");
    }
    else {
        $("#chat-clients-count-title").html("Всего онлайн:");
        $("#chat-clients-count").html(count);
    }
}


// MEMBERS wssMessage HANDLERS
wssMessageHandlers.push({
    mode: "COUNT",
    func: function(message){
        setTotalOnlineCounter(message[1]);
    }
});
wssMessageHandlers.push({
    mode: "ROOM_COUNT",
    func: function(message){
        setChatOnlineCounter(message[1]);
    }
});
wssMessageHandlers.push({
    mode: "MEMBERS",
    func: function(message){
        message[1].forEach(member => {
            chatNewMem(member);
        });
    }
});
wssMessageHandlers.push({
    mode: "DEL_MEM",
    func: function(message){
        chatDelMem(message[1]);
        chatPutMessage("notify", `${message[1]} отключился`);
    }
});
wssMessageHandlers.push({
    mode: "NEW_MEM",
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