/*Log Debug Start*/
var log = { };
log.debug = window.debug("SipStack:DEBUG");
log.log   = window.debug("SipStack:LOG");
log.info  = window.debug("SipStack:INFO");
log.warn  = window.debug("SipStack:WARN");
log.error = window.debug("SipStack:ERROR");
/*Log Debug End*/

/**
 * Define the SipStack class
 * @param conf
 * @param callback
 * @param gsRTC
 * @returns {SipStack|*}
 * @constructor
 */
let SipStack = function (conf, callback, gsRTC) {
    if(this instanceof SipStack){
        this.initialized = false
        this.conf = {}
        this.gsRTC = gsRTC

        this.jsSipParser = jsSipParser
        this.jsSipInit = jsSipInit
        this.setLogLevel = setLogLevel
        this.jsSipSetConfig = jsSipSetConfig
        this.jsSipStart = jsSipStart
        this.jsSipSendRegister = jsSipSendRegister
        this.jsSipSendInvite = jsSipSendInvite
        this.jsSipSendReInvite = jsSipSendReInvite
        this.jsSipSendRsp = jsSipSendRsp
        this.jsSipSendAck = jsSipSendAck
        this.addHeaderList = addHeaderList
        this.jsSipSendBye = jsSipSendBye

        this.jsSipSendInfo = function (contentType, body) {
            // add header list info first
            addHeaderList(contentType, body);
            jsSipSendInfo()
        }

        this.init(conf, callback)
    }else {
        return new SipStack(conf, callback)
    }
}

/**
 * sip init
 * @param conf: {
 *  userId: userId,
 *  password: password,
 *  proxyuri: proxyuri,
 *  websocketUrl: websocketUrl,
 *  host: host,
 *  userAgent: userAgent,
 *  displayName: displayName,
 *  organization: organization,
 *  allocate: allocate,
 * }
 */
SipStack.prototype.init = function (conf, callback) {
    // Parameter check
    log.info('start sip init!')
    let data = Object.keys(conf);
    if(!data.length){
        throw new Error("ERR_INVALID_PARAMETER_VALUE: null configuration value");
    }

    if (conf.sipRealm && !GsRTC.prototype.tskStringIsString(conf.sipRealm)) {
        throw new Error("ERR_INVALID_PARAMETER_TYPE: '" + typeof conf.sipRealm + "' not a valid type for sipRealm. String is expected");
    }
    if (conf.sipImpi && !GsRTC.prototype.tskStringIsString(conf.sipImpi)) {
        throw new Error("ERR_INVALID_PARAMETER_TYPE: '" + typeof conf.sipImpi + "' not a valid type for sipImpi. String is expected");
    }
    if (conf.sipPasswd && !GsRTC.prototype.tskStringIsString(conf.sipPasswd)) {
        throw new Error("ERR_INVALID_PARAMETER_TYPE: '" + typeof conf.sipPasswd + "' not a valid type for sipPasswd. String is expected");
    }
    if (conf.sipDispalyName && !GsRTC.prototype.tskStringIsString(conf.sipDispalyName)) {
        throw new Error("ERR_INVALID_PARAMETER_TYPE: '" + typeof conf.sipDispalyName + "' not a valid type for sipDispalyName. String is expected");
    }
    if (conf.userAgent && !GsRTC.prototype.tskStringIsString(conf.userAgent)) {
        throw new Error("ERR_INVALID_PARAMETER_TYPE: '" + typeof conf.userAgent + "' not a valid type for userAgent. String is expected");
    }
    if (conf.organization && !GsRTC.prototype.tskStringIsString(conf.organization)) {
        log.info(typeof conf.organization + "' not a valid type for organization. set default 'Grandstream' value");
        conf.organization = 'Grandstream'
    }
    if (conf.host && !GsRTC.prototype.tskStringIsString(conf.host)) {
        log.info(typeof conf.host + " not a valid type for host. set default df7jal23ls0d.invalid value")
        conf.host = 'df7jal23ls0d.invalid'
    }

    try {
        /* 初始化 */
        this.jsSipInit()
        /* 设置日志级别 */
        this.setLogLevel(2)
        /* 配置WebSocket URL */
        this.jsSipSetConfig(0, '1')
        /* 配置用户名 */
        this.jsSipSetConfig(1, conf.sipImpi)
        /* 配置密码 */
        this.jsSipSetConfig(2, conf.sipPasswd)
        /* 配置proxy URL */
        this.jsSipSetConfig(3, conf.sipRealm)
        /* 配置host */
        this.jsSipSetConfig(5, conf.host)
        /* 配置User-Agent */
        this.jsSipSetConfig(6, conf.userAgent)
        /* 配置displayName */
        this.jsSipSetConfig(7, conf.sipDispalyName)
        /* 配置organization */
        this.jsSipSetConfig(8, conf.organization)
        /* 开始sip */
        this.jsSipStart()

        this.conf = conf
        this.initialized = true
    }catch (e) {
        callback(e)
        throw new Error(e);
    }
}

/**
 * send sip message
 * @param message content such as sdp
 * @param contentType  default 'application/sdp'
 */
SipStack.prototype.sendSipMessage = function (message, contentType) {
    if(!this.initialized){
        throw new Error("SIP Stack not initialized yet. Please init first");
    }

    contentType = contentType || 'application/sdp'
    if(this.gsRTC.isRecvRequest){
        log.info('send response')
        this.jsSipSendRsp(this.gsRTC.transaction, 200, contentType, message)
        this.gsRTC.isRecvRequest = false
    }else {
        log.info('send request')
        this.gsRTC.inviteProcessing = true
        if(this.gsRTC.isSendReInvite){
            log.warn('send re-invite')
            this.jsSipSendReInvite(contentType, message)
        }else {
            log.warn('send invite')
            this.jsSipSendInvite(this.conf.allocate , contentType, message);
        }
    }
}









