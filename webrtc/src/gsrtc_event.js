var log = {};
log.debug = window.debug("GSRTC_EVENT:DEBUG");
log.log = window.debug("GSRTC_EVENT:LOG");
log.info = window.debug("GSRTC_EVENT:INFO");
log.warn = window.debug("GSRTC_EVENT:WARN");
log.error = window.debug("GSRTC_EVENT:ERROR");
/*Log Debug End*/

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
    let This = this
    switch (event.type) {
        case 'GET_LO_SUCCESS':
            let sdp = This.RTCSession.decorateLocalSDP()
            // Save the session version, plus one for each re-invite
            this.saveSDPSessionVersion(sdp)

            let data = {
                type: gsRTC.isSendReInvite ? gsRTC.SIGNAL_EVENT_TYPE.RE_INVITE : gsRTC.SIGNAL_EVENT_TYPE.INVITE,
                sdp: sdp
            }
            This.sokect.sendMessage(data)
            break
        default:
            log.info('eventStack null: ', event.type)
            break
    }
}


