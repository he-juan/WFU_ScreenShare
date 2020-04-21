
/**
 * get local sdp
 * @returns {*}
 */
PeerConnection.prototype.decorateLocalSDP = function () {
    log.info('get local peers combine sdp')
    let This = this
    log.warn("decorate multi stream Peer sdp ")

    let sdp = This.peerConnection.localDescription.sdp
    sdp = This.gsRTC.adjustOrderOfMLines(sdp)
    sdp = This.gsRTC.removeSSRC(sdp)
    sdp = This.gsRTC.removeCodeByName(sdp)

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

    sdp = This.gsRTC.setXgoogleBitrate(sdp, 10240)
    sdp = This.modifiedMidBeforeSetRemoteSDP(sdp)
    This.setRemote(sdp)
    This.gsRTC.isSendReInvite = true
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
    let mLineOrder = This.gsRTC.mLineOrder

    // TODO: 要保持m行顺序
    for(let i=0; i< parseSDP.media.length; i++){
        if(!parseSDP.media[i].content){
            type = 'audio'
        }else {
            type = parseSDP.media[i].content
        }
        parseSDP.media[i].mid =  This.gsRTC.getOriginalMid(type)

        for(let j in mLineOrder){
            if(type === mLineOrder[j]){
                mediaArray[j] = parseSDP.media[i]
            }
        }

        if(type=== 'slides' && !This.gsRTC.initialResolution){
            This.gsRTC.initialResolution = {}
            if(parseSDP.media[i].framerate){
                This.gsRTC.initialResolution.framerate = parseSDP.media[i].framerate
            }
            for(let fmtpItem of parseSDP.media[i].fmtp){
                if(fmtpItem.config.indexOf('profile-level-id') >= 0){
                    let levelIdc = fmtpItem.config.substr(21, 2)
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

                    This.gsRTC.initialResolution.width = resolution.width
                    This.gsRTC.initialResolution.height = resolution.height
                    break
                }
            }
        }
    }
    parseSDP.media = mediaArray
    sdp = SDPTools.writeSDP(parseSDP)
    return sdp
}