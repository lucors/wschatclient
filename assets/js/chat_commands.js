// CHAT COMMANDS HANDLERS
chatCommandsHandlers.push({
    command: "@help",
    admin: false,
    func: function(message){
        let helpText = `
            Доступны следующие команды:<br>
            @blur &lt;text&gt; — <i>отправить размытое сообщение;</i><br>
            @direct &lt;user&gt; &lt;text&gt; — <i>отправить личное сообщение;</i><br>
            @hash &lt;text&gt; — <i>получить хэш строки;</i><br>
        `;
        if (flags.admin) {
            helpText += `
            @notify &lt;text&gt; — <i>отправить уведомление во все каналы;</i><br>
            @rnotify &lt;text&gt; — <i>отправить уведомление в этот канал;</i><br>
            @server &lt;text&gt; — <i>отправить сообщение от лица сервера;</i><br>
            @reconfig — <i>перезагрузить конфигурацию на сервере;</i><br>
            `;
        }
        helpText += ` @help — <i>показать эту справку.</i>`;
        chatPutMessage("server", helpText, {title: "Справка"});
    }
});
chatCommandsHandlers.push({
    command: "@blur",
    admin: false,
    func: function(message){
        message = message.substr(message.indexOf(' ')+1);
        if (message === "") {
            console.warn("Не отправляйте пустые сообщения");
            return false;
        }
        wssSend("MSG_BLUR", message);
    }
});
chatCommandsHandlers.push({
    command: "@direct",
    admin: false,
    func: function(message){
        let whom = message.split(" ");
        if (whom.length < 3) {
            console.warn("Ошибка direct отправки");
            return false;
        }
        //TODO: изменить механизм определения whom и части сообщения
        wssSend("MSG_DIRECT", [whom[1], whom.slice(2).join(" ")]);
    }
});
chatCommandsHandlers.push({
    command: "@hash",
    admin: false,
    func: function(message){
        message = message.substr(message.indexOf(' ')+1);
        chatPutMessage("server", `${message} <br> ${hashCode(message)}`, {
            title: "Хэш строки"
        });
    }
});
chatCommandsHandlers.push({
    command: "@notify",
    admin: true,
    func: function(message){
        broadcast(message.substr(message.indexOf(' ')+1));
    }
});
chatCommandsHandlers.push({
    command: "@rnotify",
    admin: true,
    func: function(message){
        broadcastr(message.substr(message.indexOf(' ')+1));
    }
});
chatCommandsHandlers.push({
    command: "@server",
    admin: true,
    func: function(message){
        message = message.substr(message.indexOf(' ')+1);
        if (message === "") {
            console.warn("Не отправляйте пустые сообщения");
            return false;
        }
        wssSend("MSG_SERVER", message);
    }
});
chatCommandsHandlers.push({
    command: "@reconfig",
    admin: true,
    func: function(message){
        wssSend("RELOAD_CONFIG");
    }
});