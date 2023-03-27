// AUTH VARIABLES


// AUTH UTILS


// AUTH WEBSOCKET STUFF
function wssSendName() {
    nickname = $("#auth-input").val();
    nickname = nickname.slice(0, 50);
    if (nickname === "") {
        $("#auth-error").html("Введите имя");
        return;
    };
    wssSend("AUTH", {who: nickname});
}

// AUTH wssMessage HANDLERS
wssMessageHandlers.push({
    mode: "AUTH_FAIL",
    func: function(message){
        console.error(`AUTH_FAIL: ${message[1]}`);
        nickname = "";
        $("#auth-error").html(message[1]);
    }
});
wssMessageHandlers.push({
    mode: "AUTH_OK",
    func: function(message){
        setStage("chat"); 
    }
});


// AUTH STAGE HANDLERS
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