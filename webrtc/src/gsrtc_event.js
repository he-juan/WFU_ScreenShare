var log = {};
log.debug = window.debug("GSRTC_EVENT:DEBUG");
log.log = window.debug("GSRTC_EVENT:LOG");
log.info = window.debug("GSRTC_EVENT:INFO");
log.warn = window.debug("GSRTC_EVENT:WARN");
log.error = window.debug("GSRTC_EVENT:ERROR");
/*Log Debug End*/

/**
 * Open to upper-level event registration interface
 * eventType：Event type
 * handerFun：User-defined processing functions
 */
GsRTC.prototype.addSipEventHandler = function(eventType,handlerFun){
    this.preInit();
    if (window.gsRTC){
        window.gsRTC.on(eventType,handlerFun);
        window.gsRTC.handlerFuns[eventType] = handlerFun;
    }else {
        log.error("ERR_NOT_INITIALIZED: Engine not initialized yet. Please create gsRTC first");
    }
}

/**
 * Event registration
 */
GsRTC.prototype.eventBindings = function(){
    log.info('event binding.')
    let This = this
    this.on('onEventStack', This.eventStack)
    this.on('serverPresentRequest', This.serverPresentRequest)
}

/**
 * event stack 所有回调调用触发的地方
 * @param event
 */
GsRTC.prototype.eventStack = function(event){

}


GsRTC.prototype.serverPresentRequest = function (data) {
    let This = this
    log.warn('data: ', data)
    switch (This.serverAction) {
        case 'presentTurnOffRequest':
            if(data.permission){
                stopScreen()
            }else {
                let rspInfo = {
                    // rspCode: 700,
                    // rspMsg: 'Present turn Off request denied',
                    errorId: 700,
                    message: 'Present turn Off request denied'
                }
                This.sokect.sendMessage({type: gsRTC.SIGNAL_EVENT_TYPE.PRESENT_RET, rspInfo})
                This.serverAction = null
            }
            break;
        case 'presentTurnOnRequest':
            if(data.permission){
                beginScreen()
            }else {
                let rspInfo = {
                    // rspCode: 701,
                    // rspMsg: 'Present turn On Request denied',
                    errorId: 701,
                    message: 'Present turn On Request denied'
                }
                This.sokect.sendMessage({type: gsRTC.SIGNAL_EVENT_TYPE.PRESENT_RET, rspInfo})
                This.serverAction = null
            }
            break
        default:
            break
    }
}


