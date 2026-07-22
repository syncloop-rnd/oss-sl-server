function openAgentChat(agentID, prompt, chatID, enableInternetGrounding, chatTitle, listenTranscripts, listenResult, onClose, onError) {
    var wsUrl = window.ENV.WS_BASE_URL + '/ws/tenant/' + localStorage.getItem("tenant") + '/packages.Awareness.assistant.api.chat.main'
                + "?access_token=" + encodeURIComponent(localStorage.getItem("AuthToken"));
    var socket = new WebSocket(wsUrl);

    const payload = {
        "*payload": {
            "agentID": agentID,
            "prompt": prompt,
            "chatID": chatID,
            "enableInternetGrounding": enableInternetGrounding,
            "chatTitle": chatTitle
        }
    };

    let count = 0;
    let lastMessage = "";
    let conversationID = "";
    let messageId = "";

    socket.onopen = () => {
        socket.send(JSON.stringify(payload));
    };

    socket.onmessage = (event) => {

        const data = JSON.parse(event.data || '{}');

        if (Object.keys(data).length == 1) {
            conversationID = data.conversationChatID;
            return ;
        }

        if (data.tID) {
            messageId = data.tID;
        }
        lastMessage = event.data;

        listenTranscripts(lastMessage);
        count++;
    };

    socket.onclose = () => {
        listenResult(lastMessage, conversationID, messageId);
        onClose();
    };

    socket.onerror = (error) => {
        console.log(error)
        onError(error);
    };
}

function openTeamChat(payloadObj, listenTranscripts, listenResult, onClose, onError) {
    var wsUrl = window.ENV.WS_BASE_URL + '/ws/tenant/' + localStorage.getItem("tenant") +  "/packages.syncloopai.assistant.teams.executeTeam.main"
        + "?access_token=" + encodeURIComponent(localStorage.getItem("AuthToken"));
    var socket = new WebSocket(wsUrl);

    const payload = { "*payload": payloadObj };

    if (payloadObj && payloadObj.chatTitle) {
        payload["*payload"]["chatTitle"] = payloadObj.chatTitle;
    }

    let count = 0;
    let lastMessage = "";
    let conversationID = "";
    let messageId = "";

    socket.onopen = () => {
        socket.send(JSON.stringify(payload));
    };

    socket.onmessage = (event) => {

        const data = JSON.parse(event.data || '{}');

        if (Object.keys(data).length == 1) {
            conversationID = data.conversationChatID;
            return ;
        }

        if (data.tID) {
            messageId = data.tID;
        }

        lastMessage = event.data;
        if (count > 0) {
            listenTranscripts(lastMessage);
        }
        count++;
    };

    socket.onclose = () => {
        listenResult(lastMessage, conversationID, messageId);
        onClose();
    };

    socket.onerror = (error) => {
        onError(error);
    };
}

/*

openAgentChat("690e190c-77c8-45df-8b1a-72249a2d2b37", "Hi", null, function(msg) {
    console.log("TSCP " + msg);
},
function(msg) {
    console.log("Result " + msg);
}
, function() {}, function() {});

 */
function openAgentExecuteChat(payloadObj, listenTranscripts, listenResult, onClose, onError) {
    var wsUrl = window.ENV.WS_BASE_URL + '/ws/tenant/' + localStorage.getItem("tenant") +  "/packages.syncloopai.assistant.agents.executeAgent.main"
        + "?access_token=" + encodeURIComponent(localStorage.getItem("AuthToken"));
    var socket = new WebSocket(wsUrl);

    const payload = {"*payload": payloadObj};
    let count = 0;
    let lastMessage = "";
    let conversationID = "";
    let messageId = "";

    socket.onopen = () => {
        socket.send(JSON.stringify(payload));
    };

    socket.onmessage = (event) => {

        const data = JSON.parse(event.data || '{}');

        if (Object.keys(data).length == 1) {
            conversationID = data.conversationChatID;
            return ;
        }

        if (data.tID) {
            messageId = data.tID;
        }
        lastMessage = event.data;
        if (count > 0) {
            listenTranscripts(lastMessage);
        }
        count++;
    };

    socket.onclose = () => {
        listenResult(lastMessage, conversationID, messageId);
        onClose();
    };

    socket.onerror = (error) => {
        onError(error);
    };
}

function openAppChat(payloadObj, listenTranscripts, listenResult, onClose, onError) {
    var wsUrl = window.ENV.WS_BASE_URL + '/ws/tenant/' + localStorage.getItem("tenant") + "/packages.syncloopai.assistant.apps.executeApp.main?appId=" + payloadObj.appId
        + "&access_token=" + encodeURIComponent(localStorage.getItem("AuthToken"));
    var socket = new WebSocket(wsUrl);

    const payload = {
        "*payload": { prompt: payloadObj.prompt },
        "appId": payloadObj.appId
    };

    if (payloadObj && payloadObj.chatTitle) {
        payload["*payload"]["chatTitle"] = payloadObj.chatTitle;
    }

    let count = 0;
    let lastMessage = "";
    let conversationID = "";
    let messageId = "";

    socket.onopen = function () {
        try {
            socket.send(JSON.stringify(payload));
        } catch (err) {
            console.error("openAppChat send error:", err);
        }
    };

    socket.onmessage = function (event) {

        const data = JSON.parse(event.data || '{}');

        if (Object.keys(data).length == 1) {
            conversationID = data.conversationChatID;
            return ;
        }

        if (data.tID) {
            messageId = data.tID;
        }
        lastMessage = event.data;
        if (typeof listenTranscripts === "function") listenTranscripts(lastMessage);
        count++;
    };

    socket.onclose = function () {
        if (typeof listenResult === "function") listenResult(lastMessage, conversationID, messageId);
        if (typeof onClose === "function") onClose();
    };

    socket.onerror = function (error) {
        if (typeof onError === "function") onError(error);
        else console.error("openAppChat WebSocket error:", error);
    };

    return socket;
}
