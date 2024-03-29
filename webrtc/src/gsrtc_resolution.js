
/**
 * set sdp session version
 * @param sdp
 */
GsRTC.prototype.saveSDPSessionVersion = function (sdp) {
    log.info('set local sdp session version value')
    if(!sdp){
        log.warn('invalid parameters local sdp!')
        return
    }

    let parseSdp = SDPTools.parseSDP(sdp)
    this.sessionVersion = parseSdp.origin.sessionVersion
}

/**
 * get resolution bu given level idc
 * @param levelIdc
 * @returns {*}
 */
GsRTC.prototype.getResolutionByLevelIdc = function(levelIdc){
    if(!levelIdc){
        log.warn('getResolutionByLevelIdc: levelIdc is null')
        return null
    }
    let resolution
    switch (levelIdc) {
        case '33':
            log.info('levelIdc ' + levelIdc + ', 3840 * 2160 ')
            resolution = { width: 3840, height: 2160 }
            break
        case '28':
            log.info('levelIdc ' + levelIdc + ', 1920 * 1080 ')
            resolution = { width: 1920, height: 1080 }
            break
        case '1f':
            log.info('levelIdc ' + levelIdc + ', 1280 * 720 ')
            resolution = { width: 1280, height: 720 }
            break
        case '1e':
            log.info('levelIdc ' + levelIdc + ', 848 * 480 ')
            resolution = { width: 848, height: 480 }
            break
        case '16':
            log.info('levelIdc ' + levelIdc + ', 640 * 360 ')
            resolution = { width: 640, height: 360 }
            break
        case '15':
            log.info('levelIdc ' + levelIdc + ', 480 * 272 ')
            resolution = { width: 480, height: 272 }
            break
        default:
            log.info('levelIdc ' + levelIdc + ', get default 640 * 360 ')
            resolution = { width: 640, height: 360 }
            break
    }

    return resolution
}

/**
 * get resolution bu given max-fs
 * @param maxFs
 * @returns {*}
 */
GsRTC.prototype.getResolutionByMaxfs = function(maxFs){
    if(!maxFs){
        log.warn('getResolutionByMaxfs: maxFs is null')
        return null
    }
    let resolution

    maxFs = parseInt(maxFs)
    switch (maxFs) {
        case 32400:
            log.info('maxFs ' + maxFs + ', 3840 * 2160 ')
            resolution = { width: 3840, height: 2160 }
            break
        case 8160:
            log.info('maxFs ' + maxFs + ', 1920 * 1080 ')
            resolution = { width: 1920, height: 1080 }
            break
        case 3600:
            log.info('maxFs ' + maxFs + ', 1280 * 720 ')
            resolution = { width: 1280, height: 720 }
            break
        case 1590:
            log.info('maxFs ' + maxFs + ', 848 * 480 ')
            resolution = { width: 848, height: 480 }
            break
        case 920:
            log.info('maxFs ' + maxFs + ', 640 * 360 ')
            resolution = { width: 640, height: 360 }
            break
        case 510:
            log.info('maxFs ' + maxFs + ', 480 * 272 ')
            resolution = { width: 480, height: 272 }
            break
        default:
            log.info('maxFs ' + maxFs + ', get default 640 * 360 ')
            resolution = { width: 640, height: 360 }
            break
    }

    return resolution
}

/**
 *  get resolution by given height
 * @param height
 * @returns {*}
 */
GsRTC.prototype.getResolutionByHeight = function(height){
    if(!height){
        log.warn('getResolutionByHeight: height is null')
        return null
    }
    let resolution

    height = parseInt(height)
    switch (height) {
        case 2160:
            log.info('3840 * 2160')
            resolution = {width: 3840, height: 2160}
            break
        case 1080:
            log.info('1920 * 1080')
            resolution = {width: 1920, height: 1080}
            break
        case 720:
            log.info('1280 * 720')
            resolution = {width: 1280, height: 720}
            break;
        case 480:
            log.info('848 * 480')
            resolution= {width: 848, height: 480}
            break;
        case 360:
            log.info('640 * 360')
            resolution= {width: 640, height: 360}
            break;
        default:
            log.info(' Unknown resolution ' + height + ', default 640 * 360')
            resolution = {width: 640, height: 360}
            break;
    }

    return resolution
}

/**
 * save video resolution
 * @param resolution
 * @param type
 */
GsRTC.prototype.setVideoResolution = function (resolution, type) {
    if(!resolution || !type){
        log.warn('setVideoResolution: INVALID PARAMETERS')
        return
    }
    let This = this

    switch (type) {
        case 'EXPECT_RECV_RESOLUTION':
            log.info('save expect receive resolution ' + resolution.height)
            This.VIDEO_RESOLUTION.EXPECT_RECV_RESOLUTION = resolution
            break
        case 'CURRENT_UP_RESOLUTION':
            log.info('save current up resolution ' + resolution.height)
            This.VIDEO_RESOLUTION.CURRENT_UP_RESOLUTION = resolution
            break
        default:
            log.info('unknown resolution: ' + type)
          break
    }
}

/**
 * get saved video resolution
 * @param type
 * @returns {*|GsRTC.VIDEO_RESOLUTION.EXPECT_RECV_RESOLUTION|{}|GsRTC.VIDEO_RESOLUTION.CURRENT_UP_RESOLUTION}
 */
GsRTC.prototype.getVideoResolution = function (type) {
    if(!type){
        log.warn('getVideoResolution: INVALID PARAMETER')
        return
    }
    let This = this
    let resolution

    switch (type) {
        case 'EXPECT_RECV_RESOLUTION':
            resolution = This.VIDEO_RESOLUTION.EXPECT_RECV_RESOLUTION
            log.info('get expect receive resolution')
            break
        case 'CURRENT_UP_RESOLUTION':
            resolution = This.VIDEO_RESOLUTION.CURRENT_UP_RESOLUTION
            log.info('get current up resolution')
            break
        default:
            log.info('unknown resolution :' + type)
            break
    }

    return resolution
}
