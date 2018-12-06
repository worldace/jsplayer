/* ■jsplayer https://spelunker2.wordpress.com/2018/11/27/jsplayer2/ */


function jsplayer(args){
    jsplayer.セットアップ();

    if(typeof args.el === 'string'){
        args.el = document.querySelector(args.el);
    }

    var $ = jsplayer.SilverState(jsplayer, jsplayer.HTML, jsplayer.CSS, {args: args});

    jsplayer.初回描画($);

    $.コメント設定 = jsplayer.コメント設定($.$画面.高さ);
    $.$動画.src    = args.file;
}



jsplayer.proxy = 'proxy.php?url=';



jsplayer.セットアップ = function (){
    //URL
    var currentScript = document.querySelector("script[src*='jsplayer.js']");
    jsplayer.URL      = currentScript.src.replace(/\/[^\/]*$/, '') + '/'; //PHPの dirname() 相当

    if(!jsplayer.proxy.match('http')){
        jsplayer.proxy = jsplayer.URL + jsplayer.proxy;
    }

    //LocalStorage
    jsplayer.ユーザ設定      = jsplayer.loadLocalStorage("jsplayer");
    jsplayer.ユーザ設定.音量 = Number(jsplayer.ユーザ設定.音量 || 1);

    window.addEventListener('unload', function(event){
        jsplayer.saveLocalStorage("jsplayer", jsplayer.ユーザ設定);
    });


    //ブラウザバグ対策
    if(navigator.userAgent.indexOf('Edge/') >= 0){ //Edge(Fall Creators)でコメントが表示されないバグ対策
        jsplayer.CSS += '.jsplayer-コメント{opacity:1;}';
    }
    if(navigator.userAgent.indexOf('Trident/') >= 0){ //IEはonwheel -> onmousewheel。event.deltaY -> event.wheelDelta
        jsplayer.$時間調節枠_onmousewheel = jsplayer.$時間調節枠_onwheel;
        jsplayer.$音量調節枠_onmousewheel = jsplayer.$音量調節枠_onwheel;
        delete jsplayer.$時間調節枠_onwheel;
        delete jsplayer.$音量調節枠_onwheel;
    }

    jsplayer.セットアップ = function (){};
};



jsplayer.初回描画 = function ($){
    if     (document.fullscreenEnabled)      { document.addEventListener("fullscreenchange",       $.$全画面.イベント); }
    else if(document.msFullscreenEnabled)    { document.addEventListener("MSFullscreenChange",     $.$全画面.イベント); }
    else if(document.webkitFullscreenEnabled){ document.addEventListener("webkitfullscreenchange", $.$全画面.イベント); }
    else if(document.mozFullScreenEnabled)   { document.addEventListener("mozfullscreenchange",    $.$全画面.イベント); }

    $.args.el.parentNode.replaceChild($.$jsplayer, $.args.el);

    //サイズキャッシュ
    $.$画面.横幅             = jsplayer.csslen($.$画面, 'width');
    $.$画面.高さ             = jsplayer.csslen($.$画面, 'height');
    $.$時間調節バー.横幅     = jsplayer.csslen($.$時間調節バー, 'width');
    $.$時間調節ポインタ.横幅 = jsplayer.csslen($.$時間調節ポインタ, 'width');
    $.$音量調節ポインタ.横幅 = jsplayer.csslen($.$音量調節ポインタ, 'width');

    $.$コントローラ.style.width = $.$画面.横幅 + "px";

    jsplayer.キーフレーム追加('jsplayer-normal-lane', $.$画面.横幅);

    $.$画面.focus();
};



jsplayer.時間整形 = function(時間){
    時間 = 時間 || 0;

    var 分 = Math.floor(時間 / 60);
    var 秒 = Math.floor(時間 - 分 * 60);

    if(分 < 10){
        分 = '0' + 分;
    }
    if(秒 < 10){
        秒 = '0' + 秒;
    }

    return 分 + ":" + 秒;
};



jsplayer.ポインタ位置計算 = function(現在値, $ポインタ){
    現在値 = 現在値 || 0;

    var バー  = $ポインタ.parentNode.getBoundingClientRect();
    var 横幅  = バー.width - $ポインタ.横幅;
    var 位置  = (現在値 <= 1)  ?  横幅 * 現在値  :  現在値 - バー.left; //現在値は「割合の時(0-1)」or「クリックされた位置の時」の2パターンある

    return {
        "位置": jsplayer.minmax(0, 位置, 横幅),
        "割合": jsplayer.minmax(0, 位置/横幅, 1),
    };
};



jsplayer.コメント遅延計算 = function (コメント時間, 動画時間){
    var 遅延 = コメント時間 - 動画時間;
    return (遅延 <= 0)  ?  0  :  遅延.toFixed(3)*1000 + "ms";
};



jsplayer.コメント設定 = function(画面高さ){
    var コメント設定 = {};

    if(画面高さ >= 360){
        コメント設定.レーン数   = Math.floor((画面高さ-360)/180) + 10;
        コメント設定.レーン高さ = 画面高さ / コメント設定.レーン数 * 0.8;
        コメント設定.文字サイズ = コメント設定.レーン高さ / 6 * 5; //22.5px以上必要
        コメント設定.マージン   = コメント設定.レーン高さ / 6;
    }
    else{
        コメント設定.レーン数   = Math.floor(画面高さ*0.8/30);
        コメント設定.レーン高さ = 30;
        コメント設定.文字サイズ = 25;
        コメント設定.マージン   = 5;
    }

    return コメント設定;
};



jsplayer.キーフレーム追加 = function(名前, 画面横幅){
    if(document.getElementById(名前)){
        return;
    }

    var css  = "";
        css += "@keyframes " + 名前 + "{";
        css += "from{transform:translateX(0);}";
        css += "to{transform:translateX(-" + 画面横幅*5 + "px);}}";

    var style       = document.createElement('style');
    style.innerHTML = css;
    style.id        = 名前;
    document.head.appendChild(style);
};



