const grammar = {
    v: [{
        name: 'version',
        reg: /^(\d*)$/
    }],
    o: [{
        // o=- 20518 0 IN IP4 203.0.113.1
        // NB: sessionId will be a String in most cases because it is huge
        name: 'origin',
        reg: /^(\S*) (\d*) (\d*) (\S*) IP(\d) (\S*)/,
        names: ['username', 'sessionId', 'sessionVersion', 'netType', 'ipVer', 'address'],
        format: '%s %s %d %s IP%d %s'
    }],
    // default parsing of these only (though some of these feel outdated)
    s: [{ name: 'name' }],
    i: [{ name: 'description' }],
    u: [{ name: 'uri' }],
    e: [{ name: 'email' }],
    p: [{ name: 'phone' }],
    z: [{ name: 'timezones' }], // TODO: this one can actually be parsed properly...
    r: [{ name: 'repeats' }],   // TODO: this one can also be parsed properly
    // k: [{}], // outdated thing ignored
    t: [{
        // t=0 0
        name: 'timing',
        reg: /^(\d*) (\d*)/,
        names: ['start', 'stop'],
        format: '%d %d'
    }],
    c: [{
        // c=IN IP4 10.47.197.26
        name: 'connection',
        reg: /^IN IP(\d) (\S*)/,
        names: ['version', 'ip'],
        format: 'IN IP%d %s'
    }],
    b: [{
        // b=AS:4000
        push: 'bandwidth',
        reg: /^(TIAS|AS|CT|RR|RS):(\d*)/,
        names: ['type', 'limit'],
        format: '%s:%s'
    }],
    m: [{
        // m=video 51744 RTP/AVP 126 97 98 34 31
        // NB: special - pushes to session
        // TODO: rtp/fmtp should be filtered by the payloads found here?
        reg: /^(\w*) (\d*) ([\w/]*)(?: (.*))?/,
        names: ['type', 'port', 'protocol', 'payloads'],
        format: '%s %d %s %s'
    }],
    a: [
        {
            // a=rtpmap:110 opus/48000/2
            push: 'rtp',
            reg: /^rtpmap:(\d*) ([\w\-.]*)(?:\s*\/(\d*)(?:\s*\/(\S*))?)?/,
            names: ['payload', 'codec', 'rate', 'encoding'],
            format: function (o) {
                return (o.encoding)
                    ? 'rtpmap:%d %s/%s/%s'
                    : o.rate
                        ? 'rtpmap:%d %s/%s'
                        : 'rtpmap:%d %s'
            }
        },
        {
            // a=fmtp:108 profile-level-id=24;object=23;bitrate=64000
            // a=fmtp:111 minptime=10; useinbandfec=1
            push: 'fmtp',
            reg: /^fmtp:(\d*) ([\S| ]*)/,
            names: ['payload', 'config'],
            format: 'fmtp:%d %s'
        },
        {
            // a=control:streamid=0
            name: 'control',
            reg: /^control:(.*)/,
            format: 'control:%s'
        },
        {
            // a=rtcp:65179 IN IP4 193.84.77.194
            name: 'rtcp',
            reg: /^rtcp:(\d*)(?: (\S*) IP(\d) (\S*))?/,
            names: ['port', 'netType', 'ipVer', 'address'],
            format: function (o) {
                return (o.address != null)
                    ? 'rtcp:%d %s IP%d %s'
                    : 'rtcp:%d'
            }
        },
        {
            // a=rtcp-fb:98 trr-int 100
            push: 'rtcpFbTrrInt',
            reg: /^rtcp-fb:(\*|\d*) trr-int (\d*)/,
            names: ['payload', 'value'],
            format: 'rtcp-fb:%d trr-int %d'
        },
        {
            // a=rtcp-fb:98 nack rpsi
            push: 'rtcpFb',
            reg: /^rtcp-fb:(\*|\d*) ([\w-_]*)(?: ([\w-_]*))?/,
            names: ['payload', 'type', 'subtype'],
            format: function (o) {
                return (o.subtype != null)
                    ? 'rtcp-fb:%s %s %s'
                    : 'rtcp-fb:%s %s'
            }
        },
        {
            // a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
            // a=extmap:1/recvonly URI-gps-string
            // a=extmap:3 urn:ietf:params:rtp-hdrext:encrypt urn:ietf:params:rtp-hdrext:smpte-tc 25@600/24
            push: 'ext',
            reg: /^extmap:(\d+)(?:\/(\w+))?(?: (urn:ietf:params:rtp-hdrext:encrypt))? (\S*)(?: (\S*))?/,
            names: ['value', 'direction', 'encrypt-uri', 'uri', 'config'],
            format: function (o) {
                return (
                    'extmap:%d' +
                    (o.direction ? '/%s' : '%v') +
                    (o['encrypt-uri'] ? ' %s' : '%v') +
                    ' %s' +
                    (o.config ? ' %s' : '')
                )
            }
        },
        {
            // a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:PS1uQCVeeCFCanVmcjkpPywjNWhcYD0mXXtxaVBR|2^20|1:32
            push: 'crypto',
            reg: /^crypto:(\d*) ([\w_]*) (\S*)(?: (\S*))?/,
            names: ['id', 'suite', 'config', 'sessionConfig'],
            format: function (o) {
                return (o.sessionConfig != null)
                    ? 'crypto:%d %s %s %s'
                    : 'crypto:%d %s %s'
            }
        },
        {
            // a=setup:actpass
            name: 'setup',
            reg: /^setup:(\w*)/,
            format: 'setup:%s'
        },
        {
            // a=connection:new
            name: 'connectionType',
            reg: /^connection:(new|existing)/,
            format: 'connection:%s'
        },
        {
            // a=mid:1
            name: 'mid',
            reg: /^mid:([^\s]*)/,
            format: 'mid:%s'
        },
        {
            // a=msid:0c8b064d-d807-43b4-b434-f92a889d8587 98178685-d409-46e0-8e16-7ef0db0db64a
            name: 'msid',
            reg: /^msid:(\S*) (\S*)/,
            names: ['msid', 'trackid'],
            format: 'msid:%s %s'
        },
        {
            // a=ptime:20
            name: 'ptime',
            reg: /^ptime:(\d*)/,
            format: 'ptime:%d'
        },
        {
            // a=maxptime:60
            name: 'maxptime',
            reg: /^maxptime:(\d*)/,
            format: 'maxptime:%d'
        },
        {
            // a=sendrecv
            name: 'direction',
            reg: /^(sendrecv|recvonly|sendonly|inactive)/
        },
        {
            // a=ice-lite
            name: 'icelite',
            reg: /^(ice-lite)/
        },
        {
            // a=ice-ufrag:F7gI
            name: 'iceUfrag',
            reg: /^ice-ufrag:(\S*)/,
            format: 'ice-ufrag:%s'
        },
        {
            // a=ice-pwd:x9cml/YzichV2+XlhiMu8g
            name: 'icePwd',
            reg: /^ice-pwd:(\S*)/,
            format: 'ice-pwd:%s'
        },
        {
            // a=fingerprint:SHA-1 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33
            name: 'fingerprint',
            reg: /^fingerprint:(\S*) (\S*)/,
            names: ['type', 'hash'],
            format: 'fingerprint:%s %s'
        },
        {
            // a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host
            // a=candidate:1162875081 1 udp 2113937151 192.168.34.75 60017 typ host generation 0 network-id 3 network-cost 10
            // a=candidate:3289912957 2 udp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 generation 0 network-id 3 network-cost 10
            // a=candidate:229815620 1 tcp 1518280447 192.168.150.19 60017 typ host tcptype active generation 0 network-id 3 network-cost 10
            // a=candidate:3289912957 2 tcp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 tcptype passive generation 0 network-id 3 network-cost 10
            push: 'candidates',
            reg: /^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)(?: raddr (\S*) rport (\d*))?(?: tcptype (\S*))?(?: generation (\d*))?(?: network-id (\d*))?(?: network-cost (\d*))?/,
            names: ['foundation', 'component', 'transport', 'priority', 'ip', 'port', 'type', 'raddr', 'rport', 'tcptype', 'generation', 'network-id', 'network-cost'],
            format: function (o) {
                let str = 'candidate:%s %d %s %d %s %d typ %s'

                str += (o.raddr != null) ? ' raddr %s rport %d' : '%v%v'

                // NB: candidate has three optional chunks, so %void middles one if it's missing
                str += (o.tcptype != null) ? ' tcptype %s' : '%v'

                if (o.generation != null) {
                    str += ' generation %d'
                }

                str += (o['network-id'] != null) ? ' network-id %d' : '%v'
                str += (o['network-cost'] != null) ? ' network-cost %d' : '%v'
                return str
            }
        },
        {
            // a=end-of-candidates (keep after the candidates line for readability)
            name: 'endOfCandidates',
            reg: /^(end-of-candidates)/
        },
        {
            // a=remote-candidates:1 203.0.113.1 54400 2 203.0.113.1 54401 ...
            name: 'remoteCandidates',
            reg: /^remote-candidates:(.*)/,
            format: 'remote-candidates:%s'
        },
        {
            // a=ice-options:google-ice
            name: 'iceOptions',
            reg: /^ice-options:(\S*)/,
            format: 'ice-options:%s'
        },
        {
            // a=ssrc:2566107569 cname:t9YU8M1UxTF8Y1A1
            push: 'ssrcs',
            reg: /^ssrc:(\d*) ([\w_-]*)(?::(.*))?/,
            names: ['id', 'attribute', 'value'],
            format: function (o) {
                let str = 'ssrc:%d'
                if (o.attribute != null) {
                    str += ' %s'
                    if (o.value != null) {
                        str += ':%s'
                    }
                }
                return str
            }
        },
        {
            // a=ssrc-group:FEC 1 2
            // a=ssrc-group:FEC-FR 3004364195 1080772241
            push: 'ssrcGroups',
            // token-char = %x21 / %x23-27 / %x2A-2B / %x2D-2E / %x30-39 / %x41-5A / %x5E-7E
            reg: /^ssrc-group:([\x21\x23\x24\x25\x26\x27\x2A\x2B\x2D\x2E\w]*) (.*)/,
            names: ['semantics', 'ssrcs'],
            format: 'ssrc-group:%s %s'
        },
        {
            // a=msid-semantic: WMS Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV
            push: 'msidSemantics', /*Modified by rzhang, for merge/split SDP*/
            //name: 'msidSemantic',
            reg: /^msid-semantic:\s?(\w*) (\S*)/,
            names: ['semantic', 'token'],
            format: 'msid-semantic: %s %s' // space after ':' is not accidental
        },
        {
            // a=group:BUNDLE audio video
            push: 'groups',
            reg: /^group:(\w*) (.*)/,
            names: ['type', 'mids'],
            format: 'group:%s %s'
        },
        {
            // a=rtcp-mux
            name: 'rtcpMux',
            reg: /^(rtcp-mux)/
        },
        {
            // a=rtcp-rsize
            name: 'rtcpRsize',
            reg: /^(rtcp-rsize)/
        },
        {
            // a=sctpmap:5000 webrtc-datachannel 1024
            name: 'sctpmap',
            reg: /^sctpmap:([\w_/]*) (\S*)(?: (\S*))?/,
            names: ['sctpmapNumber', 'app', 'maxMessageSize'],
            format: function (o) {
                return (o.maxMessageSize != null)
                    ? 'sctpmap:%s %s %s'
                    : 'sctpmap:%s %s'
            }
        },
        {
            // a=x-google-flag:conference
            name: 'xGoogleFlag',
            reg: /^x-google-flag:([^\s]*)/,
            format: 'x-google-flag:%s'
        },
        {
            // a=rid:1 send max-width=1280;max-height=720;max-fps=30;depend=0
            push: 'rids',
            reg: /^rid:([\d\w]+) (\w+)(?: ([\S| ]*))?/,
            names: ['id', 'direction', 'params'],
            format: function (o) {
                return (o.params) ? 'rid:%s %s %s' : 'rid:%s %s'
            }
        },
        {
            // a=imageattr:97 send [x=800,y=640,sar=1.1,q=0.6] [x=480,y=320] recv [x=330,y=250]
            // a=imageattr:* send [x=800,y=640] recv *
            // a=imageattr:100 recv [x=320,y=240]
            push: 'imageattrs',
            reg: new RegExp(
                // a=imageattr:97
                '^imageattr:(\\d+|\\*)' +
                // send [x=800,y=640,sar=1.1,q=0.6] [x=480,y=320]
                '[\\s\\t]+(send|recv)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*)' +
                // recv [x=330,y=250]
                '(?:[\\s\\t]+(recv|send)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*))?'
            ),
            names: ['pt', 'dir1', 'attrs1', 'dir2', 'attrs2'],
            format: function (o) {
                return 'imageattr:%s %s %s' + (o.dir2 ? ' %s %s' : '')
            }
        },
        {
            // a=simulcast:send 1,2,3;~4,~5 recv 6;~7,~8
            // a=simulcast:recv 1;4,5 send 6;7
            name: 'simulcast',
            reg: new RegExp(
                // a=simulcast:
                '^simulcast:' +
                // send 1,2,3;~4,~5
                '(send|recv) ([a-zA-Z0-9\\-_~;,]+)' +
                // space + recv 6;~7,~8
                '(?:\\s?(send|recv) ([a-zA-Z0-9\\-_~;,]+))?' +
                // end
                '$'
            ),
            names: ['dir1', 'list1', 'dir2', 'list2'],
            format: function (o) {
                return 'simulcast:%s %s' + (o.dir2 ? ' %s %s' : '')
            }
        },
        {
            // old simulcast draft 03 (implemented by Firefox)
            //   https://tools.ietf.org/html/draft-ietf-mmusic-sdp-simulcast-03
            // a=simulcast: recv pt=97;98 send pt=97
            // a=simulcast: send rid=5;6;7 paused=6,7
            name: 'simulcast_03',
            reg: /^simulcast:[\s\t]+([\S+\s\t]+)$/,
            names: ['value'],
            format: 'simulcast: %s'
        },
        {
            // a=framerate:25
            // a=framerate:29.97
            name: 'framerate',
            reg: /^framerate:(\d+(?:$|\.\d+))/,
            format: 'framerate:%s'
        },
        {
            // RFC4570
            // a=source-filter: incl IN IP4 239.5.2.31 10.1.15.5
            name: 'sourceFilter',
            reg: /^source-filter: *(excl|incl) (\S*) (IP4|IP6|\*) (\S*) (.*)/,
            names: ['filterMode', 'netType', 'addressTypes', 'destAddress', 'srcList'],
            format: 'source-filter: %s %s %s %s %s'
        },
        {
            // a=bundle-only
            name: 'bundleOnly',
            reg: /^(bundle-only)/
        },
        {
            // a=label:1
            name: 'label',
            reg: /^label:(.+)/,
            format: 'label:%s'
        },
        {
            // RFC version 26 for SCTP over DTLS
            // https://tools.ietf.org/html/draft-ietf-mmusic-sctp-sdp-26#section-5
            name: 'sctpPort',
            reg: /^sctp-port:(\d+)$/,
            format: 'sctp-port:%s'
        },
        {
            // RFC version 26 for SCTP over DTLS
            // https://tools.ietf.org/html/draft-ietf-mmusic-sctp-sdp-26#section-6
            name: 'maxMessageSize',
            reg: /^max-message-size:(\d+)$/,
            format: 'max-message-size:%s'
        },
        {
            // a=keywds:keywords
            name: 'keywords',
            reg: /^keywds:(.+)$/,
            format: 'keywds:%s'
        },
        {
            // RFC4796 The Content Attribute
            // a=content:slides,main,sl,speaker
            name: 'content',
            reg: /^content:(.+)$/,
            format: 'content:%s'
        },
        {
            // a=quality:quality
            name: 'quality',
            reg: /^quality:(.+)$/,
            format: 'quality:%s'
        },
        {
            // any a= that we don't understand is kept verbatim on media.invalid
            push: 'invalid',
            names: ['value']
        }
    ]
}
// set sensible defaults to avoid polluting the grammar with boring details
Object.keys(grammar).forEach(function (key) {
    let objs = grammar[key]
    objs.forEach(function (obj) {
        if (!obj.reg) {
            obj.reg = /(.*)/
        }
        if (!obj.format) {
            obj.format = '%s'
        }
    })
})

