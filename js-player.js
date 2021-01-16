// vpos

class jsplayer extends HTMLElement{

    connectedCallback(){
        benry(this)

        this.$画面.初期幅   = this.csslen(this.$jsplayer, '--画面初期幅')
        this.$画面.初期高さ = this.csslen(this.$jsplayer, '--画面初期高さ')

        document.addEventListener('fullscreenchange', this.全画面_event)

        this.コメント設定 = this.コメント設定取得(this.$画面.初期高さ)
        this.$動画.src    = this.file
        this.$画面.focus()
    }


    disconnectedCallback(){
        document.removeEventListener('fullscreenchange', this.全画面_event)
    }


    static get observedAttributes(){
        return ['file', 'comment', 'post']
    }


    attributeChangedCallback(name, oldValue, newValue){
        this[name] = newValue
    }


    時間整形(time = 0){
        const min = Math.floor(time / 60)
        const sec = Math.floor(time - min * 60)

        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    }


    時間変更(sec){
        if(this.$動画.readyState){
            this.$動画.currentTime = this.limit(0, Math.floor(sec), this.$動画.duration)
        }
    }


    音量変更(vol){
        this.$動画.volume = this.limit(0, vol.toFixed(1), 1)
        this.$動画.muted  = false
    }


    再生速度変更(speed){
        if(this.$動画.readyState){
            this.$動画.playbackRate = this.limit(0.5, speed.toFixed(1), 3)
        }
    }


    シークポインタ(current = 0){
        return this.ポインタ(current, this.$シークポインタ)
    }


    音量ポインタ(current = 0){
        return this.ポインタ(current, this.$音量ポインタ)
    }


    ポインタ(current, $ポインタ){ //currentは「割合(0-1)」「クリックされた位置」の2パターンある
        const {width, left} = $ポインタ.parentNode.getBoundingClientRect()
        const 横幅  = width - this.csslen($ポインタ, 'width')
        const 位置  = (current <= 1) ? current*横幅 : current-left

        return {'位置':this.limit(0, 位置, 横幅), '割合':this.limit(0, 位置/横幅, 1)}
    }


    シークバッファ表示(){
        const buffer = this.$動画.buffered

        for(let i = 0; i < buffer.length; i++){
            if(buffer.end(i) > this.bufferMax){
                this.bufferMax = buffer.end(i)
                this.$シークバー.style.backgroundSize = `${this.bufferMax / this.$動画.duration * 100}% 100%`
            }
        }
    }


    OSD表示(str){
        const osd          = document.createElement('div')
        osd.textContent    = str
        osd.id             = 'OSD'
        osd.style.fontSize = `${this.コメント設定.文字サイズ}px`

        this.$.getElementById('OSD').replaceWith(osd)
    }


    コメント遅延(time, duration){
        const delay = time - duration
        return (delay > 0) ? `${delay.toFixed(3)*1000}ms` : '1ms'
    }


    コメント設定取得(画面高さ){
        let レーン数, レーン高さ, 文字サイズ, マージン

        if(画面高さ >= 360){
            レーン数   = Math.floor((画面高さ-360)/180) + 10
            レーン高さ = 画面高さ / レーン数 * 0.8
            文字サイズ = レーン高さ / 6 * 5 //22.5px以上必要
            マージン   = レーン高さ / 6
        }
        else{
            レーン数   = Math.floor(画面高さ*0.8/30)
            レーン高さ = 30
            文字サイズ = 25
            マージン   = 5
        }

        return {レーン数, レーン高さ, 文字サイズ, マージン}
    }


    コメント描画(data, レーン番号){
        const el = document.createElement('div')

        el.textContent          = data[0]
        el.className            = 'コメント'
        el.laneNumber           = レーン番号
        el.style.top            = レーン番号 * this.コメント設定.レーン高さ + this.コメント設定.マージン + 'px'
        el.style.fontSize       = this.コメント設定.文字サイズ + 'px'
        el.style.animationName  = 'comment-anime'
        el.style.animationDelay = this.コメント遅延(data[1], this.$動画.currentTime)

        return el
    }


