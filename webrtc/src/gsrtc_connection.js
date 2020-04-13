
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
    let This = this
    if(!sdp){
        log.error("commonDecorateRo: Invalid Argument");
        return;
    }
    // TODO: gs_phone 不支持x-googel私有字段，web 端添加
    sdp = gsRTC.setXgoogleBitrate(sdp, 4096)
    log.info('commonDecorateRo:\n'  + sdp)

    sdp = This.modifiedMidBeforeSetRemoteSDP(sdp)
    This.setRemote(sdp)
    gsRTC.isSendReInvite = true
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
    }
    parseSDP.media = mediaArray
    sdp = SDPTools.writeSDP(parseSDP)
    return sdp
}