// customized util.format - discards excess arguments and can void middle ones
let formatRegExp = /%[sdv%]/g
let format = function (formatStr) {
    let i = 1
    let args = arguments
    let len = args.length
    return formatStr.replace(formatRegExp, function (x) {
        if (i >= len) {
            return x // missing argument
        }
        let arg = args[i]
        i += 1
        switch (x) {
            case '%%':
                return '%'
            case '%s':
                return String(arg)
            case '%d':
                return Number(arg)
            case '%v':
                return ''
        }
    })
    // NB: we discard excess arguments - they are typically undefined from makeLine
}

function getType (obj) {
    if (Object.prototype.toString.call(obj) === '[object Object]') {
        return 'Object'
    } else if (Object.prototype.toString.call(obj) === '[object Array]') {
        return 'Array'
    } else {
        return 'nomal'
    }
}

function deepCopy (obj) {
    if (getType(obj) === 'nomal') {
        return obj
    } else {
        var newObj = getType(obj) === 'Object' ? {} : []
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                newObj[key] = deepCopy(obj[key])
            }
        }
    }
    return newObj
}

let makeLine = function (type, obj, location) {
    let str = obj.format instanceof Function ? (obj.format(obj.push ? location : location[obj.name])) : obj.format
    let args = [type + '=' + str]

    if (obj.names) {
        for (let i = 0; i < obj.names.length; i += 1) {
            let n = obj.names[i]
            if (obj.name) {
                args.push(location[obj.name][n])
            } else { // for mLine and push attributes
                args.push(location[obj.names[i]])
            }
        }
    } else {
        args.push(location[obj.name])
    }
    return format.apply(null, args)
}