    コメント放流(comment = []){
        if(!comment.length){
            return
        }

        const lane     = this.コメントレーン()
        const fragment = document.createDocumentFragment()
        let   number   = 0

        for(const i of lane.keys()){
            if(!(number in comment)){
                break
            }
            if(lane[i] === false){
                continue
            }
            fragment.append(this.コメント描画(comment[number], i))
            number++
        }

        this.$画面.prepend(fragment)
    }


    コメントレーン(){
        const レーン = Array(this.コメント設定.レーン数).fill(true)
        const 画面   = this.$画面.getBoundingClientRect()

        for(const comment of Array.from(this.$画面.children)){
            if(comment.className !== 'コメント'){
                continue
            }

            const {right} = comment.getBoundingClientRect()

            if(right > 画面.right-30){
                レーン[comment.laneNumber] = false
            }
            if(right < 画面.left){
                comment.remove()
            }
        }

        return レーン
    }


    コメント全消去(){
        for(const comment of this.$画面.querySelectorAll('.コメント')){
            comment.remove()
        }
    }


    コメント取得(){
        if(this.コメント || !this.comment){
            return
        }

        const max = Math.floor(this.$動画.duration) + 1
 
        this.コメント = Array(max).fill().map(v => [])

        for(const v of JSON.parse(this.comment)){
            const n = Math.floor(v[1])

            if(n < max){
                this.コメント[n].unshift(v)
            }
        }
    }


    コメント投稿(){
        const text = this.$コメント入力.value.trim()

        if(text === '' || !this.post || !this.$動画.readyState){
            return
        }

        const time = this.$動画.currentTime
        const sec  = Math.floor(time)
        const body = new URLSearchParams({vpos:time.toFixed(2), comment:text, file:this.$動画.src})

        fetch(this.post, {method:'POST', body})

        if(Array.isArray(this.コメント[sec+1])){
            this.コメント[sec+1].unshift([text, time+1])
        }
 
        this.$コメント入力.value = ''
    }



    $動画_click(event){
        if(!this.$動画.currentTime){
            this.$動画.play()
        }
        event.preventDefault()
    }


    $動画_dblclick(event){
        event.preventDefault()
    }


    $動画_loadedmetadata(event){
        this.bufferMax                    = 0
        this.$コメント入力.disabled       = false
        this.$コメント投稿ボタン.disabled = false
        this.$合計時間.textContent        = this.時間整形(this.$動画.duration)
        this.コメント取得()
    }


    $動画_canplaythrough(event){
        this.$動画.play()
    }


    $動画_timeupdate(event){
        const sec = Math.floor(this.$動画.currentTime)
        if(sec === this.更新時間){
            return
        }
        this.更新時間 = sec

        if(!this.$シークポインタ.isDrag){
            this.$現在時間.textContent = this.時間整形(this.$動画.currentTime)
            this.$合計時間.textContent = this.時間整形(this.$動画.duration)

            this.$シークポインタ.style.left = this.シークポインタ(this.$動画.currentTime/this.$動画.duration).位置 + 'px'
        }

        if(!this.$動画.paused && !this.$jsplayer.hasAttribute('data-comment_off')){
            this.コメント放流(this.コメント[sec])
        }

        this.シークバッファ表示()
    }


    $動画_play(event){
        this.$jsplayer.removeAttribute('data-pause')
    }


    $動画_pause(event){
        this.$jsplayer.setAttribute('data-pause', '')
    }


    $動画_seeking(event){
        this.コメント全消去()
    }


    $動画_ended(event){
        this.コメント全消去()
    }


    $動画_volumechange(event){
        if(!this.$動画.volume || this.$動画.muted){
            this.$jsplayer.setAttribute('data-mute', '')
        }
        else{
            this.$jsplayer.removeAttribute('data-mute')
        }

        this.$音量ポインタ.style.left = this.音量ポインタ(this.$動画.volume).位置 + 'px'
    }


    $動画_ratechange(event){
        this.OSD表示(`x${this.$動画.playbackRate.toFixed(1)}`)
    }


