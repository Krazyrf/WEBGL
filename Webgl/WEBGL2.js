window.onload=function(){
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var img;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var mouseX = null,
        mouseY = null;
    var mouseRadius = 60;//指针半径初始量 50
    var RAF = (function() {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    })();
    Array.prototype.forEach = function(callback) {
        for (var i = 0; i < this.length; i++) {
            callback.call((typeof this[i] === "object") ? this[i] : window, i, this[i]);
        }
    };
    window.onmousemove = function(e) {
        if (e.target.tagName == "CANVAS") {
            mouseX = e.clientX - e.target.getBoundingClientRect().left;
            mouseY = e.clientY - e.target.getBoundingClientRect().top;
        } else {
            mouseX = null;
            mouseY = null;
        }
    };
    var particleArray = [];
    var animateArray = [];
    var particleSize_x = 1;
    var particleSize_y = 2;
    var canvasHandle = {
        init: function() {
            this._reset();
            this._initImageData();
            this._execAnimate();
        },
        _reset: function() {
            particleArray.length = 0;//填充
            animateArray.length = 0;
            this.ite = 300;//生成初始量 ite=30
            this.start = 0;//开头占有量
            this.end = this.start + this.ite;
        },
        _initImageData: function() {
            this.imgx = (canvas.width - img.width) / 2;
            this.imgy = (canvas.height - img.height) / 2;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, this.imgx, this.imgy, img.width, img.height);
            var imgData = ctx.getImageData(this.imgx, this.imgy, img.width, img.height);
            for (var x = 0; x < img.width; x += particleSize_x) {
                for (var y = 0; y < img.height; y += particleSize_y) {
                    var i = (y * imgData.width + x) * 4;//生成复制 default=4 需更改画布大小 
                    if (imgData.data[i + 3] >= 125) {
                        var color = "rgba(" + imgData.data[i] + "," + imgData.data[i + 1] + "," + imgData.data[i + 2] + "," + imgData.data[i + 3] + ")";
                        var x_random = x + Math.random() * 200,//粒子生成X纵深
                            vx = -Math.random() * 200 + 400,//x横向生成惯性
                            y_random = img.height / 2 - Math.random() * 40 + 20,
                            vy;
                        if (y_random < this.imgy + img.height / 2) {
                            vy = Math.random() * 300;//粒子生成Y纵深
                        } else {
                            vy = -Math.random() * 300;
                        }
                        particleArray.push(
                            new Particle(
                                x_random + this.imgx,
                                y_random + this.imgy,
                                x + this.imgx,
                                y + this.imgy,
                                vx,
                                vy,
                                color
                            )
                        );
                        particleArray[particleArray.length - 1].drawSelf();
                    }
                }
            }
        },
        _execAnimate: function() {
            var that = this;
            //var mouseSize = 10;
            particleArray.sort(function(a, b) {
                return a.ex - b.ex;
            });
            if (!this.isInit) {
                this.isInit = true;
                animate(function(tickTime) {
                    if (animateArray.length < particleArray.length) {
                        if (that.end > (particleArray.length - 1)) {
                            that.end = (particleArray.length - 1)
                        }
                        animateArray = animateArray.concat(particleArray.slice(that.start, that.end))
                        that.start += that.ite;
                        that.end += that.ite;
                    }
                    animateArray.forEach(function(i) {
                        this.update(tickTime);
                    })
                })
            }
        }
    }
    var timestamp, isrunning = false;
    
    function animate(tick) {
        if (typeof tick == "function") {
            var newtime = new Date();
            var tickTime = timestamp ? ((newtime = new Date()) - timestamp) : 0;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            timestamp = newtime;
            tick(tickTime);
            RAF(function() {
                animate(tick)
            })
        }
    }
    
    function Particle(x, y, ex, ey, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.ex = ex;
        this.ey = ey;
        this.vx = vx;
        this.vy = vy;
        this.a = 1500;//停止惯性缓动量 1500 >50生成飘散效果
        this.color = color;
        this.width = particleSize_x;
        this.height = particleSize_y;
        this.stop = false;
        this.static = false;
        this.maxCheckTimes = 10;//动态停止 数值越大则一直动产生噪点效果 10
        this.checkLength = 0;//生成长度（速度）5
        this.checkTimes = 0;//0
    }
    var oldColor = "";
    Particle.prototype = {
        constructor: Particle,
        drawSelf: function() {
            if (oldColor != this.color) {
                ctx.fillStyle = this.color;
                oldColor = this.color
            }
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        },
        update: function(tickTime) {
            if (this.stop) {
                this.x = this.ex;
                this.y = this.ey;
            } else {
                tickTime = tickTime / 1000;//生成速率 越大越小
                var cx = this.ex - this.x;
                var cy = this.ey - this.y;
                var angle = Math.atan(cy / cx);
                var ax = Math.abs(this.a * Math.cos(angle));
                ax = this.x > this.ex ? -ax : ax
                var ay = Math.abs(this.a * Math.sin(angle));
                ay = this.y > this.ey ? -ay : ay;
                this.vx += ax * tickTime;
                this.vy += ay * tickTime;
                this.vx = ~~this.vx * 0.95;
                this.vy = ~~this.vy * 0.95;
                this.x += this.vx * tickTime;
                this.y += this.vy * tickTime;
                if (Math.abs(this.x - this.ex) <= this.checkLength && Math.abs(this.y - this.ey) <= this.checkLength) {
                    this.checkTimes++;
                    if (this.checkTimes >= this.maxCheckTimes) {
                        this.stop = true;
                    }
                } else {
                    this.checkTimes = 0
                }
            }
            this.drawSelf();
            this._checkMouse();
        },
        _checkMouse: function() {
            if (!mouseX) {
                if (this.recordX) {
                    this.stop = false;
                    this.checkTimes = 0;
                    this.a = 1500;
                    this.ex = this.recordX;
                    this.ey = this.recordY;
                    this.recordX = null;
                    this.recordY = null;
                }
                return;
            }
            var distance = Math.sqrt(Math.pow(mouseX - this.x, 2) + Math.pow(mouseY - this.y, 2));
            var angle = Math.atan((mouseY - this.y) / (mouseX - this.x));
            if (distance < mouseRadius) {
                this.stop = false;
                this.checkTimes = 0;
                if (!this.recordX) {
                    this.recordX = this.ex;
                    this.recordY = this.ey;
                }
                this.a = 7700;//推动飘散量 500
                var xc = Math.abs((mouseRadius - distance) * Math.cos(angle));//指针像素计算 x
                var yc = Math.abs((mouseRadius - distance) * Math.sin(angle));//指针像素计算 y
                xc = mouseX > this.x ? -xc : xc;
                yc = mouseY > this.y ? -yc : yc;
                this.ex = this.x + xc;
                this.ey = this.y + yc;
            } else {
                if (this.recordX) {
                    this.stop = false;
                    this.checkTimes = 0;
                    this.a = 1500;//粒子返回动量 1500
                    this.ex = this.recordX;
                    this.ey = this.recordY;
                    this.recordX = null;
                    this.recordY = null;
                }
            }
        }
    };
   
    /** use image
     * function useImage() {
            img = document.getElementById("logo");
            if (img.complete) {
                canvasHandle.init();
                
            } else {
                img.onload = function() {
                    canvasHandle.init();
                }
            }
        }**/
        var x=document.getElementById('vle').value;
        clc = function(){
            x=document.getElementById('vle').value;
            useText();
        }
        function useText(text) {
        img = document.createElement('canvas');
        img.width = 2400;//范围宽
        img.height = 720;//范围高
        var imgctx = img.getContext("2d");
        imgctx.textAlign = "center";
        imgctx.textBaseline = "middle";
        imgctx.fillStyle='White';//color
        imgctx.font = "200px 华文隶书";
        imgctx.fillText(text || x, img.width / 2, img.height / 2); //取值 生成范围居中 (值,x,y)
        canvasHandle.init();
    }
    useText();
}