// RFC specified order
// TODO: extend this with all the rest
let defaultOuterOrder = [
    'v', 'o', 's', 'i',
    'u', 'e', 'p', 'c',
    'b', 't', 'r', 'z', 'a'
]
let defaultInnerOrder = ['i', 'c', 'b', 'a']

let toIntIfInt = function (v) {
    return String(Number(v)) === v ? Number(v) : v
}

let attachProperties = function (match, location, names, rawName) {
    if (rawName && !names) {
        location[rawName] = toIntIfInt(match[1])
    } else {
        for (let i = 0; i < names.length; i += 1) {
            if (match[i + 1] != null) {
                location[names[i]] = toIntIfInt(match[i + 1])
            }
        }
    }
}

let parseReg = function (obj, location, content) {
    let needsBlank = obj.name && obj.names
    if (obj.push && !location[obj.push]) {
        location[obj.push] = []
    } else if (needsBlank && !location[obj.name]) {
        location[obj.name] = {}
    }
    // blank object that will be pushed
    let keyLocation = obj.push ? {} : needsBlank ? location[obj.name] : location // otherwise, named location or root

    attachProperties(content.match(obj.reg), keyLocation, obj.names, obj.name)

    if (obj.push) {
        location[obj.push].push(keyLocation)
    }
}

let validLine = RegExp.prototype.test.bind(/^([a-z])=(.*)/)

let paramReducer = function (acc, expr) {
    let s = expr.split(/=(.+)/, 2)
    if (s.length === 2) {
        acc[s[0]] = toIntIfInt(s[1])
    } else if (s.length === 1 && expr.length > 1) {
        acc[s[0]] = undefined
    }
    return acc
}

