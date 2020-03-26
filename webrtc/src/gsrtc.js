/*Log Debug Start*/
var log = { };
log.debug = window.debug("sipWebRTC:DEBUG");
log.log   = window.debug("sipWebRTC:LOG");
log.info  = window.debug("sipWebRTC:INFO");
log.warn  = window.debug("sipWebRTC:WARN");
log.error = window.debug("sipWebRTC:ERROR");
/*Log Debug End*/

/**
 * WebRTC API Instance
 * @constructor
 */
let GsRTC = function (options) {
    this.device = null
    this.sipStack = null
    this.sokect = null
    this.RTCSession = null

    this.EVENTS = []
    // 上层注册事件
    this.handlerFuns = []
    this.conf = options;
    this.sessionVersion = 0
    this.enableMultiStream = false
    this.action = null

    this.transaction = null
    this.isRecvRequest = false    // true => recv request
    this.isSendReInvite = false
    this.inviteProcessing = false
    this.sendInviteQueue = []

    // if(options){
    //     this.loadStorageConfiguration();
    // }
    //
    // this.deviceInit()
    // this.eventBindings()
}

/**
 * set storage settings
 */
GsRTC.prototype.loadStorageConfiguration = function () {
    log.info('local storage configuration')
    /* 这里设置fec的开关控制阀 */
    if (this.getBrowserDetail().browser === 'chrome'&& this.getBrowserDetail().version >= 69 || this.getBrowserDetail().browser === 'safari'){
        log.info('set test_red_ulpfec_enabled false')
        localStorage.setItem("test_red_ulpfec_enabled", 'false');
    }else{
        if(localStorage.test_red_ulpfec_enabled === undefined){
            log.info('set test_red_ulpfec_enabled true')
            localStorage.setItem("test_red_ulpfec_enabled", 'true');
        }
    }

    /* set switch of trickle_ice */
    if(localStorage.trickle_ice === undefined){
        log.info('set trickle_ice false')
        localStorage.setItem("trickle_ice", 'false');
    }
}

/**
 * available device scan and capability scan
 */
GsRTC.prototype.deviceInit = function () {
    log.info('device init')
    let This = this
    if(window.MediaDevice){
        This.device =  new MediaDevice()
        This.device.enumDevices(deviceInfo => {
            log.log('enumDevices' + JSON.stringify(deviceInfo))
            This.device.availableDev = {}
            This.device.availableDev.videoInputList = deviceInfo.cameras
            This.device.availableDev.audioOutputList = deviceInfo.speakers
            This.device.availableDev.audioInputList = deviceInfo.microphones
            This.device.checkAvailableDev()
            setTimeout(function () {
                This.device.setDeviceCapability()
            }, 1000)
        }, function (error) {
            log.error('enum device error: ' + error)
        })
    }else {
        log.info('MediaDevice is not exist!')
    }
}


