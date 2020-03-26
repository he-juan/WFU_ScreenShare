/**
 * 画星星
 * @type {HTMLElement}
 */
var canvas = document.getElementById('slidesCanvas');
var c = canvas.getContext('2d');
c.fillStyle = 'gray';
c.fillRect(0,0,700,700)
var target=[{}];
for (var i = 0; i <= 60; i++) {
    var obj = {}
    obj.x = randomNum(30,770);
    obj.y= randomNum(30,470);
    obj.speedX = randomNum(-2,2);
    obj.speedY=randomNum(-2,2);
    obj.deg = randomNum(0,180)
    target[i]=obj;
    drawStar(c,target[i].x,target[i].y,10,5,target[i].deg);
};

setInterval(function() {
    //更新画布
    c.clearRect(0,0,800,500);
    c.fillStyle = 'gray';
    c.fillRect(0,0,800,500)
    //绘制星星
    for (var i = 0; i <= 60; i++) {

        target[i].x = target[i].x+target[i].speedX;
        target[i].y = target[i].y+target[i].speedY;

        //保证星星速度不为零
        if(target[i].speedX==0){
            target[i].speedX=1
        }
        if(target[i].speedY==0){
            target[i].speedY=1
        }
        //星星运动到边界后往回运动
        if(target[i].x>=770){
            target[i].speedX = -randomNum(1,2);
        }
        if(target[i].x<=30){
            target[i].speedX = randomNum(1,2);
        }
        if(target[i].y>=470){
            target[i].speedY = -randomNum(1,2);
        }
        if(target[i].y<=30){
            target[i].speedY = randomNum(1,2);
        }
        drawStar(c,target[i].x,target[i].y,20,10,target[i].deg);
    }

},1.7);
//取随机数
function randomNum(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
}
//画星星
//x, y为圆心坐标，R、r分别为大圆、小圆半径,rot旋转角度
function drawStar(cxt, x, y, r, R, rot){
    cxt.beginPath();
    for(var i = 0; i < 5; i ++){
        cxt.lineTo( Math.cos( (18 + i*72 - rot)/180 * Math.PI) * R + x,
            -Math.sin( (18 + i*72 - rot)/180 * Math.PI) * R + y)
        cxt.lineTo( Math.cos( (54 + i*72 - rot)/180 * Math.PI) * r + x,
            -Math.sin( (54 + i*72 - rot)/180 * Math.PI) * r + y)
    }
    cxt.closePath();
    cxt.lineWidth = 3;
    cxt.fillStyle = "#fb3";
    cxt.strokeStyle = "#fb5";
    cxt.lineJoin = "round";
    cxt.fill();
    cxt.stroke();
}


/**
 * 画爆竹
 * @type {HTMLElement}
 */
var myCanvas = document.getElementById( 'canvasForCaptureStream' );
var ctx = myCanvas.getContext( '2d' );

var count = 80;

var colors = [];

// 生成随机颜色
for ( var i = 0; i < count; i++ )  {
    colors.push(
        'rgb( ' +
        ( Math.random() * 255 >> 0 ) + ',' +
        ( Math.random() * 255 >> 0 ) + ',' +
        ( Math.random() * 255 >> 0 ) +
        ' )'
    );
}

var percent = 0;

ctx.lineWidth = 2;

function animate() {

    ctx.clearRect( 0, 0, 1000, 1000 );

    var center = [ 300, 300 ];
    var radius = 300;

    for ( var i = 0; i < count; i++ ) {

        var angle = Math.PI * 2 / count * i;
        var x = center[ 0 ] + radius * Math.sin( angle );
        var y = center[ 1 ] + radius * Math.cos( angle );

        ctx.strokeStyle = colors[ i ];

        ctx.beginPath();

        drawCurvePath(
            ctx,
            center,
            [ x, y ],
            0.4,
            percent
        );

        ctx.stroke();

    }

    percent = ( percent + 1 ) % 100;

    requestAnimationFrame( animate );

}

animate();

function drawCurvePath( ctx, start, end, curveness, percent ) {

    var cp = [
        ( start[ 0 ] + end[ 0 ] ) / 2 - ( start[ 1 ] - end[ 1 ] ) * curveness,
        ( start[ 1 ] + end[ 1 ] ) / 2 - ( end[ 0 ] - start[ 0 ] ) * curveness
    ];

    var t = percent / 100;

    var p0 = start;
    var p1 = cp;
    var p2 = end;

    var v01 = [ p1[ 0 ] - p0[ 0 ], p1[ 1 ] - p0[ 1 ] ];     // 向量<p0, p1>
    var v12 = [ p2[ 0 ] - p1[ 0 ], p2[ 1 ] - p1[ 1 ] ];     // 向量<p1, p2>

    var q0 = [ p0[ 0 ] + v01[ 0 ] * t, p0[ 1 ] + v01[ 1 ] * t ];
    var q1 = [ p1[ 0 ] + v12[ 0 ] * t, p1[ 1 ] + v12[ 1 ] * t ];

    var v = [ q1[ 0 ] - q0[ 0 ], q1[ 1 ] - q0[ 1 ] ];       // 向量<q0, q1>

    var b = [ q0[ 0 ] + v[ 0 ] * t, q0[ 1 ] + v[ 1 ] * t ];

    ctx.moveTo( p0[ 0 ], p0[ 1 ] );

    ctx.quadraticCurveTo(
        q0[ 0 ], q0[ 1 ],
        b[ 0 ], b[ 1 ]
    );

}