jsplayer.$jsplayer_onkeydown = function(event){
    this.$コントローラ.style.visibility = "visible";
    if(event.target.tagName === 'INPUT'){
        return true;
    }

    if(event.which == 32){ //Space
        this.$コメント入力.focus();
    }
    else if(event.which == 13 && event.ctrlKey){ //Ctrl+Enter ※IEで効かない
        this.$全画面.切り替え();
    }
    else if(event.which == 13){ //Enter
        (this.$動画.paused)  ?  this.$動画.play()  :  this.$動画.pause();
    }
    else if(event.which == 39){ //→
        this.$動画.時間(this.$動画.currentTime + 15);
    }
    else if(event.which == 37){ //←
        this.$動画.時間(this.$動画.currentTime - 15);
    }
    else if(event.which == 36){ //Home
        this.$動画.時間(0);
    }
    else if(event.which == 35){ //End
        this.$動画.時間(this.$動画.duration - 10);
    }
    else if(event.which == 38){ //↑
        this.$動画.音量(this.$動画.volume + 0.1);
    }
    else if(event.which == 40){ //↓
        this.$動画.音量(this.$動画.volume - 0.1);
    }
    else if(event.which == 107){ //num+
        this.$動画.再生速度(this.$動画.playbackRate + 0.1);
    }
    else if(event.which == 187 && event.shiftKey){ //+
        this.$動画.再生速度(this.$動画.playbackRate + 0.1);
    }
    else if(event.which == 109){ //num-
        this.$動画.再生速度(this.$動画.playbackRate - 0.1);
    }
    else if(event.which == 189){ //-
        this.$動画.再生速度(this.$動画.playbackRate - 0.1);
    }
    else{
        return true;
    }

    event.preventDefault();
};



jsplayer.$動画_時間 = function(秒){
    if(!this.$動画.duration){
        return;
    }
    this.$動画.currentTime = jsplayer.minmax(0, Math.floor(秒), this.$動画.duration);
};



jsplayer.$動画_音量 = function(音量){
    this.$動画.volume = jsplayer.minmax(0, 音量.toFixed(1), 1);
    this.$動画.muted  = false;
};



jsplayer.$動画_再生速度 = function(速度){
    if(!this.$動画.duration){
        return;
    }
    this.$動画.playbackRate = jsplayer.minmax(0.5, 速度.toFixed(1), 3);
};



jsplayer.$動画_onclick = function(event){
    if(!this.$動画.currentTime){
        this.$動画.play();
    }
    event.preventDefault();
};



jsplayer.$動画_ondblclick = function(event){
    event.preventDefault();
};



jsplayer.$動画_onloadedmetadata = function(event){

    this.$コメント.取得();
    this.$動画.onprogress();

    this.$コメント入力.disabled       = false;
    this.$コメント投稿ボタン.disabled = false;

    this.$合計時間.textContent = jsplayer.時間整形(this.$動画.duration);
    this.$動画.音量(jsplayer.ユーザ設定.音量);
};



jsplayer.$動画_oncanplaythrough = function(event){
    this.$動画.play();
};



jsplayer.$動画_ontimeupdate = function(event){
    var 秒 = Math.floor(this.$動画.currentTime);
    if(秒 === this.前回の現在時間){
        return;
    }
    this.前回の現在時間 = 秒;

    if(!this.$時間調節ポインタ.ドラッグ中){
        this.$現在時間.textContent = jsplayer.時間整形(this.$動画.currentTime);
        this.$合計時間.textContent = jsplayer.時間整形(this.$動画.duration);

        var 時間 = jsplayer.ポインタ位置計算(this.$動画.currentTime/this.$動画.duration, this.$時間調節ポインタ);
        this.$時間調節ポインタ.style.left = 時間.位置 + "px";
    }
    if(!this.$動画.paused && !this.$コメント表示ボタン.hasAttribute("data-off")){
        this.$コメント.放流(this.コメント[秒]);
    }
};



jsplayer.$動画_onplay = function(event){
    this.$コメント.再生();
    this.$再生ボタン.removeAttribute("data-pause");
};



jsplayer.$動画_onpause = function(event){
    this.$コメント.停止();
    this.$再生ボタン.setAttribute("data-pause", "");
};



jsplayer.$動画_onprogress = function(event){
    var buffer = this.$動画.buffered;

    if(buffer.length){
        this.$時間調節バー.style.backgroundPosition = buffer.start(0) / this.$動画.duration * this.$時間調節バー.横幅 + "px";
        this.$時間調節バー.style.backgroundSize     = buffer.end(buffer.length-1) / this.$動画.duration * this.$時間調節バー.横幅 + "px";
    }
};



jsplayer.$動画_onseeking = function(event){
    this.$コメント.全消去();
};



jsplayer.$動画_onended = function(event){
    this.$コメント.全消去();
};



jsplayer.$動画_onvolumechange = function(event){
    if(!this.$動画.volume || this.$動画.muted){
        this.$音量ボタン.setAttribute("data-mute", "");
    }
    else{
        this.$音量ボタン.removeAttribute("data-mute");
        jsplayer.ユーザ設定.音量 = this.$動画.volume;
    }
    var ポインタ = jsplayer.ポインタ位置計算(this.$動画.volume, this.$音量調節ポインタ);
    this.$音量調節ポインタ.style.left = ポインタ.位置 + "px";
};



jsplayer.$動画_onratechange = function(event){
    this.$画面.OSD表示("x" + this.$動画.playbackRate.toFixed(1));
};



jsplayer.$動画_onerror = function(event){
    var error = event.target.error; // http://www.html5.jp/tag/elements/video.html

    if(error.code === error.MEDIA_ERR_SRC_NOT_SUPPORTED){
        this.$画面.OSD表示("動画ファイルが存在しません");
    }
    else if(error.code === error.MEDIA_ERR_DECODE){
        this.$画面.OSD表示("動画ファイルが未対応の形式です");
    }
    else if(error.code === error.MEDIA_ERR_ABORTED){
        this.$画面.OSD表示("動画の再生が中断されました");
    }
    else if(error.code === error.MEDIA_ERR_NETWORK){
        this.$画面.OSD表示("ネットワークにエラーが発生しました");
    }
    else{
        this.$画面.OSD表示("未知のエラーが発生しました");
    }
};



