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
    let This = this
}

/**
 * 获得授权后处理
 * @param confirm: true 表示同意， false表示拒绝
 */
GsRTC.prototype.serverPresentRequest = function (confirm) {
    let This = this
    log.warn('confirm: ', confirm)
    switch (This.serverAction) {
        case 'shareScreenRequest':
            if(confirm){
                This.sharingPermission = 3
                This.shareScreen()
            }else {
                This.sokect.sendMessage({type: This.SIGNAL_EVENT_TYPE.PRESENT_RET, ctrlPresentationRet: This.CODE_TYPE.SHARE_SCREEN_REQUEST_REFUSE})
            }
            break
        case 'stopShareScreenRequest':
            if(confirm){
                This.sharingPermission = 4
                This.stopShareScreen()
            }else {
                This.sokect.sendMessage({type: This.SIGNAL_EVENT_TYPE.PRESENT_RET, ctrlPresentationRet: This.CODE_TYPE.STOP_SHARE_SCREEN_REQUEST_REFUSE})
            }
            break;
        default:
            break
    }
    This.serverAction = null
}