    $動画_error(event){
        const error = event.target.error

        if(error.code === error.MEDIA_ERR_SRC_NOT_SUPPORTED){
            this.OSD表示('動画ファイルが存在しません')
        }
        else if(error.code === error.MEDIA_ERR_DECODE){
            this.OSD表示('動画ファイルが未対応の形式です')
        }
        else if(error.code === error.MEDIA_ERR_ABORTED){
            this.OSD表示('動画の再生が中断されました')
        }
        else if(error.code === error.MEDIA_ERR_NETWORK){
            this.OSD表示('ネットワークにエラーが発生しました')
        }
        else{
            this.OSD表示('未知のエラーが発生しました')
        }

        this.コメント全消去()
    }


    $再生ボタン_click(event){
        if(this.$動画.readyState){
            this.$動画.paused ? this.$動画.play() : this.$動画.pause()
        }
    }


    $シーク枠_click(event){
        if(this.$動画.readyState && !this.$シークポインタ.isDrag){
            this.時間変更(this.$動画.duration * this.シークポインタ(event.clientX).割合)
        }
    }


    $シーク枠_wheel(event){
        if(this.$動画.readyState){
            (event.deltaY > 0) ? this.時間変更(this.$動画.currentTime+15) : this.時間変更(this.$動画.currentTime-15)
        }
    }


    $シークポインタ_mousedown(event){
        if(this.$動画.readyState){
            this.$シークポインタ.isDrag = true
            document.addEventListener('mousemove', this.シークポインタ操作_event)
            document.addEventListener('mouseup', this.シークポインタ操作終了_event, {once:true})
        }
    }


    $音量ボタン_click(event){
        let volume = 0.5

        if(this.$動画.muted){
            this.$動画.muted = false
        }
        else if(this.$動画.volume){
            volume = 0
        }

        this.音量変更(volume)
    }


    $音量枠_click(event){
        if(!this.$音量ポインタ.isDrag){
            this.$動画.muted = false
            this.音量変更(this.音量ポインタ(event.clientX).割合)
        }
    }


    $音量枠_wheel(event){
        (event.deltaY > 0) ? this.音量変更(this.$動画.volume+0.1) : this.音量変更(this.$動画.volume-0.1)
    }


    $音量ポインタ_mousedown(event){
        this.$音量ポインタ.isDrag = true

        document.addEventListener('mousemove', this.音量ポインタ操作_event)
        document.addEventListener('mouseup', this.音量ポインタ操作終了_event, {once:true})
    }


    $コメント表示ボタン_click(event){
        if(this.$jsplayer.hasAttribute('data-comment_off')){
            this.$jsplayer.removeAttribute('data-comment_off')
        }
        else{
            this.コメント全消去()
            this.$jsplayer.setAttribute('data-comment_off', '')
        }
    }


    $全画面ボタン_click(event){
        (document.fullscreenElement === this) ? document.exitFullscreen() : this.$画面.requestFullscreen()
    }


    $フォーム枠_submit(event){
        event.preventDefault()
        this.コメント投稿()
        this.$動画.play()
        this.$画面.focus()
    }


    $コメント入力_focus(event){
        this.$動画.pause()
    }


    $jsplayer_keydown(event){
        this.$コントローラ.style.visibility = 'visible'

        if(event.target.tagName === 'INPUT'){
            return
        }

        if(event.which == 32){ //Space
            this.$コメント入力.focus()
        }
        else if(event.which == 13 && event.ctrlKey){ //Ctrl+Enter
            this.$全画面ボタン.click()
        }
        else if(event.which == 13){ //Enter
            this.$動画.paused ? this.$動画.play() : this.$動画.pause()
        }
        else if(event.which == 39){ //→
            this.時間変更(this.$動画.currentTime+15)
        }
        else if(event.which == 37){ //←
            this.時間変更(this.$動画.currentTime-15)
        }
        else if(event.which == 36){ //Home
            this.時間変更(0)
        }
        else if(event.which == 35){ //End
            this.時間変更(this.$動画.duration - 10)
        }
        else if(event.which == 38){ //↑
            this.音量変更(this.$動画.volume+0.1)
        }
        else if(event.which == 40){ //↓
            this.音量変更(this.$動画.volume-0.1)
        }
        else if(event.which == 107){ //num+
            this.再生速度変更(this.$動画.playbackRate+0.1)
        }
        else if(event.which == 187 && event.shiftKey){ //+
            this.再生速度変更(this.$動画.playbackRate+0.1)
        }
        else if(event.which == 109){ //num-
            this.再生速度変更(this.$動画.playbackRate-0.1)
        }
        else if(event.which == 189){ //-
            this.再生速度変更(this.$動画.playbackRate-0.1)
        }
        else{
            return
        }

        event.preventDefault()
    }



