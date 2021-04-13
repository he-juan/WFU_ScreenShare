
/**
 * get local sdp
 * @returns {*}
 */
PeerConnection.prototype.decorateLocalSDP = function () {
    log.info('get local peers combine sdp')
    let This = this
    log.warn("decorate multi stream Peer sdp ")

    let sdp = This.peerConnection.localDescription.sdp
    sdp = gsRTC.adjustOrderOfMLines(sdp)
    sdp = gsRTC.removeSSRC(sdp)
    sdp = gsRTC.deleteCodeByName(sdp)


    log.info('get local sdp:\n' + sdp.toString())
    return sdp
}

/**
 * decorate remote sdp
 * @param sdp
 */
PeerConnection.prototype.handleRemoteSDP  = function(sdp){
    log.info('handle remote sdp')
    let This = this
    if(!sdp){
        log.error("commonDecorateRo: Invalid Argument");
        return;
    }

    sdp = gsRTC.setXgoogleBitrate(sdp, 10240)
    sdp = This.modifiedMidBeforeSetRemoteSDP(sdp)
    sdp = This.modifyProfile(sdp)
    This.setRemote(sdp)
    This.isSendReInvite = true

}

/**
 * setRemote前，修改mid为原本值
 * @param sdp
 * @returns {*}
 */
PeerConnection.prototype.modifiedMidBeforeSetRemoteSDP = function (sdp) {
    let This = this
    let mediaArray = []
    let parseSDP = SDPTools.parseSDP(sdp)
    let type
    let mLineOrder = This.mLineOrder

    // TODO: 要保持m行顺序
    for(let i=0; i< parseSDP.media.length; i++){
        type = parseSDP.media[i].type
        if(parseSDP.media[i].type !== 'audio'){
            if(!parseSDP.media[i].content){
                let mid = parseSDP.media[i].mid
                type = gsRTC.getTypeByMid(mid)
                parseSDP.media[i].content = type
            }else {
                type = parseSDP.media[i].content
            }
            log.info("current type: " + type)
        }
        parseSDP.media[i].mid =  gsRTC.getOriginalMid(type)

        for(let j in mLineOrder){
            if(type === mLineOrder[j]){
                mediaArray[j] = parseSDP.media[i]
            }
        }

        if(type=== 'slides' && !This.initialResolution){
            This.initialResolution = {}
            if(parseSDP.media[i].framerate){
                This.initialResolution.framerate = parseSDP.media[i].framerate
            }
            for(let fmtpItem of parseSDP.media[i].fmtp){
                if(fmtpItem.config.indexOf('profile-level-id') >= 0){
                    let levelIdc = fmtpItem.config.substr(21, 2).toLowerCase()
                    let resolution = {}
                    switch (levelIdc) {
                        case '15':
                            resolution = {width: 480, height: 272}
                            break;
                        case '16':
                            resolution = {width: 640, height: 360}
                            break;
                        case '1e':
                            resolution = {width: 848, height: 480}
                            break;
                        case '1f':
                            resolution = {width: 1280, height: 720}
                            break;
                        case '28':
                            resolution = {width: 1920, height: 1080}
                            break;
                        case '33':
                            resolution = {width: 3840, height: 2160}
                            break
                        default:
                            resolution = {width: 640, height: 360}
                            log.info('return default value 640 * 360')
                            log.info("getH264ResolutionBySdp: The value is out of the range, " + levelIdc);
                            break;
                    }
                    This.initialResolution.width = resolution.width
                    This.initialResolution.height = resolution.height
                    log.warn("screen resolution = " , This.initialResolution.width  + " * " +  This.initialResolution.height)

                    break
                }

            }
        }
    }
    parseSDP.media = mediaArray
    sdp = SDPTools.writeSDP(parseSDP)
    return sdp
}

/**
 * decorate remote sdp，修改profile-level-id的值
 * @param sdp
 * @returns {*}
 */
PeerConnection.prototype.modifyProfile = function(sdp){
    log.info("modified profile-level-id")
    let parseSDP = SDPTools.parseSDP(sdp)
    for(let i=0; i< parseSDP.media.length; i++) {
        for(let fmtpItem of parseSDP.media[i].fmtp) {
            if (fmtpItem.config.indexOf('profile-level-id') >= 0) {
                let index = fmtpItem.config.indexOf('profile-level-id=')
                let levelIdc = fmtpItem.config.substr(index+21, 2)
                let replacement = 'profile-level-id=42e0' + levelIdc
                fmtpItem.config = fmtpItem.config.replace(/profile-level-id=([a-zA-Z0-9]{6})/, replacement);
            }
        }
    }
    sdp = SDPTools.writeSDP(parseSDP)
    return sdp
}