/*Log Debug Start*/
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
        log.warn('onmessage: ', event.data)
        This.handleIncomingMessage(event.data)
    }

    ws.onclose = function (event) {
        log.info('websocket onclose')
        log.error(event)
        This.isChannelOpen = false
    }

    ws.onerror = function (event) {
        log.info('websocket onerror')
        console.warn(event)
    }

    return ws
}

/**
 * 处理收到的 webSocket消息
 * @param data
 */
WebSocketInstance.prototype.handleIncomingMessage = function(data){
    let dataType = Object.prototype.toString.call(data)
    let parseDate = JSON.parse(data)
    window.parseDate = parseDate
    switch (dataType) {
        case '[object String]':
            Object.keys(parseDate).forEach(function(action) {
                let code = parseDate[action].errorInfo.errorId
                if(gsRTC.isNxx(2, code)){
                    if(parseDate[action].sdp) {
                        let sdp = parseDate[action].sdp.data
                        gsRTC.RTCSession.handleRemoteSDP(sdp)
                    }
                }else if(gsRTC.isNxx(4, code)){
                    log.warn('receive 4xx: ' + code)
                }

                gsRTC.trigger(gsRTC.action, {codeType: code});
                gsRTC.off(gsRTC.action)     // 事件监听完成后，删除该回调事件
                gsRTC.action = null
            });
            break
        default:
            log.warn("event.data type: ", dataType)
            break
    }
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
        let reqId = parseInt(Math.round(Math.random()*100));
        let content = {
            userName: "wfu_test",
            reqId: reqId,
            sdp: {
                length: message.length,
                data: message,
            }
        }

        let data = gsRTC.isSendReInvite ? {updateMediaSession: content} : {createMediaSession: content}
        log.warn("ws send message: " , data);
        this.ws.send(JSON.stringify(data))
    }catch (e) {
        console.error(e)
        log.error(e)
    }
}