jsplayer.$コメント_DOM作成 = function(data, レーン番号){
    var el = document.createElement("span");

    el.textContent          = data[0];
    el.className            = "jsplayer-コメント";
    el.laneNumber           = レーン番号;
    el.style.top            = レーン番号 * this.コメント設定.レーン高さ + this.コメント設定.マージン + "px";
    el.style.fontSize       = this.コメント設定.文字サイズ + "px";
    el.style.animationName  = this.$全画面.なら() ? "jsplayer-fullscreen-lane" : "jsplayer-normal-lane";
    el.style.animationDelay = jsplayer.コメント遅延計算(data[1], this.$動画.currentTime);

    return el;
};



jsplayer.$コメント_放流 = function(コメント){
    if(!Array.isArray(コメント) || !コメント.length){
        return;
    }

    var レーン       = this.$コメント.レーン確認();
    var fragment     = document.createDocumentFragment();
    var コメント番号 = 0;

    for(var i = 0; i < レーン.length; i++){
        if(!(コメント番号 in コメント)){
            break;
        }
        if(レーン[i] === false){
            continue;
        }
        fragment.appendChild(this.$コメント.DOM作成(コメント[コメント番号], i));
        コメント番号++;
    }

    this.$画面.insertBefore(fragment, this.$画面.firstChild);
};



jsplayer.$コメント_レーン確認 = function(){
    var レーン = Array(this.コメント設定.レーン数);
    for(var i = 0; i < レーン.length; i++){
        レーン[i] = true;
    }

    var 画面     = this.$画面.getBoundingClientRect();
    var コメント = this.$画面.children;

    for(var i = コメント.length-1; i >= 0; i--){
        if(コメント[i].classList[0] !== 'jsplayer-コメント'){
            continue;
        }

        var 位置 = コメント[i].getBoundingClientRect();

        if(位置.right > 画面.right-30){
            レーン[コメント[i].laneNumber] = false;
        }
        if(位置.right < 画面.left){
            this.$画面.removeChild(コメント[i]);
        }
    }

    return レーン;
};



jsplayer.$コメント_再生 = function(){
    var コメント = this.$画面.children;

    for(var i = 0; i < コメント.length; i++){
        if(コメント[i].classList[0] === "jsplayer-コメント"){
            コメント[i].style.animationPlayState = "running";
        }
    }
};



jsplayer.$コメント_停止 = function(){
    var コメント = this.$画面.children;

    for(var i = 0; i < コメント.length; i++){
        if(コメント[i].classList[0] === "jsplayer-コメント"){
            コメント[i].style.animationPlayState = "paused";
        }
    }
};



jsplayer.$コメント_全消去 = function(){
    var コメント = this.$画面.children;

    for(var i = コメント.length-1; i >= 0; i--){
        if(コメント[i].classList[0] === "jsplayer-コメント"){
            this.$画面.removeChild(コメント[i]);
        }
    }
};



jsplayer.$コメント_取得 = function(){
    if(this.コメント){
        return;
    }

    this.コメント = Array(Math.floor(this.$動画.duration) + 1); //動画時間+1の箱を作る [[],[],[],[]...]
    for(var i = 0; i < this.コメント.length; i++){
        this.コメント[i] = [];
    }

    if(this.args.himado){
        var url = "http://himado.in/?" + jsplayer.ajax.param({
            mode     : "comment",
            format   : "nico",
            limit    : 10000,
            id       : this.args.himado,
            group_id : this.args.group_id || "",
            key      : this.args.key || "",
            nocache  : Date.now()
        });
        var proxy = jsplayer.proxy + encodeURIComponent(url);
        jsplayer.ajax({url: proxy, ok: this.$コメント.取得成功, mime:'text/xml'});
    }
    else if(this.args.comment){
        var comment = JSON.parse(this.args.comment);
        for(var i = 0; i < comment.length; i++){
            var 本文 = comment[i][0];
            var 時間 = comment[i][1];
            var 番号 = Math.floor(時間);
            if(Array.isArray(this.コメント[番号])){
                this.コメント[番号].push([本文, 時間]);
            }
        }
    }
};



jsplayer.$コメント_取得成功 = function(xhr){
    if(!xhr.responseXML){
        return;
    }

    var chat = xhr.responseXML.querySelectorAll("chat");
    for(var i = chat.length-1; i >= 0; i--){
        var 本文 = chat[i].textContent.substring(0,64);
        var vpos = Number(chat[i].getAttribute("vpos") || 0) / 100;
        var 番号 = Math.floor(vpos);

        if(Array.isArray(this.コメント[番号])){
            this.コメント[番号].push([本文, vpos]);
        }
    }
};



jsplayer.$コメント_投稿 = function(){
    var 時間 = this.$動画.currentTime;
    var 秒   = Math.floor(時間);
    var 本文 = this.$コメント入力.value.trim();

    if(本文 === "" || 本文.length > 64){
        return;
    }

    if(Array.isArray(this.コメント[秒+1])){
        this.コメント[秒+1].unshift([本文, 時間+1]);
    }

    this.$コメント入力.value = "";

    if(this.args.himado && this.args.group_id){
        var param = {
            mode     : "comment",
            id       : this.args.himado,
            vpos     : 時間.toFixed(2) * 100,
            comment  : 本文,
            mail     : '',
            group_id : String(this.args.group_id).split(',')[0],
            adddate  : Math.floor(Date.now()/1000),
        };
        var url   = 'http://himado.in/api/player?' + jsplayer.ajax.param(param);
        var proxy = jsplayer.proxy + encodeURIComponent(url);

        jsplayer.ajax({url: proxy});
    }
    else if(this.args.posturl){
        var param = {
            vpos    : 時間.toFixed(2),
            comment : 本文,
            file    : this.$動画.src,
        };
        jsplayer.ajax({url: this.args.posturl, body: param, method: 'POST'});
    }
};



