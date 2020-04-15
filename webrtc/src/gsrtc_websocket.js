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
        This.handleIncomingMessage(event.data)
    }

    ws.onclose = function (event) {
        log.info('websocket onclose')
        This.isChannelOpen = false
    }

    ws.onerror = function (error) {
        log.info('websocket onerror' + error.toString())
    }

    return ws
}

/**
 * 处理收到的 webSocket消息
 * @param message
 */
WebSocketInstance.prototype.handleIncomingMessage = function(message){
    let This = this
    let code = null
    let messageObj = JSON.parse(message)
    let action = Object.keys(messageObj)[0]
    log.info('handleIncomingMessage of: ' + action)
    let data = messageObj[action]
    // if(data.rspInfo){
    //     code = data.rspInfo.rspCode;
    // }
    if(data.errorInfo) {
        code = data.errorInfo.errorId;
    }
    log.info('get code: ' + code)

    switch (action) {
        case gsRTC.SIGNAL_EVENT_TYPE.INVITE_RET.name:
        case gsRTC.SIGNAL_EVENT_TYPE.RE_INVITE_RET.name:
            if(gsRTC.isNxx(2, code)){
                let sdp = data.sdp.data
                log.info(gsRTC.action + ' success')
                gsRTC.RTCSession.handleRemoteSDP(sdp)
            }else if(gsRTC.isNxx(4, code)){
                log.error(code + ', ' + data.errorInfo.message)
                // log.error(code + ', ' + data.rspInfo.rspMsg)
                gsRTC.trigger(gsRTC.action, {
                    codeType: code,
                    message: data.errorInfo.message
                });
            }
            break;
        case gsRTC.SIGNAL_EVENT_TYPE.PRESENT.name:
            // gs_phone请求开演示
            if(data.sendPermission === 2){
                log.warn('receive request to turn off desktop sharing')
                gsRTC.serverAction = 'shareScreenRequest'
                gsRTC.trigger('shareScreenRequest', gsRTC.serverPresentRequest)
            }else if(data.sendPermission === 3){
                log.warn('receive request to turn on desktop sharing')
                gsRTC.serverAction = 'stopShareScreenRequest'
                gsRTC.trigger('stopShareScreenRequest', gsRTC.serverPresentRequest)
            }
            break
        case gsRTC.SIGNAL_EVENT_TYPE.PRESENT_RET.name:
            log.info('present on request ' + code)
            gsRTC.trigger(gsRTC.action, {
                codeType: code,
                message: data.errorInfo.message
            });
            break
        default:
            break
    }
}

/**
 * 根据交互设计协议，发送不同结构体信息
 * @param data
 */
WebSocketInstance.prototype.sendMessage = function (data) {
    let This = this
    if(!This.ws){
        log.warn('websocket has not been created yet to send message')
        return
    }

    let reqId = parseInt(Math.round(Math.random()*100));
    let info = {
        userName: gsRTC.conf.userName,
        reqId: reqId,
    }
    let signalType = data.type.name
    let message = {}
    message[signalType] = info

    if(data.mediaSession){
        info.sdp = {
            length: data.mediaSession.length,
            data: data.mediaSession,
        }
        log.info('Establish or update a session')
    }else if(data.ctrlPresentation){
        info.sendPermission = data.ctrlPresentation.value
        log.info('send present control message: \n' + JSON.stringify(info))
    }else if(data.ctrlPresentationRet){
        info.errorInfo = data.errorInfo
    }

    log.warn("ws send message ");
    This.ws.send(JSON.stringify(message))
}

