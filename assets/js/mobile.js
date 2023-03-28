// MOBILE VARIABLES


// MOBILE UTILS
function toggleRooms() {
    $("#mems-wrapper").removeClass("active");
    if (!$("#rooms-wrapper, #mems-wrapper").hasClass("active")) {
        $("#chat-wrapper").addClass("hide");
    }
    else {
        $("#chat-wrapper").removeClass("hide");
    }
    $("#rooms-wrapper").toggleClass("active");
}
function toggleMembers() {
    $("#rooms-wrapper").removeClass("active");
    if (!$("#rooms-wrapper, #mems-wrapper").hasClass("active")) {
        $("#chat-wrapper").addClass("hide");
    }
    else {
        $("#chat-wrapper").removeClass("hide");
    }
    $("#mems-wrapper").toggleClass("active");
}
function mobilePrepare() {
    $("#action-rooms").click(toggleRooms);
    $("#action-members").click(toggleMembers);
}