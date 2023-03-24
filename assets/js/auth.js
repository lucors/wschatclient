// CHAT VARIABLES


// CHAT UTILS


// CHAT WEBSOCKET STUFF
function wssSendName() {
    nickname = $("#auth-input").val();
    nickname = nickname.slice(0, 50);
    if (nickname === "") {
        $("#auth-error").html("Введите имя");
        return;
    };
    wssSend("NEWMEM", {who: nickname});
}

// Common wssMessage Handlers
wssMessageHandlers.push({
    mode: "NEWMEM_CHANGE_NICK",
    func: function(message){
        console.error(`NEWMEM_CHANGE_NICK: ${message[1]}`);
        nickname = "";
        $("#auth-error").html("Имя занято. Введите другое имя");
    }
});
wssMessageHandlers.push({
    mode: "NEWMEM_OK",
    func: function(message){
        setStage("chat"); 
    }
});


// AUTH Stage Handler
stages["auth"]["entry"] = function(){
    nickname = Cookies.get("wscname") || "";
    if (nickname) $("#auth-input").val(nickname);
    wssConnect();
}
stages["auth"]["exit"] = function(){
    $("#auth-error").html("");
    $("#auth-send").off("click");
    $(document.body).off("keydown");
}