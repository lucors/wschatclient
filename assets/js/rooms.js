// ROOMS VARIABLES
let currentRoom = 0;

// ROOMS UTILS
function putRoom(room) {
    const elem = $("<div>");
    elem.addClass("room")
        .attr("rid", room.rid)
        .html(room.title);
    $("#chat-rooms").append(elem);
}
function changeRoom() {
    $("#chat-rooms-error").html("");
    currentRoom = $(this).attr("rid");
    wssSend("ROOM_CHANGE", currentRoom);
}

// ROOMS WEBSOCKET STUFF


// ROOMS wssMessage HANDLERS
wssMessageHandlers.push({
    mode: "ROOMS",
    func: function(message){
        message[1].forEach(room => {
            putRoom(room);
        });
    }
});
wssMessageHandlers.push({
    mode: "ROOM_CHANGE_FAIL",
    func: function(message){
        console.error(`ROOM_CHANGE_FAIL: ${message[1]}`);
        $("#chat-rooms-error").html(message[1]);
    }
});
wssMessageHandlers.push({
    mode: "ROOM_CHANGE_OK",
    func: function(message){
        $("#chat-messages, #chat-clients").empty();
        $("#chat-rooms .room").removeClass("current");
        $(`.room[rid=${message[1]}]`).addClass("current");
    }
});


// ROOMS STAGE HANDLERS
// ROOMS uses CHAT stage