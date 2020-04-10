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
    let messageObj = JSON.parse(message)
    let action = Object.keys(messageObj)[0]
    log.info('handleIncomingMessage of: ' + action)
    let code = null
    if(messageObj.errorInfo){
        code = messageObj.errorInfo.errorId;
    }

    switch (action) {
        case gsRTC.SIGNAL_EVENT_TYPE.INVITE_RET.name:
        case gsRTC.SIGNAL_EVENT_TYPE.RE_INVITE_RET.name:
            // gs_phone的主动呼叫和主动更新会话信息，目前没有实现，但是需要考虑
            if(gsRTC.isNxx(2, code)){
                let sdp = messageObj.sdp.data
                gsRTC.RTCSession.handleRemoteSDP(sdp)
            }else if(gsRTC.isNxx(4, code)){
                log.error(code + ', ' + messageObj.errorInfo.message)
            }
            break;
        case gsRTC.SIGNAL_EVENT_TYPE.PRESENT.name:
            // gs_phone请求开演示
            if(messageObj.sendPermission === 2){
                log.warn('receive request to turn off desktop sharing')
                stopScreen()
            }else if(messageObj.sendPermission === 3){
                log.warn('receive request to turn on desktop sharing')
                beginScreen()
            }
            break
        case gsRTC.SIGNAL_EVENT_TYPE.PRESENT_RET.name:
            if(gsRTC.isNxx(2, code)){
                log.info('present on request success')
            }else if(gsRTC.isNxx(4, code)){
                log.warn('present on request error')
                log.error('present on request error: ' + messageObj.errorInfo.message)
            }
            break
        case gsRTC.SIGNAL_EVENT_TYPE.MESSAGE.name:
            break
        case gsRTC.SIGNAL_EVENT_TYPE.MESSAGE_RET.name:
            break
        case gsRTC.SIGNAL_EVENT_TYPE.UPDATE_USER_INFO.name:
            break
        case gsRTC.SIGNAL_EVENT_TYPE.UPDATE_USER_INFO_RET.name:
            break
        case gsRTC.SIGNAL_EVENT_TYPE.UPDATE_CANDIDATE_INFO.name:
            break
        case gsRTC.SIGNAL_EVENT_TYPE.UPDATE_CANDIDATE_INFO_RET.name:
            break
        case gsRTC.SIGNAL_EVENT_TYPE.BYE.name:
            break
        case gsRTC.SIGNAL_EVENT_TYPE.BYE_RET.name:
            break
        default:
            break
    }

    gsRTC.trigger(gsRTC.action, {codeType: code});
    gsRTC.action = null
}

/**
 * 处理共享信令：摄像头或桌面共享
 */
WebSocketInstance.prototype.handleSharingSignal = function(){
    let This = this
    log.info('handle signal')
    if(gsRTC.isNonInviteSignalNeed){
        let permission = {
            value: gsRTC.sharingPermission
        }
        log.info('prepare send control signal: ' + permission.value)
        This.sendMessage({type: gsRTC.SIGNAL_EVENT_TYPE.PRESENT, permission})

        gsRTC.isNonInviteSignalNeed = false
        gsRTC.sharingPermission = gsRTC.sharingPermission ? 0 : 1
    }
}

/**
 * 根据交互设计协议，发送不同结构体信息
 * @param data
 */
WebSocketInstance.prototype.sendMessage = function (data) {
    if(!this.ws){
        log.warn('websocket has not been created yet to send message')
        return
    }

    let reqId = parseInt(Math.round(Math.random()*100));
    let info = {
        userName: gsRTC.conf.userName,
        reqId: reqId,
    }

    if(data.sdp){
        // invite 或 re-invite
        info.sdp = {
            length: data.sdp.length,
            data: data.sdp,
        }
        log.info('Establish or update a session')
    }else if(data.permission){
        // 开演示或关演示
        info.sendPermission = data.permission.value
        log.info('send present control message: \n' + JSON.stringify(info))
    }else if(data.messageContent){
        // 发送message消息
        Object.keys(content).forEach(function(index) {
            info[index] = content[index]
        });
        log.info('send message')
    }else if(data.userInfo){
        // 更新用户信息
        info.userInfo = data.userInfo
        log.info('client update user info')
    }else if(data.candidates){
        // trickle-ice时，发送收集的candidate
        info.mid = data.mid
        info.candidates = data.candidates
        log.info('trickle-ice, send candidates')
    }

    log.warn("ws send message ");
    let type = data.type.name
    let message = {}
    message[type] = info
    this.ws.send(JSON.stringify(message))
}