    シークポインタ操作_event(event){
        const ポインタ = this.シークポインタ(event.clientX)
        this.$現在時間.textContent      = this.時間整形(this.$動画.duration * ポインタ.割合)
        this.$シークポインタ.style.left = ポインタ.位置 + 'px'
    }


    シークポインタ操作終了_event(event){
        document.removeEventListener('mousemove', this.シークポインタ操作_event)
        this.$シークポインタ.isDrag = false

        this.時間変更(this.$動画.duration * this.シークポインタ(event.clientX).割合)
    }


    音量ポインタ操作_event(event){
        this.音量変更(this.音量ポインタ(event.clientX).割合)
    }


    音量ポインタ操作終了_event(event){
        document.removeEventListener('mousemove', this.音量ポインタ操作_event)

        this.$音量ポインタ.isDrag = false
    }


    全画面_event(event){
        if(document.fullscreenElement === this){
            this.$画面.onmousedown  = this.コントローラ切り替え_event
            this.$画面.onmousemove  = this.マウスタイマ_event

            this.$画面.append(this.$コントローラ)
            this.$コントローラ.style.visibility = 'hidden'
            this.$画面.style.cursor = 'none'

            this.$jsplayer.style.setProperty('--画面幅', `${screen.width}px`)

            this.コメント設定 = this.コメント設定取得(screen.height)
            this.コメント全消去()
            this.$画面.focus()
        }
        else{
            this.$画面.onmousedown  = null
            this.$画面.onmousemove  = null

            if(this.timer){
                clearTimeout(this.timer)
                this.timer = null
            }

            this.$jsplayer.append(this.$コントローラ)
            this.$コントローラ.style.visibility = 'visible'
            this.$画面.style.cursor = 'auto'

            this.$jsplayer.style.setProperty('--画面幅', `${this.$画面.初期幅}px`)

            this.コメント設定 = this.コメント設定取得(this.$画面.初期高さ)
            this.コメント全消去()
            this.$画面.focus()
        }
    }


    コントローラ切り替え_event(event){
        if(this.$コントローラ.style.visibility === 'hidden'){
            this.$コントローラ.style.visibility = 'visible'
        }
        else if(!this.$コントローラ.contains(event.target)){
            this.$コントローラ.style.visibility = 'hidden'
        }
    }


    マウスタイマ_event(event){
        if(this.timer){
            clearTimeout(this.timer)
        }
        this.timer = setTimeout(() => this.$画面.style.cursor = 'none', 2500)
        this.$画面.style.cursor = 'auto'
    }



    limit(min, val, max){
        if(val < min){
            return min
        }
        else if(val > max){
            return max
        }
        else{
            return val
        }
    }


    csslen(el, property){
        return parseInt(getComputedStyle(el).getPropertyValue(property), 10) || 0
    }


    get html(){
        return `
        <div id="jsplayer" data-pause>
          <div id="画面" tabindex="1">
            <div id="OSD"></div>
            <video id="動画" loop></video>
          </div>
          <div id="コントローラ">
            <div id="コントローラ枠">
              <div id="再生ボタン"></div>
              <div id="現在時間">00:00</div>
              <div id="シーク枠">
                <div id="シークバー">
                  <div id="シークポインタ"></div>
                </div>
              </div>
              <div id="合計時間">00:00</div>
              <div id="音量ボタン"></div>
              <div id="音量枠">
                <div id="音量バー">
                  <div id="音量ポインタ"></div>
                </div>
              </div>
              <div id="コメント表示ボタン"></div>
              <div id="全画面ボタン"></div>
            </div>
            <form id="フォーム枠" action="javascript:void(0)">
              <input id="コメント入力" type="text" value="" autocomplete="off" spellcheck="false" maxlength="60" tabindex="2" disabled>
              <input id="コメント投稿ボタン" type="submit" value="コメントする" disabled>
            </form>
          </div>
        </div>
        `
    }