jsplayer.$画面_OSD表示 = function(str){
    var osd = document.createElement("span");
    osd.textContent = str;
    osd.className   = "jsplayer-OSD";
    osd.style.fontSize = this.コメント設定.文字サイズ + "px";

    this.$画面.OSD消去();
    this.$画面.appendChild(osd);
    this.$画面.OSD番号 = window.setTimeout(this.$画面.OSD消去, 3000);
};



jsplayer.$画面_OSD消去 = function(){
    var osd = this.$画面.children;

    for(var i = osd.length-1; i >= 0; i--){
        if(osd[i].classList[0] === 'jsplayer-OSD'){
            this.$画面.removeChild(osd[i]);
        }
    }
    if(this.$画面.OSD番号){
        window.clearTimeout(this.$画面.OSD番号);
    }
};



jsplayer.$画面_onanimationend = function (event){
    if(event.target.classList[0] === 'jsplayer-コメント'){
        this.$画面.removeChild(event.target);
    }
};



jsplayer.$全画面_イベント = function(event){
    var 全画面 = document.fullscreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
    if(全画面 === this.$画面){
        this.$全画面.開始();
        this.全画面 = this.$画面;
    }
    else if(this.全画面 === this.$画面){
        this.$全画面.終了();
        this.全画面 = null;
    }
};



jsplayer.$全画面_開始 = function(){
    this.$画面.onmousedown  = this.$全画面.コントローラ表示切り替え;
    this.$画面.onmousemove  = this.$全画面.マウスタイマ;
    this.$画面.style.cursor = "none";

    this.$画面.appendChild(this.$コントローラ);
    this.$コントローラ.style.visibility = "hidden";

    var 画面 = this.$画面.getBoundingClientRect();
    if(navigator.userAgent.indexOf('Trident/') >= 0 || navigator.userAgent.indexOf('Edge/') >= 0){ //IEとEdge フルスクリーン時にwidth, heightが取得できない時がある？
        画面 = {width: window.screen.width, height: window.screen.height};
    }

    jsplayer.キーフレーム追加('jsplayer-fullscreen-lane', 画面.width);

    this.コメント設定 = jsplayer.コメント設定(画面.height);
    this.$コメント.全消去();
    this.$画面.focus();
};



jsplayer.$全画面_終了 = function(){
    this.$画面.onmousedown = null;
    this.$画面.onmousemove = null;
    if(this.$画面.マウスタイマ番号){
        window.clearTimeout(this.$画面.マウスタイマ番号);
        this.$画面.マウスタイマ番号 = null;
    }
    this.$画面.style.cursor = "auto";

    this.$jsplayer.appendChild(this.$コントローラ);
    this.$コントローラ.style.visibility = "visible";

    var 画面 = this.$画面.getBoundingClientRect();

    this.コメント設定 = jsplayer.コメント設定(画面.height);
    this.$コメント.全消去();
    this.$画面.focus();
};



jsplayer.$全画面_コントローラ表示切り替え = function(event){
    if(this.$コントローラ.style.visibility === "hidden"){
        this.$コントローラ.style.visibility = "visible";
    }
    else{
        if(this.$コントローラ.contains(event.target)){
            return;
        }
        this.$コントローラ.style.visibility = "hidden";
    }
};



jsplayer.$全画面_マウスタイマ = function(event){
    this.$画面.style.cursor = "auto";
    if(this.$画面.マウスタイマ番号){
        window.clearTimeout(this.$画面.マウスタイマ番号);
    }
    this.$画面.マウスタイマ番号 = window.setTimeout(timeout, 2500, this);

    function timeout($){
        $.$画面.style.cursor = "none";
    }
};



jsplayer.$全画面_なら = function(){
    var 全画面 = document.fullscreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
    return 全画面 === this.$画面;
};



jsplayer.$全画面_切り替え = function(){
    if(this.$全画面.なら()){
        if     (document.exitFullscreen)      { document.exitFullscreen(); }
        else if(document.msExitFullscreen)    { document.msExitFullscreen(); }
        else if(document.webkitExitFullscreen){ document.webkitExitFullscreen(); }
        else if(document.mozCancelFullScreen) { document.mozCancelFullScreen(); }
    }
    else{
        if     (this.$画面.requestFullscreen)      { this.$画面.requestFullscreen(); }
        else if(this.$画面.msRequestFullscreen)    { this.$画面.msRequestFullscreen(); }
        else if(this.$画面.webkitRequestFullscreen){ this.$画面.webkitRequestFullscreen(); }
        else if(this.$画面.mozRequestFullScreen)   { this.$画面.mozRequestFullScreen(); }
    }
};



jsplayer.$再生ボタン_onclick = function(event){
    if(!this.$動画.duration){
        return;
    }
    (this.$動画.paused)  ?  this.$動画.play()  :  this.$動画.pause();
};



jsplayer.$時間調節枠_onclick = function(event){
    if(!this.$動画.duration || this.$時間調節ポインタ.ドラッグ中){
        return;
    }
    var 割合 = jsplayer.ポインタ位置計算(event.clientX, this.$時間調節ポインタ).割合;
    this.$動画.時間(this.$動画.duration * 割合);
};



jsplayer.$時間調節枠_onwheel = function(event){
    if(!this.$動画.duration){
        return;
    }
    var 変化量 = event.deltaY || -event.wheelDelta;
    (変化量 > 0)  ?  this.$動画.時間(this.$動画.currentTime+15)  :  this.$動画.時間(this.$動画.currentTime-15);
};



jsplayer.$時間調節ポインタ_onmousedown = function(event){
    if(!this.$動画.duration){
        return;
    }

    this.$時間調節ポインタ.ドラッグ中 = true;
    document.addEventListener('mousemove', this.$時間調節ポインタ.mousemove);
    document.addEventListener('mouseup', this.$時間調節ポインタ.mouseup);
};



jsplayer.$時間調節ポインタ_mousemove = function(event){
    var ポインタ = jsplayer.ポインタ位置計算(event.clientX, this.$時間調節ポインタ);
    this.$現在時間.textContent = jsplayer.時間整形(this.$動画.duration * ポインタ.割合);
    this.$時間調節ポインタ.style.left = ポインタ.位置 + "px";
};



