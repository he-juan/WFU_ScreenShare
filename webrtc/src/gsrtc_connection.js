
/**
 * get local sdp
 * @returns {*}
 */
PeerConnection.prototype.decorateLocalSDP = function () {
    log.info('get local peers combine sdp')
    let This = this
    let sdp

    log.warn("decorate multi stream Peer sdp ")
    let pc = This.peerConnection
    sdp = This.gsRTC.adjustOrderOfMLines(pc.localDescription.sdp)
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

    This.setRemote(sdp)
    gsRTC.isSendReInvite = true
}