let SDPTools = {
    midMap: [], /*Save SDP mid mapping: msid:xxx(The original msid), mid:xx(The original mid), mappedMID:XX(The mapped mid)*/
    msidMap: [], /*Save SDP msid mapping: msid:xxx(The original msid), pcName:XXX(The mapped msid) */
    sessionVersion: 0, /*SDP o line session version*/
    resolutionToLevelIdcMap: {
        2160: '33',
        1080: '28',
        720: '1f',
        480: '1e',
        360: '16',
        272: '15',
    },
    levelIdcToReSolutionMap: {
        '15':  { width: 480, height: 272 },
        '16': { width: 640, height: 360 },
        '1e': { width: 848, height: 480 },
        '1f': { width: 1280, height: 720 },
        '28': { width: 1920, height: 1080 },
        '33': { width: 3840, height: 2160 }
    },
    maxFsToResolutionMap: {
        520: { width: 480, height: 272 },
        920: { width: 640, height: 360 },
        1596: { width: 848, height: 480 },
        3600: { width: 848, height: 480 },
        8160: { width: 848, height: 480 },
        32400: { width: 3840, height: 2160 }
    },

    /**
     * Increase SDP Session version
     * @param session
     */
    increaseSessionVersion: function (session) {
        if(session && session.origin){
            let sessionVersion = session['origin']['sessionVersion']
            sessionVersion += 1
            session['origin']['sessionVersion'] = sessionVersion
        }
    },

    /**
     * SDPTools.writeSDP(parsedSdp)
     * @param session
     * @param opts
     * @returns {string}
     */
    writeSDP: function (session, opts) {
        opts = opts || {}
        // ensure certain properties exist
        if (session.version == null) {
            session.version = 0 // 'v=0' must be there (only defined version atm)
        }
        if (session.name == null) {
            session.name = ' ' // 's= ' must be there if no meaningful name set
        }
        session.media.forEach(function (mLine) {
            if (mLine.payloads == null) {
                mLine.payloads = ''
            }
        })

        let outerOrder = opts.outerOrder || defaultOuterOrder
        let innerOrder = opts.innerOrder || defaultInnerOrder
        let sdp = []

        // loop through outerOrder for matching properties on session
        outerOrder.forEach(function (type) {
            grammar[type].forEach(function (obj) {
                if (obj.name in session && session[obj.name] != null) {
                    sdp.push(makeLine(type, obj, session))
                } else if (obj.push in session && session[obj.push] != null) {
                    session[obj.push].forEach(function (el) {
                        sdp.push(makeLine(type, obj, el))
                    })
                }
            })
        })

        // then for each media line, follow the innerOrder
        session.media.forEach(function (mLine) {
            sdp.push(makeLine('m', grammar.m[0], mLine))

            innerOrder.forEach(function (type) {
                grammar[type].forEach(function (obj) {
                    if (obj.name in mLine && mLine[obj.name] != null) {
                        sdp.push(makeLine(type, obj, mLine))
                    } else if (obj.push in mLine && mLine[obj.push] != null) {
                        mLine[obj.push].forEach(function (el) {
                            sdp.push(makeLine(type, obj, el))
                        })
                    }
                })
            })
        })

        return sdp.join('\r\n') + '\r\n'
    },

    /**
     * SDPTools.parseSDP(sdp)
     * @param sdp
     */
    parseSDP: function (sdp) {
        let session = {}
        let media = []
        let location = session // points at where properties go under (one of the above)

        // parse lines we understand
        sdp.split(/(\r\n|\r|\n)/).filter(validLine).forEach(function (line) {
            let type = line[0]
            let content = line.slice(2)
            if (type === 'm') {
                media.push({ rtp: [], fmtp: [] })
                location = media[media.length - 1] // point at latest media line
            }

            for (let j = 0; j < (grammar[type] || []).length; j += 1) {
                let obj = grammar[type][j]
                if (obj.reg.test(content)) {
                    return parseReg(obj, location, content)
                }
            }
        })

        session.media = media // link it up
        if (this.sessionVersion <= 0) {
            this.sessionVersion = session['origin']['sessionVersion']
        }
        return session
    },

    /**
     * Adjust the order of m lines (when using getCaptureStream to create multiple m lines, audio will not stay in front)
     * SDPTools.adjustMLineOrder(parsedSdp)
     */
    adjustMLineOrder: function(session, order){
        if(order){
            // Restore the m line order of setLocalDescription
            let media = []
            for(let i=0; i< session.media.length; i++){
                let type = session.media[i].content || session.media[i].type
                for(let j in order){
                    if(type === order[j]){
                        media[j] = session.media[i]
                    }
                }
            }

            if(media && media.length){
                session.media = media
            }
        }else {
            // keep audio first
            let audioArray = []
            let videoArray = []
            for (let i = 0; i < session.media.length; i++) {
                if (session.media[i].type === 'audio') {
                    audioArray.push(session.media[i])
                } else {
                    videoArray.push(session.media[i])
                }
            }

            session.media = audioArray.concat(videoArray)
        }
    },

    /**
     *  SDPTools.setGroups(parsedSdp)
     *      a=group:BUNDLE 0
     *      a=group:BUNDLE 1
     *      a=group:BUNDLE 2
     * @param session
     */
    setBundleMaxCompat: function(session){
        session.groups = []
        for(let i=0; i< session.media.length; i++){
            session.groups.push({type: "BUNDLE", mids: session.media[i].mid})
        }
    },

    /**
     * add Media a=content type
     * let contentType = ['main', 'slides']
     * SDPTools.setMediaContentType(sdp, contentType)
     * @param session
     * @param contentType
     * @returns {*|string}
     */
    setMediaContentType: function (session, contentType) {
        if(!session || !contentType){
            console.error('invalid error..')
            return
        }

        if(session.media && session.media.length){
            for(let i = 0; i<session.media.length; i++){
                let media = session.media[i]
                if(media.type === 'video' && !media.content){
                    media['content'] = contentType.shift()
                }
            }
        }
    },
    modifyBundleGroups: function (session,mid) {
        session.groups = []
        session.groups.mids = []
        for (let i = 0; i < session.media.length; i++) {
            let media = session.media[i]
            if (media.mid !== mid) {
                session.groups.mids.push(session.media[i].mid)
            }
        }
        session.groups.push({type: 'BUNDLE', mids: session.groups.mids.join(' ')})
        delete session.groups.mids
    },
    getMediaByType: function(session, type){
        if(!session || !type){
            console.error('invalid error..')
            return
        }

        let target
        if(session.media && session.media.length){
            for(let i = 0; i<session.media.length; i++){
                let media = session.media[i]
                if(media.type === 'video' && media.content === type){
                    target = media
                    break
                }
            }
        }
        return target
    },

    /**
     * payloads must be a array of NUMBERS
     * let deletePTArray = [98, 99, 127]
     * SDPTools.removeCodecByPayload(parsedSdp, 0, deletePTArray)
     * @param session
     * @param index
     * @param payloads
     */
    removeCodecByPayload: function (session, index, payloads) {
        if (index >= session.media.length) {
            console.log('Error index')
            return
        }

        let mediaSession = session.media[index]

        /*Check relative fmtp payload*/
        for (let i = 0; i < payloads.length; i += 1) {
            for (let j = 0; j < mediaSession.fmtp.length; j += 1) {
                if (mediaSession.fmtp[j].config.match('apt=' + payloads[i]) != null) {
                    if (payloads.indexOf(mediaSession.fmtp[j].payload) === -1) {
                        /*Added relative payload which also need to be removed*/
                        payloads.push(mediaSession.fmtp[j].payload)
                    }
                }
            }
        }

        /* Process payloads: Delete the pt value corresponding to m-line  */
        if(mediaSession.payloads && mediaSession.payloads.split) {
            let sessionPayloads = mediaSession.payloads.split(' ')
            for (let i = 0; i < payloads.length; i++) {
                for (let j = 0; j < sessionPayloads.length; j++) {
                    if (parseInt(payloads[i]) === parseInt(sessionPayloads[j])) {
                        sessionPayloads.splice(j, 1)
                        j--
                    }
                }
            }
            mediaSession.payloads = sessionPayloads.join(' ')
        }

        payloads.forEach(pt => {
            if (mediaSession.rtp !== undefined) {
                /*Process rtp*/
                for (let i = 0; i < mediaSession.rtp.length;) {
                    if (mediaSession.rtp[i].payload === pt) {
                        mediaSession.rtp.splice(i, 1)
                        break
                    } else {
                        i += 1
                    }
                }
            }

            if (mediaSession.fmtp !== undefined) {
                /*Process fmtp*/
                for (let i = 0; i < mediaSession.fmtp.length;) {
                    if (mediaSession.fmtp[i].payload === pt) {
                        mediaSession.fmtp.splice(i, 1)
                        //break; maybe there more than one fmtp for some payload.
                    } else {
                        i += 1
                    }
                }
            }

            if (mediaSession.rtcpFb !== undefined) {
                /*Process rtcpFb*/
                for (let i = 0; i < mediaSession.rtcpFb.length;) {
                    if (mediaSession.rtcpFb[i].payload === pt) {
                        mediaSession.rtcpFb.splice(i, 1)
                        //break; more than one rtcpFb for some payload.
                    } else {
                        i += 1
                    }
                }
            }
        })

        /*Process payloads blanks*/
        if (typeof (mediaSession.payloads) === 'string') {
            mediaSession.payloads = mediaSession.payloads.replace(/[ ]+/g, ' ').replace(/^\s*|\s*$/g,"")
        }
    },

    /**
     * Delete the codec according to the given codec list,
     *  or delete the codec other than the given codec
     *  SDPTools.removeCodecByName(parsedSdp, i, ['telephone-event', 'ISAC'])
     * @param session
     * @param index
     * @param codecList
     * @param keep
     *      {
     *          false: remove given codec （default）
     *          true: remove other codec outside the given codec
     *      }
     *
     */
    removeCodecByName: function (session, index, codecList, keep) {
        if (index >= session.media.length) {
            console.log('Error index')
            return
        }

        let payloads = []
        let mediaSession = session.media[index]
        let codecPtList = []

        /*Get payloads by names*/
        mediaSession.rtp.forEach(item => {
            if(!keep){
                // Delete given codec
                codecList.forEach(codec => {
                    if (item.codec === codec) {
                        payloads.push(item.payload)
                    }
                })
            }else {
                // Delete the codec outside the given codec
                if(!codecList.includes(item.codec)){
                    payloads.push(item.payload)
                } else {
                    codecPtList.push(item.payload)
                }
            }
        })

        // 保存保留编码pt关联的的rtx行
        codecPtList.map(item => {
            mediaSession.fmtp.forEach(itemIn => {
                if(itemIn.config.match('apt=' + item)){
                    let rtxPtIndex = payloads.indexOf(itemIn.payload)
                    if(rtxPtIndex >= 0){
                        payloads.splice(rtxPtIndex, 1)
                    }
                }
            })
        });

        this.removeCodecByPayload(session, index, payloads)
    },

    removeInvalidCode: function(sdp){
        let parsedSdp = SDPTools.parseSDP(sdp)
        let payloadUpdate = false

        for (let i = 0; i < parsedSdp.media.length; i++){
            let media = parsedSdp.media[i]
            let removePayloads = []

            if(media.type === 'video'){
                if(media.payloads && media.payloads.split){  // There is no split if only one PT
                    let mediaPayloads = media.payloads.split(' ')

                    // 1.If fmtp or apt payload does not exist in m-section, delete fmtp and apt
                    if(media.fmtp && media.fmtp.length){
                        for(let j = 0; j<media.fmtp.length; j++){
                            let fmtpPT = String(media.fmtp[j].payload)
                            let aptPT
                            if(media.fmtp[j].config && media.fmtp[j].config.match('apt=')){
                                aptPT = media.fmtp[j].config.split('=')[1]
                            }

                            if((aptPT && mediaPayloads.indexOf(aptPT) < 0) || mediaPayloads.indexOf(fmtpPT) < 0){
                                if(aptPT){
                                    console.log('invalid apt payload: ', aptPT)
                                    removePayloads.push(aptPT)
                                }
                                removePayloads.push(fmtpPT)
                                console.log('invalid fmtp payload: ', fmtpPT)
                            }
                        }
                    }

                    // 2.If rtp does not exist, delete
                    if(media.rtp && media.rtp.length){
                        for(let K = 0; K<media.rtp.length; K++){
                            let rtpPT = String(media.rtp[K].payload)
                            if(mediaPayloads.indexOf(rtpPT) < 0){
                                console.log('invalid rtp payload: ', rtpPT)
                                removePayloads.push(rtpPT)
                            }
                        }
                    }

                    // 3.If rtcpFb does not exist, delete
                    if(media.rtcpFb && media.rtcpFb.length){
                        for(let K = 0; K<media.rtcpFb.length; K++){
                            let rtcpFbPT = String(media.rtcpFb[K].payload)
                            if(mediaPayloads.indexOf(rtcpFbPT) < 0){
                                console.log('invalid rtcpFb payload: ', rtcpFbPT)
                                removePayloads.push(rtcpFbPT)
                            }
                        }
                    }
                }

                if(removePayloads.length){
                    removePayloads = (function(){
                        return Array.from(new Set(removePayloads))
                    })()
                    for(let k = 0; k<removePayloads.length; k++){
                        removePayloads[k] = parseInt(removePayloads[k])  // need int type payload
                    }

                    console.log("Delete invalid payload ", removePayloads)
                    this.removeCodecByPayload(parsedSdp, i, removePayloads)
                    payloadUpdate = true
                }
            }
        }

        if(payloadUpdate){
            sdp = SDPTools.writeSDP(parsedSdp)
        }
        return sdp
    },

    /**
     * get the capabilities of media
     * @param sdp
     * @param excludeList
     * @returns {null|{audioCodecs: [], videoCodecs: []}}
     */
    getRTCRtpCapabilities: function(sdp, excludeList){
        if (!sdp) {
            console.warn('no sdp')
            return null
        }
        if(!excludeList || !excludeList.length){
            console.error('excludeList is not allowed to be empty')
            return null
        }
        /* Define the static rtp payload mappings */
        let staticPayloads = {
            '0': 'PCMU',
            '3': 'GSM',
            '4': 'G723',
            '5': 'DVI4',
            '6': 'DVI4',
            '7': 'LPC',
            '8': 'PCMA',
            '9': 'G722',
            '10': 'L16',
            '11': 'L16',
            '12': 'QCELP',
            '13': 'CN',
            '14': 'MPA',
            '15': 'G728',
            '16': 'DVI4',
            '17': 'DVI4',
            '18': 'G729',
            '25': 'CelB',
            '26': 'JPEG',
            '28': 'nv',
            '31': 'H261',
            '32': 'MPV',
            '33': 'MP2T',
            '34': 'H263',
        }

        let capabilities = { haveAudio: false, haveVideo: false }
        // Only one video media line is parsed
        let hasVideoGet = false
        let session = SDPTools.parseSDP(sdp)
        if (session && session.media && session.media.length) {
            for (let i = 0; i < session.media.length; i++) {
                let media = session.media[i]
                if (media.type === 'audio') {
                    capabilities.haveAudio = true
                    if(!capabilities.audioCodecs){
                        capabilities.audioCodecs = []
                    }

                    if (media.rtp && media.rtp.length) {
                        for (let j = 0; j < media.rtp.length; j++) {
                            let rtp = media.rtp[j]
                            // get audio dynamic encoding
                            if (rtp.codec && !excludeList.includes(rtp.codec) && !capabilities.audioCodecs.includes(rtp.codec)) {
                                capabilities.audioCodecs.push(rtp.codec)
                            }
                        }
                    }

                    let payloads = media.payloads && media.payloads.split(' ')
                    if(payloads && payloads.length){
                        console.info('find static payloads')
                        payloads.forEach(function(pt){
                            // get audio static coding: Only static payload a=fmtp can be defaulted width SIP compression head
                            if(pt<96 && !capabilities.audioCodecs.includes(staticPayloads[pt])){
                                capabilities.audioCodecs.push(staticPayloads[pt])
                            }
                        })
                    }
                } else if (media.type === 'video' && !hasVideoGet) {
                    capabilities.haveVideo = true
                    if(!capabilities.videoCodecs){
                        capabilities.videoCodecs = []
                    }

                    if (media.rtp && media.rtp.length) {
                        for (let j = 0; j < media.rtp.length; j++) {
                            let rtp = media.rtp[j]
                            // get video dynamic coding
                            if (rtp.codec && !excludeList.includes(rtp.codec) && !capabilities.videoCodecs.includes(rtp.codec)) {
                                capabilities.videoCodecs.push(rtp.codec)
                            }
                        }
                    }
                    hasVideoGet = true
                }
            }
        }

        return capabilities
    },

    /**
     * get PT by codec name
     * @param session
     * @param index
     * @param codecList
     * @returns {*}
     */
    getCodecByName: function(session, index, codecList){
        if (index >= session.media.length) {
            console.log('Error index')
            return
        }

        let payloads = []
        let mediaSession = session.media[index]

        /*Get payloads by names*/
        mediaSession.rtp.forEach(item => {
            codecList.forEach(codec => {
                if (item.codec === codec) {
                    payloads.push(item.payload)
                }
            })
        })

        return payloads
    },

    /**
     * set h264 level-id
     * @param session
     * @param index
     * @param height
     */
    setH264Resolution: function(session, index, height){
        if(!session || !height){
            console.warn('h264 res: Invalid argument!')
            return
        }
        let levelIdc = this.resolutionToLevelIdcMap[height] || '16'
        let h264Codec = this.getCodecByName(session, index, ['H264'])
        let media = session.media[index]

        if(media){
            let fmtp = media.fmtp
            if(fmtp.length > 0){
                for(let i = 0; i < fmtp.length; i++){
                    let index  = fmtp[i].config.indexOf('profile-level-id')
                    if(index >= 0){
                        let str = fmtp[i].config.substr(index, 21);
                        let replacement =  str + levelIdc ;
                        fmtp[i].config = fmtp[i].config.replace(/profile-level-id=([a-zA-Z0-9]{6})/, replacement);
                    }else{
                        let rtxApt
                        if (fmtp[i].config.indexOf('apt=') >= 0) {
                            rtxApt = parseInt(fmtp[i].config.match('apt=[0-9]+')[0].split('=')[1])
                        }

                        if(h264Codec.includes(fmtp[i].payload) || h264Codec.includes(rtxApt)){
                            fmtp[i].config =  fmtp[i].config + ';profile-level-id=42e0' + levelIdc
                        }
                    }
                }
            }else {
                console.info('profile-level-id fmtp filed has not been find')
            }
        }else {
            console.log('no media')
        }
    },

    /**
     * set VP8 max-fs
     * @param session
     * @param index
     * @param width
     * @param height
     */
    setVp8Resolution: function(session, index, width, height){
        if(!session || !width || !height){
            console.warn('VP8 res: Invalid argument!')
            return
        }
        let mbWidth = (parseInt(width, 10) + 15) / 16;
        let mbHeight = (parseInt(height, 10) + 15) / 16;
        let maxFs = Math.floor(mbWidth) * Math.floor(mbHeight);

        let vp8Codec = this.getCodecByName(session, index, ['VP8'])
        let media = session.media[index]
        if(media){
            let fmtp = media.fmtp
            for (let i = 0; i < fmtp.length; i++) {
                let index = fmtp[i].config.indexOf('max-fs')
                if (index >= 0) {
                    let replacement = 'max-fs=' + maxFs;
                    fmtp[i].config = fmtp[i].config.replace(/max-fs=([a-zA-Z0-9]{3,5})/, replacement);
                }else {
                    let rtxApt
                    if (fmtp[i].config.indexOf('apt=') >= 0) {
                        rtxApt = parseInt(fmtp[i].config.match('apt=[0-9]+')[0].split('=')[1])
                    }

                    if(vp8Codec.includes(fmtp[i].payload) || vp8Codec.includes(rtxApt)){
                        fmtp[i].config = fmtp[i].config + ';max-fs=' + maxFs
                    }
                }
            }
        }else {
            console.warn('no media found')
        }
    },

    /**
     * set resolution vp8 and h264
     * @param session
     * @param index
     * @param width
     * @param height
     * @returns {null}
     */
    setResolution: function(session, index, width, height){
        if (!session || !width || !height) {
            console.error("Invalid argument");
            return null;
        }

        this.setH264Resolution(session, index, height)
        this.setVp8Resolution(session, index, width, height)
    },

    /**
     * get H264 resolution
     * @param session
     * @param index
     * @returns {{width: number, height: number}}
     */
    getH264Resolution: function(session, index){
        let resolution
        let levelIdc

        let media = session.media[index]
        if(media){
            for(let i = 0; i<media.fmtp.length; i++){
                let index = media.fmtp[i].config.indexOf('profile-level-id=')
                if(index >= 0){
                    let levelId = media.fmtp[i].config.match('profile-level-id=[a-zA-Z0-9]{6}')[0].split('=')[1]
                    levelIdc = levelId.substr(4, 2).toLocaleLowerCase()
                    break
                }
            }
            resolution = this.levelIdcToReSolutionMap[levelIdc] || { width: 640, height: 360 }
        }

        return resolution
    },

    /**
     * get vp8 resolution
     * @param session
     * @param index
     * @returns {{width: number, height: number}}
     */
    getVp8Resolution: function(session, index){
        let resolution
        let maxFs

        let media = session.media[index]
        if(media){
            for(let i = 0; i<media.fmtp.length; i++){
                let index = media.fmtp[i].config.indexOf('max-fs=')
                let resolution
                if(index >= 0){
                    maxFs = parseInt(media.fmtp[i].config.match('max-fs=[0-9]+')[0].split('=')[1])
                    break
                }
            }

            maxFs = parseInt(maxFs)
            resolution = this.maxFsToResolutionMap[maxFs] || { width: 640, height: 360 }
        }

        return resolution
    },

    /**
     * get Priority code resolution
     *  SDPTools.getResolution(parsedSdp, 1, 'VP8') or SDPTools.getResolution(parsedSdp, 1)
     * @param session
     * @param index
     * @param codec
     * @returns {*|string|{width: number, height: number}}
     */
    getResolution: function(session, index, codec){
        if(!session || (!index && index !== 0)){
            console.error("Invalid argument");
            return
        }

        codec = codec || this.getPriorityCodec(session, index)
        let resolution
        if(codec === 'H264'){
            resolution = this.getH264Resolution(session, index)
        }else if(codec === 'VP8'){
            resolution = this.getVp8Resolution(session, index)
        }

        return resolution
    },

    /**
     * Get the first PT value in SDP
     * @param session
     * @param index
     * @returns {*}
     */
    getPriorityCodec: function(session, index){
        if(!session){
            console.warn('setFrameRate: Invalid argument!')
            return
        }

        let media = session.media[index]
        let codec
        if(media){
            if(media.rtp && media.rtp.length){
                for(let i = 0; i<media.rtp.length; i++){
                    if(media.rtp[i].codec && media.rtp[i].codec !== 'rtx'){
                        codec = media.rtp[i].codec
                        break
                    }
                }
            }
        }
        return codec
    },

    /**
     * set frameRate
     * framerate calculation order: framerate > max-fr
     * @param session
     * @param index
     * @param framerate
     */
    setFrameRate: function(session, index, framerate){
        if(!session || !framerate){
            console.warn('setFrameRate: Invalid argument!')
            return
        }

        let media = session.media[index]
        if(media){
            if(media.framerate){
                media.framerate = framerate
            }else if(media.fmtp && media.fmtp.length > 0){
                let fmtp = media.fmtp
                for(let i = 0; i < fmtp.length; i++){
                    let index = fmtp[i].config.indexOf('max-fr')
                    if (index >= 0) {
                        let replacement =  'max-fr=' + framerate ;
                        fmtp[i].config = fmtp[i].config.replace(/max-fr=([a-zA-Z0-9]{1,2})/, replacement);
                    }
                }
            }
        }
    },

    /**
     * get frameRate
     * framerate calculation order: framerate > max-fr
     * @param session
     * @param index
     * @returns {*}
     */
    getFramerate: function(session, index){
        let media = session.media[index]
        let framerate = null

        if(media){
            if(media.framerate){
                framerate = media.framerate
            }else if(media.fmtp && media.fmtp.length > 0){
                let fmtp = media.fmtp
                for(let i = 0; i<fmtp.length; i++){
                    let pos_max_fr = fmtp[i].config.indexOf('max-fr')
                    if (pos_max_fr >= 0) {
                        var max_fr = fmtp[i].config.substring(pos_max_fr + 7);
                        var end = max_fr.indexOf(';');
                        if (end >= 0) {
                            max_fr = max_fr.substring(0, end);
                        }
                        framerate =  parseInt(max_fr);
                    }
                }
            }
        }
        return framerate
    },

    /**
     * Process bandwidth relative: b line
     * AS = TIAS/1000 + 192
     * @param session
     * @param index
     * @param bitRate
     */
    setMediaBandwidth: function (session, index, bitRate) {
        if(!session || !bitRate){
            return
        }

        // There will be problems when the bandwidth 172 is less than 192
        let bandwidth = {AS: bitRate/1000 + 192, TIAS: bitRate}
        let media = session.media[index]
        if(media){
            if(media.bandwidth && media.bandwidth.length){
                media.bandwidth.forEach(function (item){
                    item.limit = bandwidth[item.type]
                })
            }else {
                media.bandwidth = []
                Object.keys(bandwidth).forEach(function (key) {
                    if(key){
                        media.bandwidth.push({
                            type: key,
                            limit: bandwidth[key]
                        })
                    }
                })
            }
        }
    },

    setXgoogle: function(media, h264Codec, bitrate){
        if(media.type === 'audio'){
            return
        }

        if(media.fmtp && media.fmtp.length) {
            for (let i = 0; i < media.fmtp.length; i++) {
                if (h264Codec.includes(media.fmtp[i].payload)) {
                    let config = media.fmtp[i].config
                    if (config.indexOf('x-google-min-bitrate=') >= 0) {
                        config = config.replace(/x-google-min-bitrate=([a-zA-Z0-9]{1,8})/, 'x-google-min-bitrate=' + bitrate)
                    } else {
                        config = config + ';x-google-min-bitrate=' + bitrate
                    }

                    if (config.indexOf('x-google-start-bitrate=') >= 0) {
                        config = config.replace(/x-google-start-bitrate=([a-zA-Z0-9]{1,8})/, 'x-google-start-bitrate=' + bitrate)
                    } else {
                        config = config + ';x-google-start-bitrate=' + bitrate
                    }

                    if (config.indexOf('x-google-max-bitrate=') >= 0) {
                        config = config.replace(/x-google-max-bitrate=([a-zA-Z0-9]{1,8})/, 'x-google-max-bitrate=' + bitrate)
                    } else {
                        config = config + ';x-google-max-bitrate=' + bitrate
                    }
                    media.fmtp[i].config = config
                }
            }
        }
    },

    /**
     * set x-google-min-bitrate;x-google-start-bitrate;x-google-max-bitrate
     * @param session
     * @param bitrate
     * @param index
     */
    setXgoogleBitrate: function(session, bitrate, index){
        if(index || index === 0){
            let h264Codec = this.getCodecByName(session, index, ['H264'])
            let media = session.media[index]
            this.setXgoogle(media, h264Codec, bitrate)
        }else {
            // When the index parameter does not exist, modify all media rows
            for(let i = 0; i<session.media.length; i++){
                let h264Codec = this.getCodecByName(session, i, ['H264'])
                let media = session.media[i]
                this.setXgoogle(media, h264Codec, bitrate)
            }
        }
    },

    removeRembAndTransportCC: function(session, index){
        let deleteRembTransportCC = function (media){
            if(media.rtcpFb && media.rtcpFb.length){
                for(let j = 0; j<media.rtcpFb.length; j++){
                    let type = media.rtcpFb[j].type
                    if(type && (type.indexOf('goog-remb') >= 0 || type.indexOf('transport-cc') >= 0)){
                        media.rtcpFb.splice(j, 1)
                        j--
                    }
                }
            }
        }

        if(index !== undefined){
            let media = session.media[index]
            deleteRembTransportCC(media)
        }else {
            // When the index parameter does not exist, modify all media rows
            for(let i = 0; i<session.media.length; i++){
                deleteRembTransportCC(session.media[i])
            }
        }
    },

    /**
     * add candidate
     * @param media
     * @param candidate: candidate:956527311 1 udp 2122260223 192.168.9.9 9 typ host generation 0
     */
    addCandidate: function(media, candidate){
        if(!media || !candidate){
            return
        }

        if(!media.candidates || !media.candidates.length){
            media.candidates = []
        }

        let type = candidate[0]
        let content = candidate.slice(2)
        for (let j = 0; j < (grammar[type] || []).length; j += 1) {
            let obj = grammar[type][j]
            if (obj.reg.test(content)) {
                let keyLocation = {}
                attachProperties(content.match(obj.reg), keyLocation, obj.names, obj.name)
                if(keyLocation && !keyLocation.value){
                    media.candidates.push(keyLocation)
                }
            }
        }
    },

    parseFmtpConfig: function (str) {
        return str.split(/;\s?/).reduce(paramReducer, {})
    },

    parsePayloads: function (str) {
        return str.toString().split(' ').map(Number)
    },

    parseRemoteCandidates: function (str) {
        let candidates = []
        let parts = str.split(' ').map(toIntIfInt)
        for (let i = 0; i < parts.length; i += 3) {
            candidates.push({
                component: parts[i],
                ip: parts[i + 1],
                port: parts[i + 2]
            })
        }
        return candidates
    },

    parseImageAttributes: function (str) {
        return str.split(' ').map(function (item) {
            return item.substring(1, item.length - 1).split(',').reduce(paramReducer, {})
        })
    },

    parseSimulcastStreamList: function (str) {
        return str.split(';').map(function (stream) {
            return stream.split(',').map(function (format) {
                let scid
                let paused = false

                if (format[0] !== '~') {
                    scid = toIntIfInt(format)
                } else {
                    scid = toIntIfInt(format.substring(1, format.length))
                    paused = true
                }

                return { scid: scid, paused: paused }
            })
        })
    },

    /*Merge SDP, SDPs must be a SDP STRING array*/
    mergeSDP: function (SDPs) {
        let mergedSDP
        let mergedSession
        let sessions = []

        for (let i = 0; i < SDPs.length; i += 1) {
            sessions[i] = this.parseSDP(SDPs[i])
        }

        /***Process msid mapping***/
        //for ( let i = 0; i < SDPs.length; i += 1 ) {
        //    sessions[i].media.msid
        //}

        /***Process mid mapping***/
        let id = 0
        for (let i = 0; i < SDPs.length; i += 1) {
            for (let j = 0; j < sessions[i].media.length; j += 1) {
                let item = {}
                item['msid'] = sessions[i].media[j].msid
                item['mid'] = sessions[i].media[j].mid
                item['mappedMID'] = id
                this.midMap.push(item)

                /*Modified the group a line*/
                if (typeof (sessions[i].groups[0].mids) === 'string') {
                    sessions[i].groups[0].mids = sessions[i].groups[0].mids.replace(sessions[i].media[j].mid, id)
                } else if (typeof (sessions[i].groups[0].mids) === 'number') {
                    sessions[i].groups[0].mids = id
                } else {
                    console.log('ERROR on Process mid mapping')
                }

                /*Modified the mid*/
                sessions[i].media[j].mid = id

                id += 1
            }
        }

        /***Merge session level part***/
        if (sessions[0].groups === undefined) {
            sessions[0].groups = []
        }

        if (sessions[0].msidSemantics === undefined) {
            sessions[0].msidSemantics = []
        }

        for (let i = 0; i < SDPs.length; i += 1) {
            console.log('Session ' + i + 'th:\n' + sessions[i])
            /*Process ssesion fingerprint a line*/
            if (sessions[i].fingerprint !== undefined) {
                sessions[i].media.forEach(
                    function (m) {
                        m['fingerprint'] = deepCopy(sessions[i].fingerprint)
                    })

                delete sessions[i].fingerprint
            }

            /*Process copy all groups a line*/
            if (sessions[i].groups !== undefined) {
                if (i > 0) {
                    sessions[i].groups.forEach(
                        function (g) {
                            sessions[0].groups.push(deepCopy(g))
                        })
                }
            }

            /*Process MSID a line*/
            if (sessions[i].msidSemantics !== undefined) {
                if (i > 0) {
                    sessions[i].msidSemantics.forEach(
                        function (msid) {
                            sessions[0].msidSemantics.push(deepCopy(msid))
                        })
                }
            }

        }

        /***Merge media level part***/
        for (let i = 0; i < SDPs.length; i += 1) {
            if (sessions[i].media !== undefined) {
                if (i > 0) {
                    sessions[i].media.forEach(
                        function (m) {
                            sessions[0].media.push(deepCopy(m))
                        })
                }
            }
        }

        /***Process C line and port of M line, if has ICE candidate***/
        mergedSDP = this.writeSDP(sessions[0])
        return mergedSDP
    },

    /*Split SDP, return SDP STRING array*/
    splitSDP: function (SDP) {
        let sdpArray = []
        let session = this.parseSDP(SDP)
        if (session.groups === undefined) {
            console.log('No GROUP information, need to split m lines to each pc')
            session.groups = []
            this.midMap = []
            for (let i = 0; i < session.media.length; i += 1) {
                /*Make fake groups*/
                session.groups.push({ type: 'BUNDLE', mids: session.media[i].mid })
                let item = {}
                item['msid'] = session.media[i].msid
                item['mid'] = 0
                item['mappedMID'] = session.media[i].mid
                this.midMap.push(item)
            }
        }

        for (let i = 0; i < session.groups.length; i += 1) {
            let sdp
            let sess = deepCopy(session)

            sess.groups = new Array(sess.groups[i])
            if (sess.msidSemantics !== undefined) {
                sess.msidSemantics = new Array(sess.msidSemantics[i])
            } else {
                delete sess.msidSemantics
            }
            let media = []

            if (typeof (sess.groups[i].mids) === 'number') {
                for (let j = 0; j < sess.media.length; j += 1) {
                    if (sess.media[j].mid === sess.groups[i].mids) {
                        media.push(sess.media[j])
                        break
                    }
                }
            } else if (typeof (sess.groups[i].mids) === 'string') {
                sess.groups[0].mids.split(' ').forEach(mid => {
                    for (let j = 0; j < sess.media.length; j += 1) {
                        if (sess.media[j].mid === mid) {
                            media.push(sess.media[j])
                            break
                        }
                    }
                })
            }
            sess.media = media

            /***Revert the mid mapping***/
            for (let k = 0; k < sess.media.length; k += 1) {
                for (let l = 0; l < this.midMap.length; l += 1) {
                    if (sess.media[k].mid === this.midMap[l].mappedMID) {
                        sess.media[k].mid = this.midMap[l].mid

                        if (typeof (sess.groups[0].mids) === 'string') {
                            sess.groups[0].mids = sess.groups[0].mids.replace(sess.media[k].mid, this.midMap[l].mid)
                        } else if (typeof (sess.groups[0].mids) === 'number') {
                            sess.groups[0].mids = this.midMap[l].mid
                        } else {
                            console.log('ERROR on Process mid mapping')
                        }
                        break
                    }
                }
            }

            /***Revert the msid mapping***/
            sdp = this.writeSDP(sess)
            sdpArray.push(sdp)
        }
        return sdpArray
    }
};