    get css(){
        return `
        #jsplayer{
            --画面初期幅: 960px;
            --画面初期高さ: 540px;
            --画面幅: var(--画面初期幅);
        }

        #jsplayer *{
            box-sizing: border-box;
        }

        #動画{
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        #画面{
            width: var(--画面初期幅);
            height: var(--画面初期高さ);
            background-color: #000;
            overflow: hidden;
            white-space : nowrap;
            user-select: none;
            position: relative;
            cursor: default;
        }

        #画面:focus{
            outline: none;
        }

        #画面:fullscreen{
            position: absolute;
            width: 100% !important;
            height: 100% !important;
            left: 0;
            top: 0;
        }

        #OSD{
            font-family: Arial, sans-serif;
            position: absolute;
            right: 2%;
            top: 5%;
            background-color: #000;
            color:#0f0;
            z-index: 3;
            animation-name: osd-hide;
            animation-duration: 3s;
            animation-fill-mode: forwards;
            animation-timing-function: step-end;
        }

        @keyframes osd-hide{
            to{
                opacity: 0;
            }
        }

        #コントローラ{
            width: var(--画面初期幅);
            color: white;
            background: #47494f;
            border-color: #2f3034 #2f3034 #232427;
            background-image: linear-gradient(to bottom, #555, #333 66%, #000);
            user-select: none;
            cursor: default;
            line-height: 1;
        }

        #画面 > #コントローラ{
            position: absolute;
            left: 0;
            right: 0;
            margin-left: auto;
            margin-right: auto;
            bottom: 0;
        }

        #コントローラ枠{
            width: 100%;
            display: flex;
            align-items: center;
            padding: 4px;
        }

        #現在時間,
        #合計時間{
            font-family: Arial, sans-serif;
            font-size: 12px;
            text-align: center;
            width: 40px;
            overflow: hidden;
        }


        #再生ボタン,
        #音量ボタン,
        #コメント表示ボタン,
        #全画面ボタン{
            width: 20px;
            height: 20px;
            background-size: 20px;
            background-repeat: no-repeat;
            background-position: 50% 50%;
            margin: 0 3px;
            padding: 0;
            cursor: pointer;
        }

        #再生ボタン{
            background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xNjY0IDE5MnYxNDA4cTAgMjYtMTkgNDV0LTQ1IDE5aC01MTJxLTI2IDAtNDUtMTl0LTE5LTQ1di0xNDA4cTAtMjYgMTktNDV0NDUtMTloNTEycTI2IDAgNDUgMTl0MTkgNDV6bS04OTYgMHYxNDA4cTAgMjYtMTkgNDV0LTQ1IDE5aC01MTJxLTI2IDAtNDUtMTl0LTE5LTQ1di0xNDA4cTAtMjYgMTktNDV0NDUtMTloNTEycTI2IDAgNDUgMTl0MTkgNDV6IiBmaWxsPSIjZmZmIi8+PC9zdmc+");
        }

        [data-pause] #再生ボタン{
            background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xNTc2IDkyN2wtMTMyOCA3MzhxLTIzIDEzLTM5LjUgM3QtMTYuNS0zNnYtMTQ3MnEwLTI2IDE2LjUtMzZ0MzkuNSAzbDEzMjggNzM4cTIzIDEzIDIzIDMxdC0yMyAzMXoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=");
        }

        #音量ボタン{
            background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik04MzIgMzUydjEwODhxMCAyNi0xOSA0NXQtNDUgMTktNDUtMTlsLTMzMy0zMzNoLTI2MnEtMjYgMC00NS0xOXQtMTktNDV2LTM4NHEwLTI2IDE5LTQ1dDQ1LTE5aDI2MmwzMzMtMzMzcTE5LTE5IDQ1LTE5dDQ1IDE5IDE5IDQ1em0zODQgNTQ0cTAgNzYtNDIuNSAxNDEuNXQtMTEyLjUgOTMuNXEtMTAgNS0yNSA1LTI2IDAtNDUtMTguNXQtMTktNDUuNXEwLTIxIDEyLTM1LjV0MjktMjUgMzQtMjMgMjktMzUuNSAxMi01Ny0xMi01Ny0yOS0zNS41LTM0LTIzLTI5LTI1LTEyLTM1LjVxMC0yNyAxOS00NS41dDQ1LTE4LjVxMTUgMCAyNSA1IDcwIDI3IDExMi41IDkzdDQyLjUgMTQyem0yNTYgMHEwIDE1My04NSAyODIuNXQtMjI1IDE4OC41cS0xMyA1LTI1IDUtMjcgMC00Ni0xOXQtMTktNDVxMC0zOSAzOS01OSA1Ni0yOSA3Ni00NCA3NC01NCAxMTUuNS0xMzUuNXQ0MS41LTE3My41LTQxLjUtMTczLjUtMTE1LjUtMTM1LjVxLTIwLTE1LTc2LTQ0LTM5LTIwLTM5LTU5IDAtMjYgMTktNDV0NDUtMTlxMTMgMCAyNiA1IDE0MCA1OSAyMjUgMTg4LjV0ODUgMjgyLjV6bTI1NiAwcTAgMjMwLTEyNyA0MjIuNXQtMzM4IDI4My41cS0xMyA1LTI2IDUtMjYgMC00NS0xOXQtMTktNDVxMC0zNiAzOS01OSA3LTQgMjIuNS0xMC41dDIyLjUtMTAuNXE0Ni0yNSA4Mi01MSAxMjMtOTEgMTkyLTIyN3Q2OS0yODktNjktMjg5LTE5Mi0yMjdxLTM2LTI2LTgyLTUxLTctNC0yMi41LTEwLjV0LTIyLjUtMTAuNXEtMzktMjMtMzktNTkgMC0yNiAxOS00NXQ0NS0xOXExMyAwIDI2IDUgMjExIDkxIDMzOCAyODMuNXQxMjcgNDIyLjV6IiBmaWxsPSIjZmZmIi8+PC9zdmc+");
        }

        [data-mute] #音量ボタン{
            background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im04MzIsMzQ4bDAsMTA4OHEwLDI2IC0xOSw0NXQtNDUsMTl0LTQ1LC0xOWwtMzMzLC0zMzNsLTI2MiwwcS0yNiwwIC00NSwtMTl0LTE5LC00NWwwLC0zODRxMCwtMjYgMTksLTQ1dDQ1LC0xOWwyNjIsMGwzMzMsLTMzM3ExOSwtMTkgNDUsLTE5dDQ1LDE5dDE5LDQ1eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==");
        }

        #コメント表示ボタン{
            background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im02NDAsNzkycTAsLTUzIC0zNy41LC05MC41dC05MC41LC0zNy41dC05MC41LDM3LjV0LTM3LjUsOTAuNXQzNy41LDkwLjV0OTAuNSwzNy41dDkwLjUsLTM3LjV0MzcuNSwtOTAuNXptMzg0LDBxMCwtNTMgLTM3LjUsLTkwLjV0LTkwLjUsLTM3LjV0LTkwLjUsMzcuNXQtMzcuNSw5MC41dDM3LjUsOTAuNXQ5MC41LDM3LjV0OTAuNSwtMzcuNXQzNy41LC05MC41em0zODQsMHEwLC01MyAtMzcuNSwtOTAuNXQtOTAuNSwtMzcuNXQtOTAuNSwzNy41dC0zNy41LDkwLjV0MzcuNSw5MC41dDkwLjUsMzcuNXQ5MC41LC0zNy41dDM3LjUsLTkwLjV6bTM4NCwwcTAsMTc0IC0xMjAsMzIxLjV0LTMyNiwyMzN0LTQ1MCw4NS41cS0xMTAsMCAtMjExLC0xOHEtMTczLDE3MyAtNDM1LDIyOXEtNTIsMTAgLTg2LDEzcS0xMiwxIC0yMiwtNnQtMTMsLTE4cS00LC0xNSAyMCwtMzdxNSwtNSAyMy41LC0yMS41dDI1LjUsLTIzLjV0MjMuNSwtMjUuNXQyNCwtMzEuNXQyMC41LC0zN3QyMCwtNDh0MTQuNSwtNTcuNXQxMi41LC03Mi41cS0xNDYsLTkwIC0yMjkuNSwtMjE2LjV0LTgzLjUsLTI2OS41cTAsLTE3NCAxMjAsLTMyMS41dDMyNiwtMjMzLjAwMDA3NnQ0NTAsLTg1LjUwMDMydDQ1MCw4NS41MDAzMnQzMjYsMjMzLjAwMDA3NnQxMjAsMzIxLjV6IiBmaWxsPSIjZmZmIi8+PC9zdmc+");
        }

        [data-comment_off] #コメント表示ボタン{
            background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im0xNzkyLDc5MnEwLDE3NCAtMTIwLDMyMS41dC0zMjYsMjMzdC00NTAsODUuNXEtNzAsMCAtMTQ1LC04cS0xOTgsMTc1IC00NjAsMjQycS00OSwxNCAtMTE0LDIycS0xNywyIC0zMC41LC05dC0xNy41LC0yOWwwLC0xcS0zLC00IC0wLjUsLTEydDIsLTEwdDQuNSwtOS41bDYsLTlsNywtOC41bDgsLTlxNywtOCAzMSwtMzQuNXQzNC41LC0zOHQzMSwtMzkuNXQzMi41LC01MXQyNywtNTl0MjYsLTc2cS0xNTcsLTg5IC0yNDcuNSwtMjIwdC05MC41LC0yODFxMCwtMTMwIDcxLC0yNDguNXQxOTEsLTIwNC41MDA3OTN0Mjg2LC0xMzYuNDk5Nzg2dDM0OCwtNTAuNDk5ODE3cTI0NCwwIDQ1MCw4NS40OTk2OHQzMjYsMjMzLjAwMDM4MXQxMjAsMzIxLjUwMDMzNnoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=");
        }

        #全画面ボタン{
            background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik04ODMgMTA1NnEwIDEzLTEwIDIzbC0zMzIgMzMyIDE0NCAxNDRxMTkgMTkgMTkgNDV0LTE5IDQ1LTQ1IDE5aC00NDhxLTI2IDAtNDUtMTl0LTE5LTQ1di00NDhxMC0yNiAxOS00NXQ0NS0xOSA0NSAxOWwxNDQgMTQ0IDMzMi0zMzJxMTAtMTAgMjMtMTB0MjMgMTBsMTE0IDExNHExMCAxMCAxMCAyM3ptNzgxLTg2NHY0NDhxMCAyNi0xOSA0NXQtNDUgMTktNDUtMTlsLTE0NC0xNDQtMzMyIDMzMnEtMTAgMTAtMjMgMTB0LTIzLTEwbC0xMTQtMTE0cS0xMC0xMC0xMC0yM3QxMC0yM2wzMzItMzMyLTE0NC0xNDRxLTE5LTE5LTE5LTQ1dDE5LTQ1IDQ1LTE5aDQ0OHEyNiAwIDQ1IDE5dDE5IDQ1eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==");
        }

        #設定ボタン{
            background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMTUyIDg5NnEwLTEwNi03NS0xODF0LTE4MS03NS0xODEgNzUtNzUgMTgxIDc1IDE4MSAxODEgNzUgMTgxLTc1IDc1LTE4MXptNTEyLTEwOXYyMjJxMCAxMi04IDIzdC0yMCAxM2wtMTg1IDI4cS0xOSA1NC0zOSA5MSAzNSA1MCAxMDcgMTM4IDEwIDEyIDEwIDI1dC05IDIzcS0yNyAzNy05OSAxMDh0LTk0IDcxcS0xMiAwLTI2LTlsLTEzOC0xMDhxLTQ0IDIzLTkxIDM4LTE2IDEzNi0yOSAxODYtNyAyOC0zNiAyOGgtMjIycS0xNCAwLTI0LjUtOC41dC0xMS41LTIxLjVsLTI4LTE4NHEtNDktMTYtOTAtMzdsLTE0MSAxMDdxLTEwIDktMjUgOS0xNCAwLTI1LTExLTEyNi0xMTQtMTY1LTE2OC03LTEwLTctMjMgMC0xMiA4LTIzIDE1LTIxIDUxLTY2LjV0NTQtNzAuNXEtMjctNTAtNDEtOTlsLTE4My0yN3EtMTMtMi0yMS0xMi41dC04LTIzLjV2LTIyMnEwLTEyIDgtMjN0MTktMTNsMTg2LTI4cTE0LTQ2IDM5LTkyLTQwLTU3LTEwNy0xMzgtMTAtMTItMTAtMjQgMC0xMCA5LTIzIDI2LTM2IDk4LjUtMTA3LjV0OTQuNS03MS41cTEzIDAgMjYgMTBsMTM4IDEwN3E0NC0yMyA5MS0zOCAxNi0xMzYgMjktMTg2IDctMjggMzYtMjhoMjIycTE0IDAgMjQuNSA4LjV0MTEuNSAyMS41bDI4IDE4NHE0OSAxNiA5MCAzN2wxNDItMTA3cTktOSAyNC05IDEzIDAgMjUgMTAgMTI5IDExOSAxNjUgMTcwIDcgOCA3IDIyIDAgMTItOCAyMy0xNSAyMS01MSA2Ni41dC01NCA3MC41cTI2IDUwIDQxIDk4bDE4MyAyOHExMyAyIDIxIDEyLjV0OCAyMy41eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==");
        }

        #シーク枠,
        #音量枠{
            margin: 0 5px;
            padding: 0;
            height: 20px;
        }

        #シーク枠{
            flex-grow: 1;
        }

        #音量枠{
            width: 100px;
        }

        #シークバー,
        #音量バー{
            position: relative;
            height: 5px;
            margin: 0 0 8px 0;
            padding: 0;
            background-color: #fff;
            border-radius: 2px;
            width: 100%;
            top: 7px;
        }

        #シークバー{
            background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAAICAIAAABcT7kVAAAAFUlEQVQI12N0WX+DgYGBiYGBgSQKAGI2AdswIf1pAAAAAElFTkSuQmCC");
            background-repeat: no-repeat;
            background-position: 0;
            background-size : 0;
        }

        #シークポインタ,
        #音量ポインタ{
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

        #音量ポインタ{
            left: calc(100% - 10px);
        }

        #フォーム枠{
            width: 100%;
            margin: 0;
            padding: 0;
            display: flex;
        }

        #コメント入力{
            width: 80%;
            height: 26px;
            box-shadow: 3px 3px 3px rgba(200,200,200,0.2) inset;
            border: 1px solid #888888;
            border-radius: 0;
            padding:4px 6px 3px 12px;
            ime-mode: active;
        }

        #コメント投稿ボタン{
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

        .コメント{
            font-family: 'MS PGothic', Meiryo, sans-serif;
            position: absolute;
            left: 100%;
            line-height: 1;
            z-index: 2;
            color: #fff;
            text-shadow: -1px -1px #333, 1px -1px #333, -1px 1px #333, 1px 1px #333;
            animation-fill-mode: forwards;
            animation-timing-function: linear;
            animation-duration: 34s;
            opacity: 0.95;
        }

        [data-pause] .コメント{
            animation-play-state: paused;
        }

        @keyframes comment-anime{
            from{
                transform:translateX(0);
            }
            to{
                transform:translateX(calc(-10 * var(--画面幅)));
            }
        }
        `
    }
}



function benry(self){ // https://qiita.com/economist/items/6c923c255f6b4b7bbf84
    self.$ = self.attachShadow({mode:'open'})
    self.$.innerHTML = `<style id="css">${self.css || ''}</style>${self.html || ''}`

    for(const el of self.$.querySelectorAll('[id]')){
        self[`$${el.id}`] = el
    }

    for(const name of Object.getOwnPropertyNames(self.constructor.prototype)){
        if(name.endsWith('_event')){ // 追加コード
            self[name] = self.constructor.prototype[name].bind(self)
            continue
        }

        if(!name.startsWith('$')){
            continue
        }

        const [$id, event] = name.split(/_([^_]*?)$/)

        if(self[$id] && event){
            self[name] = self.constructor.prototype[name].bind(self)
            self[$id].addEventListener(event, self[name])
        }
    }
}


customElements.define('js-player', jsplayer)
