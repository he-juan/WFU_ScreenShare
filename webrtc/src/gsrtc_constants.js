GsRTC.prototype.HTML_MEDIA_ELEMENT = {
    localAudio: null,
    localVideo: null,
    localPresentVideo: null,
    localVideoShare: null,
    remoteAudio: null,
    remoteVideo: null,
    remotePresentVideo: null,
    remoteVideoShare: null,
}

/**
 * save local && remote stream
 * @type {{LOCAL_PRESENT_STREAM: null, LOCAL_VIDEO_SHARE_STREAM: null, REMOTE_VIDEO_SHARE_STREAM: null, LOCAL_AUDIO_STREAM: null, REMOTE_PRESENT_STREAM: null, REMOTE_AUDIO_STREAM: null, LOCAL_VIDEO_STREAM: null, REMOTE_VIDEO_STREAM: null}}
 */
GsRTC.prototype.MEDIA_STREAMS = {
    LOCAL_AUDIO_STREAM: null,
    REMOTE_AUDIO_STREAM: null,
    LOCAL_VIDEO_STREAM: null,
    REMOTE_VIDEO_STREAM: null,
    LOCAL_PRESENT_STREAM: null,
    REMOTE_PRESENT_STREAM: null,
    LOCAL_VIDEO_SHARE_STREAM : null,
    REMOTE_VIDEO_SHARE_STREAM : null
};

/**
 * Save upstream or downstream resolution
 * @type {{EXPECT_RECV_RESOLUTION: {}, CURRENT_UP_RESOLUTION: {}}}
 */
GsRTC.prototype.VIDEO_RESOLUTION = {
    CURRENT_UP_RESOLUTION: {},
    EXPECT_RECV_RESOLUTION: {},
}

GsRTC.prototype.MID_OBJ = {
    AUDIO_MID: {
        ORIGINAL_MID: null,
        MODIFIED_MID: null
    },
    MAIN_MID: {
        ORIGINAL_MID: null,
        MODIFIED_MID: null
    },
    SLIDES_MID: {
        ORIGINAL_MID: null,
        MODIFIED_MID: null
    },
}

