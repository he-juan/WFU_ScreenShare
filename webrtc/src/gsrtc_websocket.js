/*Log Debug Start*/
/**
 * @param {Function} debug The function that handles the DEBUG level logs.
 * @param {Function} log The function that handles the LOG level logs.
 * @param {Function} info The function that handles the INFO level logs.
 * @param {Function} warn The function that handles the WARN level logs.
 * @param {Function} error The function that handles the ERROR level logs.
 * @type {{warn: *, debug: *, log: *, error: *, info: *}}
 */
var log = {
    debug: window.debug("WebSocket:DEBUG"),
    log: window.debug("WebSocket:LOG"),
    info: window.debug("WebSocket:INFO"),
    warn: window.debug("WebSocket:WARN"),
    error: window.debug("WebSocket:ERROR")
};
/*Log Debug End*/

/**
 * create webSocket instance
 * @param url
 * @param protocol such as sip
 * @returns {WebSocket|*}
 * @constructor
 */
let WebSocketInstance = function (url, protocol) {
    log.info('create new webSocket.')
    if (GsRTC.prototype.tskStringIsNullOrEmpty(url)) {
        throw new Error("ERR_INVALID_PARAMETER_VALUE: '" + url + "' is not valid as webSocket url value");
    }
    if (GsRTC.prototype.tskStringIsNullOrEmpty(protocol)) {
        throw new Error("ERR_INVALID_PARAMETER_VALUE: '" + protocol + "' is not valid as protocol value");
    }

    if(this instanceof WebSocketInstance){
        this.isChannelOpen = false
        this.ws = this.createWebSocket(url, protocol)
    }else {
        return new WebSocketInstance()
    }
}

/**
 * create new webSocket
 * @param url
 * @param protocols
 * @returns {WebSocket}
 */
WebSocketInstance.prototype.createWebSocket = function(url, protocols){
    log.info('create webSocket')
    if (GsRTC.prototype.tskStringIsNullOrEmpty(url)) {
        throw new Error("ERR_INVALID_PARAMETER_VALUE: '" + url + "' is not valid as webSocket url value");
    }

    let This = this
    log.info('Connecting to \'' + url);
    let ws = new WebSocket(url, protocols)
    ws.onopen = function (event) {
        log.info('websocket onopen')
        This.isChannelOpen = true;
    }

    ws.onmessage = function (event) {
        // if (typeof (event.data) === 'string') {
        //     jsSipParser(event.data, 0)
        // }

        // for wfu
        if (isJsonString(event.data)) {
            let parseDate = JSON.parse(event.data)
            console.warn("************ onmessage parseDate: ", parseDate)
            if (parseDate.createMediaSessionRet && parseDate.createMediaSessionRet.sdp && parseDate.createMediaSessionRet.sdp.data) {
                role = ''
                let sdp  = parseDate.createMediaSessionRet.sdp.data
                console.warn('get createMediaSessionRet sdp: \n', sdp)
                gsRTC.RTCSession.commonDecorateRo(sdp)
            }
        } else {
            let type = typeJudgement(event.data)
            console.warn("event.data type: ", type)
        }
    }

    ws.onclose = function (event) {
        log.info('websocket onclose')
        console.warn(event)
        This.isChannelOpen = false
    }

    ws.onerror = function (event) {
        log.info('websocket onerror')
        console.warn(event)
    }

    return ws
}


/**
 * send message
 * @param message
 */
WebSocketInstance.prototype.sendMessage = function (message) {
    try {
        if(!this.ws){
            log.warn('websocket has not been created yet to send message')
            return
        }

        // for wfu
        if(window.wfu === true){
            let reqId = parseInt(Math.round(Math.random()*100));
            console.warn("random req id is" + reqId);
            let data = {
                createMediaSession: {
                    userName: "wfu_test",
                    reqId: reqId,
                    sdp: {
                        length: message.length,
                        data: message,
                    }
                }
            }
            log.warn("ws send message: " , data);
            this.ws.send(JSON.stringify(data))
        }else {
            this.ws.send(message)
        }
    }catch (e) {
        console.error(e)
        log.error(e)
    }
}

