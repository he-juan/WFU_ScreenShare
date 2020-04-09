var log = {};
log.debug = window.debug("GSRTC_COMMON:DEBUG");
log.log = window.debug("GSRTC_COMMON:LOG");
log.info = window.debug("GSRTC_COMMON:INFO");
log.warn = window.debug("GSRTC_COMMON:WARN");
log.error = window.debug("GSRTC_COMMON:ERROR");
/*Log Debug End*/

/**
 * Function that subscribes a listener to an event.
 * @method on
 * @param {String} eventName The event.
 * @param {Function} callback The listener.
 */
GsRTC.prototype.on = function(eventName, callback) {
    if ('function' === typeof callback) {
        this.EVENTS[eventName] = this.EVENTS[eventName] || [];
        this.EVENTS[eventName].push(callback);
    } else {
        throw 'Provided parameter is not a function'
    }

};

/**
 * Function that unsubscribes listeners from an event.
 * @method off
 * @param {String} [eventName] The event.
 * - When not provided, all listeners to all events will be unsubscribed.
 * @param {Function} [callback] The listener to unsubscribe.
 * - When not provided, all listeners associated to the event will be unsubscribed.
 */
GsRTC.prototype.off = function(eventName, callback) {
    if (!(eventName && typeof eventName === 'string')) {
        this.EVENTS = {};
    } else {
        if (callback === undefined) {
            this.EVENTS[eventName] = [];
            return;
        }
        let arr = this.EVENTS[eventName] || [];

        // unsubscribe events that is triggered always
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === callback) {
                arr.splice(i, 1);
                break;
            }
        }
    }

};

/**
 * Function that triggers an event.
 * The rest of the parameters after the <code>eventName</code> parameter is considered as the event parameter payloads.
 * @method trigger
 */
GsRTC.prototype.trigger = function(eventName) {
    //convert the arguments into an array
    let args = Array.prototype.slice.call(arguments);
    let arr = this.EVENTS[eventName];
    args.shift(); //Omit the first argument since it's the event name
    if (arr) {
        // for events subscribed forever
        for (let i = 0; i < arr.length; i++) {
            try {
                if(arr[i].apply(this, args) === false) {
                    break;
                }
            } catch(error) {
                throw error;
            }
        }
    }
}

/**
 * Function that Determine whether it is nxx corresponding, such as: isResponseNxx(2, 200) ==> true
 * @param i
 * @param code Received status code, such 200
 * @returns {boolean}
 */
GsRTC.prototype.isNxx= function(i, code) {
    return ((i * 100) <= code && code <= ((i * 100) + 99));
}

/***
 * Function that Generate a UUID as the unique identifier of the peer ID
 * @returns {string}
 */
GsRTC.prototype.generateUUID = function() {
    let d = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r && 0x7 | 0x8)).toString(16);
    });
};

/***
 * get file url
 * @param file
 * @returns {*}
 */
GsRTC.prototype.getObjectURL = function(file) {
    let url = null;
    if (window.createObjectURL !== undefined) { // basic
        url = window.createObjectURL(file);
    } else if (window.URL !== undefined) { // mozilla(firefox)
        url = window.URL.createObjectURL(file);
    } else if (window.webkitURL !== undefined) { // webkit or chrome
        url = window.webkitURL.createObjectURL(file);
    }
    return url;
}

/***
 * Function that deep clone an object.
 * @param obj
 * @returns {*}
 */
GsRTC.prototype.objectDeepClone = function(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    let copy = function (data) {
        let copy = data.constructor();
        for (let attr in data) {
            if (data.hasOwnProperty(attr)) {
                copy[attr] = data[attr];
            }
        }
        return copy;
    };

    if (typeof obj === 'object' && !Array.isArray(obj)) {
        try {
            return JSON.parse( JSON.stringify(obj) );
        } catch (err) {
            return copy(obj);
        }
    }

    return copy(obj);
};

/***
 * Function that Depth comparison of two objects is completely equal
 * @param x
 * @param y
 * @returns {boolean}
 */