jsplayer.$時間調節ポインタ_mouseup = function(event){
    document.removeEventListener('mousemove', this.$時間調節ポインタ.mousemove);
    document.removeEventListener('mouseup', this.$時間調節ポインタ.mouseup);
    this.$時間調節ポインタ.ドラッグ中 = false;

    var ポインタ = jsplayer.ポインタ位置計算(event.clientX, this.$時間調節ポインタ);
    this.$動画.時間(this.$動画.duration * ポインタ.割合);
};



jsplayer.$音量ボタン_onclick = function(event){
    var 音量 = 0.5;
    if(this.$動画.muted){
        this.$動画.muted = false;
    }
    else if(this.$動画.volume){
        音量 = 0;
    }
    this.$動画.音量(音量);
};



jsplayer.$音量調節枠_onclick = function(event){
    if(this.$音量調節ポインタ.ドラッグ中){
        return;
    }
    this.$動画.muted = false;
    this.$動画.音量(jsplayer.ポインタ位置計算(event.clientX, this.$音量調節ポインタ).割合);
};



jsplayer.$音量調節枠_onwheel = function(event){
    var 変化量 = event.deltaY || -event.wheelDelta;
    (変化量 > 0)  ?  this.$動画.音量(this.$動画.volume+0.1)  :  this.$動画.音量(this.$動画.volume-0.1);
};



jsplayer.$音量調節ポインタ_onmousedown = function(event){
    this.$音量調節ポインタ.ドラッグ中 = true;

    document.addEventListener('mousemove', this.$音量調節ポインタ.mousemove);
    document.addEventListener('mouseup', this.$音量調節ポインタ.mouseup);
};



jsplayer.$音量調節ポインタ_mousemove = function(event){
    this.$動画.音量(jsplayer.ポインタ位置計算(event.clientX, this.$音量調節ポインタ).割合);
};



jsplayer.$音量調節ポインタ_mouseup = function(event){
    document.removeEventListener('mousemove', this.$音量調節ポインタ.mousemove);
    document.removeEventListener('mouseup', this.$音量調節ポインタ.mouseup);

    this.$音量調節ポインタ.ドラッグ中 = false;
};



jsplayer.$コメント表示ボタン_onclick = function(event){
    if(this.$コメント表示ボタン.hasAttribute("data-off")){
        this.$コメント表示ボタン.removeAttribute("data-off");
    }
    else{
        this.$コメント.全消去();
        this.$コメント表示ボタン.setAttribute("data-off", "");
    }
};



jsplayer.$全画面ボタン_onclick = function(event){
    this.$全画面.切り替え();
};



jsplayer.$フォーム枠_onsubmit = function(event){
    event.preventDefault();
    this.$コメント.投稿();
    this.$動画.play();
    this.$画面.focus();
};



jsplayer.$コメント入力_onfocus = function(event){
    this.$動画.pause();
};



jsplayer.ajax = function(設定){
    for(var key in this.ajax.設定){
        if(!(key in 設定)){
            設定[key] = this.ajax.設定[key];
        }
    }

    var xhr = new XMLHttpRequest();
    xhr.open(設定.method, 設定.url);

    xhr.timeout         = 設定.timeout * 1000;
    xhr.withCredentials = 設定.credential;

    if(設定.mime){
        xhr.overrideMimeType(設定.mime);
    }

    if(設定.body instanceof FormData || 設定.body == null){ //URLSearchParamsに非対応
    }
    else if(typeof 設定.body === 'string'){
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    }
    else if(typeof 設定.body === 'object'){
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        var body = this.ajax.param(設定.body);
    }

    for(var key in 設定.header){
        xhr.setRequestHeader(key, 設定.header[key]); //クロスドメイン時に余計なヘッダがあるとエラーになる

    }

    xhr.onloadend = function(event){
        (xhr.status >= 200 && xhr.status < 400) ? 設定.ok(xhr) : 設定.ng(xhr);
    };

    xhr.send(body || 設定.body);
};



jsplayer.ajax.設定 = {
    url        : '',
    method     : 'GET',
    header     : {},
    body       : null,
    mime       : null,
    credential : false,
    timeout    : 60,
    ok         : function(){},
    ng         : function(){},
};



jsplayer.ajax.param = function(param){
    var str = "";
    for(var key in param){
        str += encodeURIComponent(key) + "=" + encodeURIComponent(param[key]) + "&";
    }
    return str;
};



jsplayer.minmax = function(min, val, max){
    if(val < min){
        return min;
    }
    else if(val > max){
        return max;
    }
    else{
        return val;
    }
};



jsplayer.saveLocalStorage = function(name, value){
    window.localStorage.setItem(name, JSON.stringify(value));
};



jsplayer.loadLocalStorage = function(name){
    try{
        var item = window.localStorage.getItem(name);
        return (item) ? JSON.parse(item) : {};
    }
    catch(e){
        return {};
    }
};



jsplayer.csslen = function(el, prop){
    return window.parseInt(window.getComputedStyle(el)[prop], 10) || 0;
};



jsplayer.SilverState = function(app, html, css, $){
    $ = $ || {};

    //HTMLからDOM作成
    var div        = document.createElement('div');
    div.innerHTML  = html;
    var root       = div.firstElementChild;
    var appName    = root.classList[0];
    $['$'+appName] = root;

    //CSS登録
    if(css){
        var cssClass = appName + "-css";
        $.$css = document.querySelector("." + cssClass);
        if(!$.$css){
            $.$css           = document.createElement('style');
            $.$css.innerHTML = css;
            $.$css.className = cssClass;
            document.head.insertBefore($.$css, document.head.firstElementChild);
        }
    }

    //DOM選択
    var elements = $['$'+appName].querySelectorAll("*");
    for(var i = 0; i < elements.length; i++){
        var className = elements[i].classList[0] || '';
        var names     = className.split('-');
        var firstName = names.shift();
        var idName    = '$' + names.join('_');

        if(firstName !== appName){
            continue;
        }
        if($.hasOwnProperty(idName)){
            throw '識別名が重複しています: ' + className;
        }

        $[idName] = elements[i];
    }

    //プロパティ登録
    for(var name in app){
        if(name.indexOf('$') !== 0){
            continue;
        }
        var names = name.substring(1).split('_');
        if(names.length < 2){
            continue;
        }
        var propName = names.pop();
        var idName   = '$' + names.join('_');
        if(!(idName in $)){
            $[idName] = {};
        }
        $[idName][propName] = (typeof app[name] === 'function')  ?  app[name].bind($)  :  app[name];
    }

    $['$'+appName].$ = $;
    return $;
};



