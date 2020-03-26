
var gulp = require('gulp');
var concat = require('gulp-concat');  // 合并文件。
var uglify = require('gulp-uglify');   // 压缩js文件大小
var foreach = require('gulp-foreach');  // 文件循环
var order = require("gulp-order");
var gutil = require('gulp-util');    // 处理日志相关的信息
var combiner = require('stream-combiner2');  // 处理错误
var sourcemaps = require('gulp-sourcemaps');   // source map生成
var javascriptObfuscator = require('gulp-javascript-obfuscator');   //js压缩混淆的gulp插件
var git = require('gulp-git');  //改变版本号以及创建一个 git tag
var fs = require('fs');

var release_lists = [
    './src/debug.js',
    './src/common.js',
    './src/sdp_tools.js',
    './src/mediaDevice.js',
    './src/gsrtc.js',
    './src/gsrtc_api.js',
    './src/gsrtc_code.js',
    './src/gsrtc_common.js',
    './src/gsrtc_signaling.js',
    './src/gsrtc_jsep.js',
    './src/gsrtc_connection.js',
    './src/gsrtc_constants.js',
    './src/gsrtc_event.js',
    './src/gsrtc_stream.js',
    './src/gsrtc_ice.js',
    './src/gsrtc_resolution.js',
    './src/gsrtc_sdp.js',
    './src/gsrtc_websocket.js',
    './src/gsrtc_stats.js',
]

var handleError = function (err) {
    var colors = gutil.colors;
    console.log('\n');
    console.log(err)
    gutil.log(colors.red('Error!'));
    gutil.log('fileName: ' + colors.red(err.fileName));
    gutil.log('lineNumber: ' + colors.red(err.lineNumber));
    gutil.log('message: ' + err.message);
    gutil.log('plugin: ' + colors.yellow(err.plugin))
}

/**
 * All files are packaged into one, include debug.js adapter.js
 */
gulp.task('allPackageMerge', function () {
    var combined = combiner.obj([
        gulp.src(release_lists)
            .pipe(foreach((stream, file) => {
                console.log(file.path);
                return stream;
            }))
            .pipe(concat('gsRTC.min.js')),
        sourcemaps.init(),
        // uglify({
        //     mangle: false,
        //     compress: false,
        //     preserveComments: false,
        //     toplevel: true
        // }),
        sourcemaps.write('./'),
        gulp.dest('./dist/')
    ])
    combined.on('error', handleError)
});


gulp.task('default',function(){
    gulp.run('allPackageMerge');
});


/***
 *
 * 改变版本号以及创建一个 git tag：打tag前先修改package.json文件的version值
 */
gulp.task('createNewTag', function (cb) {
    var version = getPackageJsonVersion();
    console.log(version);
    git.tag(version, 'Created Tag for version: ' + version, function (error) {
        if (error) {
            return cb(error);
        }
        git.push('origin', 'master', {args: '--tags'}, cb);
    });

    function getPackageJsonVersion () {
        // 这里我们直接解析 json 文件而不是使用 require，这是因为 require 会缓存多次调用，这会导致版本号不会被更新掉
        return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
    };
});

/****
 * 文件自动打包监听
 */
gulp.task('watch',function(){
    gulp.watch(release_lists, function(event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
        gulp.run('gsRTCTask');
    });
});