GsRTC.prototype.isObjectXExactlyEqualToY = function(x, y) {
    let i, l, leftChain, rightChain;

    function compare2Objects(x, y) {
        let p;

        // remember that NaN === NaN returns false
        // and isNaN(undefined) returns true
        if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
            return true;
        }

        // Compare primitives and functions.
        // Check if both arguments link to the same object.
        // Especially useful on the step where we compare prototypes
        if (x === y) {
            return true;
        }

        // Works in case when functions are created in constructor.
        // Comparing dates is a common scenario. Another built-ins?
        // We can even handle functions passed across iframes
        if ((typeof x === 'function' && typeof y === 'function') ||
            (x instanceof Date && y instanceof Date) ||
            (x instanceof RegExp && y instanceof RegExp) ||
            (x instanceof String && y instanceof String) ||
            (x instanceof Number && y instanceof Number)) {
            return x.toString() === y.toString();
        }

        // At last checking prototypes as good as we can
        if (!(x instanceof Object && y instanceof Object)) {
            return false;
        }

        if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
            return false;
        }

        if (x.constructor !== y.constructor) {
            return false;
        }

        if (x.prototype !== y.prototype) {
            return false;
        }

        // Check for infinitive linking loops
        if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
            return false;
        }

        // Quick checking of one object being a subset of another.
        // todo: cache the structure of arguments[0] for performance
        for (p in y) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            } else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
        }

        for (p in x) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            } else if (typeof y[p] !== typeof x[p]) {
                return false;
            }

            switch (typeof(x[p])) {
                case 'object':
                case 'function':

                    leftChain.push(x);
                    rightChain.push(y);

                    if (!compare2Objects(x[p], y[p])) {
                        return false;
                    }

                    leftChain.pop();
                    rightChain.pop();
                    break;

                default:
                    if (x[p] !== y[p]) {
                        return false;
                    }
                    break;
            }
        }

        return true;
    }

    if (arguments.length < 1) {
        log.warn('Need two or more arguments to compare')
        return true;
    }

    for (i = 1, l = arguments.length; i < l; i++) {
        leftChain = [];
        rightChain = [];

        if (!compare2Objects(arguments[0], arguments[i])) {
            return false;
        }
    }

    return true;
}

/**
 * Determine if the browser supports ReplaceTrack
 * @returns {boolean}
 */
GsRTC.prototype.isReplaceTrackSupport = function() {
    let browserDetails = this.getBrowserDetail()
    let result = false

    switch (browserDetails.browser) {
        case 'chrome':
            result = browserDetails.version >= 72
            break
        case 'opera':
            result = browserDetails.version >= 59
            break
        case 'firefox':
            result = browserDetails.version >= 59
            break
        case 'safari':
            result = browserDetails.version >= '12.1.1'
            break
        default:
            break
    }

    log.info(browserDetails.browser + ' ' + browserDetails.version +' version support replaceTrack : ' + result)
    return result
}

/**
 * Browser detector.
 *
 * @return {object} result containing browser and version
 *     properties.
 */