jsplayer.HTML = (function() {/*
<div class="jsplayer">
  <div class="jsplayer-画面" tabindex="1">
    <video class="jsplayer-動画" loop></video>
  </div>
  <div class="jsplayer-コントローラ">
    <div class="jsplayer-コントローラ枠">
      <span class="jsplayer-再生ボタン" data-pause></span>
      <span class="jsplayer-現在時間">00:00</span>
      <div class="jsplayer-時間調節枠">
        <div class="jsplayer-時間調節バー">
          <span class="jsplayer-時間調節ポインタ"></span>
        </div>
      </div>
      <span class="jsplayer-合計時間">00:00</span>
      <span class="jsplayer-音量ボタン"></span>
      <div class="jsplayer-音量調節枠">
        <div class="jsplayer-音量調節バー">
          <span class="jsplayer-音量調節ポインタ"></span>
        </div>
      </div>
      <span class="jsplayer-コメント表示ボタン"></span>
      <span class="jsplayer-全画面ボタン"></span>
    </div>
    <form class="jsplayer-フォーム枠" action="javascript:void(0)">
      <input class="jsplayer-コメント入力" type="text" value="" autocomplete="off" spellcheck="false" maxlength="60" tabindex="2" disabled>
      <input class="jsplayer-コメント投稿ボタン" type="submit" value="コメントする" disabled>
    </form>
  </div>
</div>
*/}).toString().match(/\/\*([^]*)\*\//)[1].trim();




jsplayer.CSS = (function() {/*
.jsplayer{
}

.jsplayer *{
    box-sizing: border-box;
}

.jsplayer-動画{
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.jsplayer-画面{
    width: 960px;
    height: 540px;
    background-color: #000;
    overflow: hidden;
    white-space : nowrap;
    -ms-user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    user-select: none;
    position: relative;
    cursor: default;
}

.jsplayer-画面:focus{
    outline: none;
}

.jsplayer-画面:-ms-fullscreen{
    position: absolute;
    width: 100% !important;
    height: 100% !important;
    left: 0;
    top: 0;
}

.jsplayer-画面:-webkit-full-screen{
    position: absolute;
    width: 100% !important;
    height: 100% !important;
    left: 0;
    top: 0;
}

.jsplayer-画面:-moz-full-screen{
    position: absolute;
    width: 100% !important;
    height: 100% !important;
    left: 0;
    top: 0;
}

.jsplayer-画面:fullscreen{
    position: absolute;
    width: 100% !important;
    height: 100% !important;
    left: 0;
    top: 0;
}

.jsplayer-OSD{
    font-family: Arial, sans-serif;
    position: absolute;
    right: 2%;
    top: 5%;
    background-color: #000;
    color:#0f0;
    z-index: 3;
}

.jsplayer-コントローラ{
    width: 960px;
    color: white;
    background: #47494f;
    border-color: #2f3034 #2f3034 #232427;
    background-image: linear-gradient(to bottom, #555, #333 66%, #000);
    -ms-user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    user-select: none;
    cursor: default;
    line-height: 1;
}

.jsplayer-画面 > .jsplayer-コントローラ{
    position: absolute;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    bottom: 0;
}

.jsplayer-コントローラ枠{
    width: 100%;
    display: flex;
    align-items: center;
    padding: 4px;
}

.jsplayer-現在時間,
.jsplayer-合計時間{
    font-family: Arial, sans-serif;
    font-size: 12px;
    text-align: center;
    width: 40px;
    overflow: hidden;
}


.jsplayer-再生ボタン,
.jsplayer-音量ボタン,
.jsplayer-コメント表示ボタン,
.jsplayer-全画面ボタン{
    width: 20px;
    height: 20px;
    background-size: 20px;
    background-repeat: no-repeat;
    background-position: 50% 50%;
    margin: 0 3px;
    padding: 0;
    cursor: pointer;
}

.jsplayer-再生ボタン{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xNjY0IDE5MnYxNDA4cTAgMjYtMTkgNDV0LTQ1IDE5aC01MTJxLTI2IDAtNDUtMTl0LTE5LTQ1di0xNDA4cTAtMjYgMTktNDV0NDUtMTloNTEycTI2IDAgNDUgMTl0MTkgNDV6bS04OTYgMHYxNDA4cTAgMjYtMTkgNDV0LTQ1IDE5aC01MTJxLTI2IDAtNDUtMTl0LTE5LTQ1di0xNDA4cTAtMjYgMTktNDV0NDUtMTloNTEycTI2IDAgNDUgMTl0MTkgNDV6IiBmaWxsPSIjZmZmIi8+PC9zdmc+");
}

.jsplayer-再生ボタン[data-pause]{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xNTc2IDkyN2wtMTMyOCA3MzhxLTIzIDEzLTM5LjUgM3QtMTYuNS0zNnYtMTQ3MnEwLTI2IDE2LjUtMzZ0MzkuNSAzbDEzMjggNzM4cTIzIDEzIDIzIDMxdC0yMyAzMXoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=");
}

.jsplayer-音量ボタン{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik04MzIgMzUydjEwODhxMCAyNi0xOSA0NXQtNDUgMTktNDUtMTlsLTMzMy0zMzNoLTI2MnEtMjYgMC00NS0xOXQtMTktNDV2LTM4NHEwLTI2IDE5LTQ1dDQ1LTE5aDI2MmwzMzMtMzMzcTE5LTE5IDQ1LTE5dDQ1IDE5IDE5IDQ1em0zODQgNTQ0cTAgNzYtNDIuNSAxNDEuNXQtMTEyLjUgOTMuNXEtMTAgNS0yNSA1LTI2IDAtNDUtMTguNXQtMTktNDUuNXEwLTIxIDEyLTM1LjV0MjktMjUgMzQtMjMgMjktMzUuNSAxMi01Ny0xMi01Ny0yOS0zNS41LTM0LTIzLTI5LTI1LTEyLTM1LjVxMC0yNyAxOS00NS41dDQ1LTE4LjVxMTUgMCAyNSA1IDcwIDI3IDExMi41IDkzdDQyLjUgMTQyem0yNTYgMHEwIDE1My04NSAyODIuNXQtMjI1IDE4OC41cS0xMyA1LTI1IDUtMjcgMC00Ni0xOXQtMTktNDVxMC0zOSAzOS01OSA1Ni0yOSA3Ni00NCA3NC01NCAxMTUuNS0xMzUuNXQ0MS41LTE3My41LTQxLjUtMTczLjUtMTE1LjUtMTM1LjVxLTIwLTE1LTc2LTQ0LTM5LTIwLTM5LTU5IDAtMjYgMTktNDV0NDUtMTlxMTMgMCAyNiA1IDE0MCA1OSAyMjUgMTg4LjV0ODUgMjgyLjV6bTI1NiAwcTAgMjMwLTEyNyA0MjIuNXQtMzM4IDI4My41cS0xMyA1LTI2IDUtMjYgMC00NS0xOXQtMTktNDVxMC0zNiAzOS01OSA3LTQgMjIuNS0xMC41dDIyLjUtMTAuNXE0Ni0yNSA4Mi01MSAxMjMtOTEgMTkyLTIyN3Q2OS0yODktNjktMjg5LTE5Mi0yMjdxLTM2LTI2LTgyLTUxLTctNC0yMi41LTEwLjV0LTIyLjUtMTAuNXEtMzktMjMtMzktNTkgMC0yNiAxOS00NXQ0NS0xOXExMyAwIDI2IDUgMjExIDkxIDMzOCAyODMuNXQxMjcgNDIyLjV6IiBmaWxsPSIjZmZmIi8+PC9zdmc+");
}

.jsplayer-音量ボタン[data-mute]{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im04MzIsMzQ4bDAsMTA4OHEwLDI2IC0xOSw0NXQtNDUsMTl0LTQ1LC0xOWwtMzMzLC0zMzNsLTI2MiwwcS0yNiwwIC00NSwtMTl0LTE5LC00NWwwLC0zODRxMCwtMjYgMTksLTQ1dDQ1LC0xOWwyNjIsMGwzMzMsLTMzM3ExOSwtMTkgNDUsLTE5dDQ1LDE5dDE5LDQ1eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==");
}

.jsplayer-コメント表示ボタン{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im02NDAsNzkycTAsLTUzIC0zNy41LC05MC41dC05MC41LC0zNy41dC05MC41LDM3LjV0LTM3LjUsOTAuNXQzNy41LDkwLjV0OTAuNSwzNy41dDkwLjUsLTM3LjV0MzcuNSwtOTAuNXptMzg0LDBxMCwtNTMgLTM3LjUsLTkwLjV0LTkwLjUsLTM3LjV0LTkwLjUsMzcuNXQtMzcuNSw5MC41dDM3LjUsOTAuNXQ5MC41LDM3LjV0OTAuNSwtMzcuNXQzNy41LC05MC41em0zODQsMHEwLC01MyAtMzcuNSwtOTAuNXQtOTAuNSwtMzcuNXQtOTAuNSwzNy41dC0zNy41LDkwLjV0MzcuNSw5MC41dDkwLjUsMzcuNXQ5MC41LC0zNy41dDM3LjUsLTkwLjV6bTM4NCwwcTAsMTc0IC0xMjAsMzIxLjV0LTMyNiwyMzN0LTQ1MCw4NS41cS0xMTAsMCAtMjExLC0xOHEtMTczLDE3MyAtNDM1LDIyOXEtNTIsMTAgLTg2LDEzcS0xMiwxIC0yMiwtNnQtMTMsLTE4cS00LC0xNSAyMCwtMzdxNSwtNSAyMy41LC0yMS41dDI1LjUsLTIzLjV0MjMuNSwtMjUuNXQyNCwtMzEuNXQyMC41LC0zN3QyMCwtNDh0MTQuNSwtNTcuNXQxMi41LC03Mi41cS0xNDYsLTkwIC0yMjkuNSwtMjE2LjV0LTgzLjUsLTI2OS41cTAsLTE3NCAxMjAsLTMyMS41dDMyNiwtMjMzLjAwMDA3NnQ0NTAsLTg1LjUwMDMydDQ1MCw4NS41MDAzMnQzMjYsMjMzLjAwMDA3NnQxMjAsMzIxLjV6IiBmaWxsPSIjZmZmIi8+PC9zdmc+");
}

.jsplayer-コメント表示ボタン[data-off]{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im0xNzkyLDc5MnEwLDE3NCAtMTIwLDMyMS41dC0zMjYsMjMzdC00NTAsODUuNXEtNzAsMCAtMTQ1LC04cS0xOTgsMTc1IC00NjAsMjQycS00OSwxNCAtMTE0LDIycS0xNywyIC0zMC41LC05dC0xNy41LC0yOWwwLC0xcS0zLC00IC0wLjUsLTEydDIsLTEwdDQuNSwtOS41bDYsLTlsNywtOC41bDgsLTlxNywtOCAzMSwtMzQuNXQzNC41LC0zOHQzMSwtMzkuNXQzMi41LC01MXQyNywtNTl0MjYsLTc2cS0xNTcsLTg5IC0yNDcuNSwtMjIwdC05MC41LC0yODFxMCwtMTMwIDcxLC0yNDguNXQxOTEsLTIwNC41MDA3OTN0Mjg2LC0xMzYuNDk5Nzg2dDM0OCwtNTAuNDk5ODE3cTI0NCwwIDQ1MCw4NS40OTk2OHQzMjYsMjMzLjAwMDM4MXQxMjAsMzIxLjUwMDMzNnoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=");
}

.jsplayer-全画面ボタン{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik04ODMgMTA1NnEwIDEzLTEwIDIzbC0zMzIgMzMyIDE0NCAxNDRxMTkgMTkgMTkgNDV0LTE5IDQ1LTQ1IDE5aC00NDhxLTI2IDAtNDUtMTl0LTE5LTQ1di00NDhxMC0yNiAxOS00NXQ0NS0xOSA0NSAxOWwxNDQgMTQ0IDMzMi0zMzJxMTAtMTAgMjMtMTB0MjMgMTBsMTE0IDExNHExMCAxMCAxMCAyM3ptNzgxLTg2NHY0NDhxMCAyNi0xOSA0NXQtNDUgMTktNDUtMTlsLTE0NC0xNDQtMzMyIDMzMnEtMTAgMTAtMjMgMTB0LTIzLTEwbC0xMTQtMTE0cS0xMC0xMC0xMC0yM3QxMC0yM2wzMzItMzMyLTE0NC0xNDRxLTE5LTE5LTE5LTQ1dDE5LTQ1IDQ1LTE5aDQ0OHEyNiAwIDQ1IDE5dDE5IDQ1eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==");
}

.jsplayer-設定ボタン{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMTUyIDg5NnEwLTEwNi03NS0xODF0LTE4MS03NS0xODEgNzUtNzUgMTgxIDc1IDE4MSAxODEgNzUgMTgxLTc1IDc1LTE4MXptNTEyLTEwOXYyMjJxMCAxMi04IDIzdC0yMCAxM2wtMTg1IDI4cS0xOSA1NC0zOSA5MSAzNSA1MCAxMDcgMTM4IDEwIDEyIDEwIDI1dC05IDIzcS0yNyAzNy05OSAxMDh0LTk0IDcxcS0xMiAwLTI2LTlsLTEzOC0xMDhxLTQ0IDIzLTkxIDM4LTE2IDEzNi0yOSAxODYtNyAyOC0zNiAyOGgtMjIycS0xNCAwLTI0LjUtOC41dC0xMS41LTIxLjVsLTI4LTE4NHEtNDktMTYtOTAtMzdsLTE0MSAxMDdxLTEwIDktMjUgOS0xNCAwLTI1LTExLTEyNi0xMTQtMTY1LTE2OC03LTEwLTctMjMgMC0xMiA4LTIzIDE1LTIxIDUxLTY2LjV0NTQtNzAuNXEtMjctNTAtNDEtOTlsLTE4My0yN3EtMTMtMi0yMS0xMi41dC04LTIzLjV2LTIyMnEwLTEyIDgtMjN0MTktMTNsMTg2LTI4cTE0LTQ2IDM5LTkyLTQwLTU3LTEwNy0xMzgtMTAtMTItMTAtMjQgMC0xMCA5LTIzIDI2LTM2IDk4LjUtMTA3LjV0OTQuNS03MS41cTEzIDAgMjYgMTBsMTM4IDEwN3E0NC0yMyA5MS0zOCAxNi0xMzYgMjktMTg2IDctMjggMzYtMjhoMjIycTE0IDAgMjQuNSA4LjV0MTEuNSAyMS41bDI4IDE4NHE0OSAxNiA5MCAzN2wxNDItMTA3cTktOSAyNC05IDEzIDAgMjUgMTAgMTI5IDExOSAxNjUgMTcwIDcgOCA3IDIyIDAgMTItOCAyMy0xNSAyMS01MSA2Ni41dC01NCA3MC41cTI2IDUwIDQxIDk4bDE4MyAyOHExMyAyIDIxIDEyLjV0OCAyMy41eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==");
}

.jsplayer-時間調節枠,
.jsplayer-音量調節枠{
    margin: 0 5px;
    padding: 0;
    height: 20px;
}

.jsplayer-時間調節枠{
    flex-grow: 1;
}

.jsplayer-音量調節枠{
    width: 100px;
}

.jsplayer-時間調節バー,
.jsplayer-音量調節バー{
    position: relative;
    height: 5px;
    margin: 0 0 8px 0;
    padding: 0;
    background-color: #fff;
    border-radius: 2px;
    width: 100%;
    top: 7px;
}

.jsplayer-時間調節バー{
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAAICAIAAABcT7kVAAAAFUlEQVQI12N0WX+DgYGBiYGBgSQKAGI2AdswIf1pAAAAAElFTkSuQmCC");
    background-repeat: no-repeat;
    background-position: 0;
    background-size : 0;
}

.jsplayer-時間調節ポインタ,
.jsplayer-音量調節ポインタ{
    position: absolute;
    cursor: pointer;
    width: 10px;
    height: 18px;
    background-color: #ccc;
    top: -6px;
    left: 0px;
    background-image: linear-gradient(to bottom, #ccc, #aaa);
    border: solid 1px #999;
    border-radius: 3px;
}

.jsplayer-音量調節ポインタ{
    left: calc(100% - 10px);
}

.jsplayer-フォーム枠{
    width: 100%;
    margin: 0;
    padding: 0;
    display: flex;
}

.jsplayer-コメント入力{
    width: 80%;
    height: 26px;
    box-shadow: 3px 3px 3px rgba(200,200,200,0.2) inset;
    border: 1px solid #888888;
    border-radius: 0;
    padding:4px 6px 3px 12px;
    ime-mode: active;
}

.jsplayer-コメント投稿ボタン{
    width: 20%;
    height: 26px;
    text-align: center;
    padding: 3px 15px 3px 15px;
    font-size: 14px;
    color: #fff;
    background-color: #5ba825;
    background: linear-gradient(to bottom, #84be5c 0%, #84be5c 50%, #5ba825 50%, #5ba825 100%);
    border: 1px solid #377d00;
    font-family: 'MS PGothic', Meiryo, sans-serif;
    cursor: pointer;
}

.jsplayer-コメント{
    font-family: 'MS PGothic', Meiryo, sans-serif;
    position: absolute;
    left: 100%;
    line-height: 1;
    z-index: 2;
    color: #fff;
    text-shadow: -1px -1px #333, 1px -1px #333, -1px 1px #333, 1px 1px #333;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
    animation-duration: 17s;
    opacity: 0.8;
}
*/}).toString().match(/\/\*([^]*)\*\//)[1].trim();
