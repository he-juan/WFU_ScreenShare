/**
 * Event registration
 */
GsRTC.prototype.eventBindings = function(){
    log.info('event binding.')
    this.on('onEventStack', this.eventStack)
}

/**
 * event stack 所有回调调用触发的地方
 * @param event
 */
GsRTC.prototype.eventStack = function(event){
    switch (event.type) {
        case 'GET_LO_SUCCESS':
            if(this.inviteProcessing === false){
                let sdp = this.RTCSession.getDecorateSdp()
                // Save the session version, plus one for each re-invite
                this.saveSDPSessionVersion(sdp)
                if(window.wfu){
                    console.warn("sendMessage sdp\n" ,sdp)
                    this.sokect.sendMessage(sdp)
                }else {
                    this.sipStack.sendSipMessage(sdp)
                }
            }else {
                log.info('exist invite in processing..')
            }

            break
        case '491_INVITE_CONFLICT':
            this.RTCSession.rollbackOperation()
            break
        default:
            log.info('eventStack null: ', event.type)
            break
    }
}

GsRTC.prototype.handleIncomingMessage = function (event) {
    /* Server reply message */
    if(event.data.isrsp){
        log.info("receive server response: " + event.data.method + ' , code ' + event.data.code)
        let code = event.data.code
        switch (event.data.method) {
            case 'REGISTER':
                if(this.EVENTS[this.action]){
                    this.trigger(this.action, {codeType: code});
                }
                break
            case 'INVITE':
                if(code === 200){
                    this.sipStack.jsSipSendAck()
                    this.isSendReInvite = true
                    let sdp = event.data.body
                    this.RTCSession.commonDecorateRo(sdp)

                    if(this.EVENTS[this.action]){
                        this.sendInviteQueue.shift()
                        this.trigger(this.action, {codeType: code});
                    }
                }else if(code === 491){
                    this.eventStack({type: '491_INVITE_CONFLICT'})
                }
                break
            case 'INFO':
                if(this.EVENTS[this.action]){
                    this.trigger(this.action,{codeType: code})
                }
                break
            case 'BYE':
                log.info('Receive server bye, location reload.')
                // window.location.reload(true)
                break
            default:
                log.warn('Other method: '+ event.data)
                break
        }
    }else {
        /* Server request message */
        log.info("handle server request: " + event.data.method)
        switch (event.data.method) {
            case 'INVITE':
                this.transaction = event.data.transaction
                this.isRecvRequest = true
                this.RTCSession.handleOffer(event.data.body)
                break
            case 'ACK':
                log.info('handle offer success')
                if(this.EVENTS[this.action]){
                    this.trigger(this.action, {codeType: this.CODE_TYPE.ACTION_SUCCESS});
                }
                break
            case 'BYE':
                log.info('Receive Server BYE!')
                break
            default:
                log.warn('request message.data.method: '+ event.data.method)
                break
        }
    }
}

/**
 * Message sending mechanism:
 * 1、Call sip interface
 * 2、sip interface returns data
 * 3、webSocket send data
 * @param event
 */
GsRTC.prototype.onmessage = function (event) {
    log.info('GsRTC: handle incoming message.')
    let content = event.data

    if( event.data === "\r\n"){
        /* websocket保活包 */
    }else {
        switch (content.cmd) {
            case 'functionReturn':
                break
            case 'sendMessage':
                this.sokect.sendMessage(event.data.msg)
                break
            case 'recvSipMessage':
                this.handleIncomingMessage(event)
                break
            default:
                log.info('handle non sip message: ', event.data)
                break
        }
    }
}