GsRTC.prototype.getBrowserDetail = function () {
    function extractVersion(uastring, expr, pos) {
        let match = uastring.match(expr);
        return match && match.length >= pos && parseInt(match[pos], 10);
    }

    var navigator = window && window.navigator;

    // Returned result object.
    var result = {};
    result.browser = null;
    result.version = null;
    result.UIVersion = null;
    result.chromeVersion = null;

    // Fail early if it's not a browser
    if (typeof window === 'undefined' || !window.navigator) {
        result.browser = 'Not a browser.';
        return result;
    }

    // Edge.
    if (navigator.mediaDevices &&
        navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
        result.browser = 'edge';
        result.version = extractVersion(navigator.userAgent, /Edge\/(\d+).(\d+)$/, 2);
        result.UIVersion = navigator.userAgent.match(/Edge\/([\d.]+)/)[1]; //Edge/16.17017

    } // IE
    else if (!navigator.mediaDevices && (!!window.ActiveXObject || 'ActiveXObject' in window || navigator.userAgent.match(/MSIE (\d+)/) || navigator.userAgent.match(/rv:(\d+)/))) {
        result.browser = 'ie';
        if (navigator.userAgent.match(/MSIE (\d+)/)) {
            result.version = extractVersion(navigator.userAgent, /MSIE (\d+).(\d+)/, 1);
            result.UIVersion = navigator.userAgent.match(/MSIE ([\d.]+)/)[1]; //MSIE 10.6

        } else if (navigator.userAgent.match(/rv:(\d+)/)) {
            /*For IE 11*/
            result.version = extractVersion(navigator.userAgent, /rv:(\d+).(\d+)/, 1);
            result.UIVersion = navigator.userAgent.match(/rv:([\d.]+)/)[1]; //rv:11.0
        }

        // Firefox.
    } else if (navigator.mozGetUserMedia) {
        result.browser = 'firefox';
        result.version = extractVersion(navigator.userAgent,
            /Firefox\/(\d+)\./, 1);
        result.UIVersion = navigator.userAgent.match(/Firefox\/([\d.]+)/)[1]; //Firefox/56.0

        // all webkit-based browsers
    } else if (navigator.webkitGetUserMedia && window.webkitRTCPeerConnection) {
        // Chrome, Chromium, Webview, Opera, Vivaldi all use the chrome shim for now
        var isOpera = navigator.userAgent.match(/(OPR|Opera).([\d.]+)/) ? true : false;
        //var isVivaldi = navigator.userAgent.match(/(Vivaldi).([\d.]+)/) ? true : false;
        if (isOpera) {
            result.browser = 'opera';
            result.version = extractVersion(navigator.userAgent, /O(PR|pera)\/(\d+)\./, 2);
            result.UIVersion = navigator.userAgent.match(/O(PR|pera)\/([\d.]+)/)[2]; //OPR/48.0.2685.39
            if (navigator.userAgent.match(/Chrom(e|ium)\/([\d.]+)/)[2]) {
                result.chromeVersion = extractVersion(navigator.userAgent, /Chrom(e|ium)\/(\d+)\./, 2);
            }
        }/* else if (isVivaldi) {
          result.browser = 'vivaldi';
          result.version = extractVersion(navigator.userAgent,
                                            /(Vivaldi)\/(\d+)\./, 2);
          result.UIVersion = navigator.userAgent.match(/Vivaldi\/([\d.]+)/)[1]; //Vivaldi/1.93.955.38
     }*/ else {
            result.browser = 'chrome';
            result.version = extractVersion(navigator.userAgent, /Chrom(e|ium)\/(\d+)\./, 2);
            result.UIVersion = navigator.userAgent.match(/Chrom(e|ium)\/([\d.]+)/)[2]; //Chrome/61.0.3163.100
        }

        // Safari or unknown webkit-based
        // for the time being Safari has support for MediaStreams but not webRTC
        //Safari without webRTC and with partly webRTC support
    } else if ((!navigator.webkitGetUserMedia && navigator.userAgent.match(/AppleWebKit\/([0-9]+)\./)) || (navigator.webkitGetUserMedia && !navigator.webkitRTCPeerConnection)) {
        // Safari UA substrings of interest for reference:
        // - webkit version:           AppleWebKit/602.1.25 (also used in Op,Cr)
        // - safari UI version:        Version/9.0.3 (unique to Safari)
        // - safari UI webkit version: Safari/601.4.4 (also used in Op,Cr)
        //
        // if the webkit version and safari UI webkit versions are equals,
        // ... this is a stable version.
        //
        // only the internal webkit version is important today to know if
        // media streams are supported
        //
        if (navigator.userAgent.match(/Version\/(\d+).(\d+)/)) {
            result.browser = 'safari';
            result.version = extractVersion(navigator.userAgent, /AppleWebKit\/(\d+)\./, 1);
            result.UIVersion = navigator.userAgent.match(/Version\/([\d.]+)/)[1]; //Version/11.0.1

        } else { // unknown webkit-based browser.
            result.browser = 'Unsupported webkit-based browser ' + 'with GUM support but no WebRTC support.';
            return result;
        }
        // Default fallthrough: not supported.
    } else {
        result.browser = 'Not a supported browser.';
        return result;
    }

    return result;
}

/**
 * Determine if the input string is empty or all spaces
 * @param str
 * @returns {boolean}
 */
GsRTC.prototype.tskStringIsNullOrEmpty = function (str) {
    let result
    if(!str || str === ""){
        result = true
    }else {
        let regu = "^[ ]+$";
        let re = new RegExp(regu);
        result = re.test(str)
    }
    return result;
}

/**
 * 获取屏幕分辨率
 * @returns {string}
 */
GsRTC.prototype.getScreenResolution = function() {
    if (window.devicePixelRatio === undefined) {
        window.devicePixelRatio = 1;
    }
    let screenResolution = window.screen.height * window.devicePixelRatio * window.screen.width * window.devicePixelRatio
    let InitResolution = {};
    //根据用户屏幕分辨率确定入会初始分辨率
    if (screenResolution <= 1440 * 900) {
        InitResolution = {
            width: 1280,
            height: 720
        }
    } else {
        InitResolution = {
            width: 1920,
            height: 1080
        }
    }
    log.info("screen resolution = " + window.screen.height * window.devicePixelRatio + " * " + window.screen.width * window.devicePixelRatio);
    return InitResolution;
}