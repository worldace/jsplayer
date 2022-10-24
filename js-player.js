
class JSPlayer extends HTMLElement{

    connectedCallback(){
        benry(this)

        this.file    = this.getAttribute('file')
        this.post    = this.getAttribute('post')
        this.width   = this.getAttribute('width') || 960
        this.height  = this.getAttribute('height') || 540
        this.comment = this.getAttribute('comment')
        this.config  = this.commentConfig(this.height)

        this.$jsplayer.style.setProperty('--width',  this.width  + 'px')
        this.$jsplayer.style.setProperty('--height', this.height + 'px')

        this.$video.src = this.file
        this.$screen.focus()
    }


    $video_click(event){
        event.preventDefault()
        this.$video.play()
    }


    $video_dblclick(event){
        event.preventDefault()
    }


    $video_loadedmetadata(event){
        this.$formInput.disabled    = false
        this.$formButton.disabled   = false
        this.$timeTotal.textContent = this.timeFormat(this.$video.duration)

        this.comments ??= this.commentPrepare()
    }


    $video_timeupdate(event){
        const sec = Math.floor(this.$video.currentTime)

        if(sec === this.lastUpdate){
            return
        }
        this.lastUpdate = sec

        this.timeRender(this.$video.currentTime)

        if(this.$jsplayer.dataset.commentOff === 'false' && this.comments[sec]){
            this.commentRender(this.comments[sec])
        }
    }


    $video_play(event){
        this.$jsplayer.dataset.pause = false
    }


    $video_pause(event){
        this.$jsplayer.dataset.pause = true
    }


    $video_seeking(event){
        this.commentClear()
    }


    $video_ended(event){
        this.commentClear()
    }


    $video_volumechange(event){
        this.$jsplayer.dataset.mute = this.$video.muted || !this.$video.volume
        this.thumbRender(this.$volumeThumb, this.$video.volume)
    }


    $video_ratechange(event){
        this.guideRender('x' + this.$video.playbackRate.toFixed(1))
    }


    $video_error(event){
        const error = event.target.error

        switch(error.code){
            case error.MEDIA_ERR_SRC_NOT_SUPPORTED : return this.guideRender('動画ファイルが存在しません')
            case error.MEDIA_ERR_DECODE            : return this.guideRender('動画ファイルが未対応の形式です')
            case error.MEDIA_ERR_ABORTED           : return this.guideRender('動画の再生が中断されました')
            case error.MEDIA_ERR_NETWORK           : return this.guideRender('ネットワークエラーが発生しました')
            default                                : return this.guideRender('エラーが発生しました')
        }
    }


    $playButton_click(event){
        if(this.$video.readyState){
            this.$video.paused ? this.$video.play() : this.$video.pause()
        }
    }


    $seekArea_mousedown(event){
        const time = this.$video.duration * this.percentageX(this.$seekArea, event.x)
        this.timeRender(time)
        this.timeSet(time)
    }


    $seekArea_wheel(event){
        const delta = event.deltaY > 0 ? 15 : -15
        this.timeRender(this.$video.currentTime + delta)
        this.timeSet(this.$video.currentTime + delta)
    }


    $seekThumb_pointermove(event){
        if(event.buttons){
            const time = this.$video.duration * this.percentageX(this.$seekArea, event.x)
            this.timeRender(time)
            this.timeSet(time)
            event.target.setPointerCapture(event.pointerId)
        }
    }


    $volumeButton_click(event){
        let volume = 0.5

        if(this.$video.muted){
            this.$video.muted = false
        }
        else if(this.$video.volume){
            volume = 0
        }

        this.volumeSet(volume)
    }


    $volumeArea_mousedown(event){
        this.$video.muted = false
        this.volumeSet(this.percentageX(this.$volumeArea, event.x))
    }


    $volumeArea_wheel(event){
        const delta = event.deltaY > 0 ? 0.1 : -0.1
        this.volumeSet(this.$video.volume + delta)
    }


    $volumeThumb_pointermove(event){
        if(event.buttons){
            this.$video.muted = false
            this.volumeSet(this.percentageX(this.$volumeArea, event.x))
            event.target.setPointerCapture(event.pointerId)
        }
    }


    $commentOffButton_click(event){
        if(this.$jsplayer.dataset.commentOff === 'true'){
            this.$jsplayer.dataset.commentOff = false
        }
        else{
            this.$jsplayer.dataset.commentOff = true
            this.commentClear()
        }
    }


    $fullscreenButton_click(event){
        document.fullscreenElement ? document.exitFullscreen() : this.$screen.requestFullscreen()
    }


    $form_submit(event){
        event.preventDefault()
        this.commentPost()
        this.$video.play()
        this.$screen.focus()
    }


    $formInput_focus(event){
        this.$video.pause()
    }


    $shadow_keydown(event){
        this.$controller.style.visibility = 'visible'

        if(event.target.tagName === 'INPUT'){
            return
        }

        if(event.code === 'Space'){
            this.$formInput.focus()
        }
        else if(event.code === 'Enter' && event.ctrlKey){
            this.$fullscreenButton.click()
        }
        else if(event.code === 'Enter'){
            this.$video.paused ? this.$video.play() : this.$video.pause()
        }
        else if(event.code === 'ArrowRight'){
            this.timeSet(this.$video.currentTime + 15)
        }
        else if(event.code === 'ArrowLeft'){
            this.timeSet(this.$video.currentTime - 15)
        }
        else if(event.code === 'Home'){
            this.timeSet(0)
        }
        else if(event.code === 'End'){
            this.timeSet(this.$video.duration - 15)
        }
        else if(event.code === 'ArrowUp'){
            this.volumeSet(this.$video.volume + 0.1)
        }
        else if(event.code === 'ArrowDown'){
            this.volumeSet(this.$video.volume - 0.1)
        }
        else if(event.code === 'NumpadAdd'){
            this.rateSet(this.$video.playbackRate + 0.1)
        }
        else if(event.code === 'Semicolon' && event.shiftKey){
            this.rateSet(this.$video.playbackRate + 0.1)
        }
        else if(event.code === 'NumpadSubtract'){
            this.rateSet(this.$video.playbackRate - 0.1)
        }
        else if(event.code === 'Minus'){
            this.rateSet(this.$video.playbackRate - 0.1)
        }
        else{
            return
        }

        event.preventDefault()
    }


    $shadow_fullscreenchange(event){
        event.stopPropagation()

        if(document.fullscreenElement){
            this.$screen.onmousedown = this.fullscreenController
            this.$screen.onmousemove = this.fullscreenMouse

            this.$screen.append(this.$controller)
            this.$screen.style.cursor = 'none'
            this.$controller.style.visibility = 'hidden'

            this.$jsplayer.style.setProperty('--screen-width', `${screen.width}px`)

            this.config = this.commentConfig(screen.height)
            this.commentClear()
            this.$screen.focus()
        }
        else{
            this.$screen.onmousedown = null
            this.$screen.onmousemove = null

            this.timer = clearTimeout(this.timer)

            this.$jsplayer.append(this.$controller)
            this.$screen.style.cursor = 'auto'
            this.$controller.style.visibility = 'visible'

            this.$jsplayer.style.setProperty('--screen-width', `${this.width}px`)

            this.config = this.commentConfig(this.height)
            this.commentClear()
            this.$screen.focus()
        }
    }


    fullscreenController(event){
        if(this.$controller.style.visibility === 'hidden'){
            this.$controller.style.visibility = 'visible'
        }
        else if(!this.$controller.contains(event.target)){
            this.$controller.style.visibility = 'hidden'
        }
    }


    fullscreenMouse(event){
        clearTimeout(this.timer)
        this.timer = setTimeout(() => this.$screen.style.cursor = 'none', 2500)
        this.$screen.style.cursor = 'auto'
    }


    volumeSet(vol){
        this.$video.volume = clamp(0, vol, 1)
        this.$video.muted  = false
    }


    rateSet(rate){
        if(this.$video.readyState){
            this.$video.playbackRate = clamp(0.5, rate, 3)
        }
    }


    timeSet(sec){
        if(this.$video.readyState){
            this.$video.currentTime = clamp(0, sec, this.$video.duration)
        }
    }


    timeFormat(time){
        const min = Math.floor(time / 60)
        const sec = Math.floor(time - min * 60)

        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    }


    timeRender(time){
        if(this.$video.readyState){
            time = clamp(0, time, this.$video.duration)
            this.$timeCurrent.textContent = this.timeFormat(time)
            this.thumbRender(this.$seekThumb, time/this.$video.duration)
            this.bufferRender()
        }
    }


    thumbRender($thumb, percent){
        const limit = $thumb.parentElement.clientWidth - $thumb.clientWidth
        $thumb.style.left = clamp(0, limit*percent, limit) + 'px'
    }


    guideRender(text){
        this.$('#guide').outerHTML = `<div id="guide" style="font-size:${this.config.fontSize}px">${text}</div>`
    }


    bufferRender(){
        this.bufferMax ??= 0
        const buffer = this.$video.buffered

        for(let i = 0; i < buffer.length; i++){
            if(buffer.end(i) > this.bufferMax){
                this.bufferMax = buffer.end(i)
                this.$seekTrack.style.backgroundSize = `${this.bufferMax / this.$video.duration * 100}% 100%`
            }
        }
    }


    percentageX($area, x){
        const {left, width} = $area.getBoundingClientRect()
        return clamp(0, (x-left)/width, 1)
    }


    commentConfig(height){
        const laneCount  = Math.floor(10 + (height - 360) / 180)
        const laneHeight = height / laneCount * 0.8
        const fontSize   = laneHeight / 6 * 5
        const margin     = laneHeight / 6

        return {laneCount, laneHeight, fontSize, margin, lane:[...Array(laneCount).keys()]}
    }


    commentPrepare(){
        const comments = Array( Math.floor(this.$video.duration+60) ).fill().map(v => [])

        if(this.comment){
            for(const [text, vpos] of JSON.parse(this.comment)){
                comments[Math.floor(vpos/100)]?.push([text.substring(0,64), vpos/100])
            }
        }

        return comments
    }


    commentRender(comments){
        for(const [i,v] of this.commentLane().entries()){
            if(!comments[i]){
                return
            }
            this.$screen.append( this.commentElement(comments[i][0], comments[i][1], v) )
        }
    }


    commentLane(){
        const lane   = new Set(this.config.lane)
        const screen = this.$screen.getBoundingClientRect()

        for(const el of this.$('*.comment')){
            const {right} = el.getBoundingClientRect()

            if(right < screen.left){
                el.remove()
            }
            else if(right > screen.right - 20){
                lane.delete(el.laneNumber)
            }
        }

        return Array.from(lane)
    }


    commentElement(text, time, laneNumber){
        const el = document.createElement('div')

        el.textContent          = text
        el.className            = 'comment'
        el.laneNumber           = laneNumber
        el.style.top            = laneNumber * this.config.laneHeight + this.config.margin + 'px'
        el.style.fontSize       = this.config.fontSize + 'px'
        el.style.animationDelay = Math.max(0, time - this.$video.currentTime) + 's'
        el.onanimationend       = event => el.remove()

        return el
    }


    commentClear(){
        this.$('*.comment').forEach(el => el.remove())
    }


    commentPost(){
        const text = this.$formInput.value.trim().substring(0,64)
        const time = this.$video.currentTime

        if(text && this.post && this.$video.readyState){
            fetch(this.post, {method:'POST', body:new URLSearchParams({text, vpos:time.toFixed(2)*100, file:this.$video.src})})
            setTimeout(() => this.comments[Math.floor(time)].unshift([text, time]), 2000)
            this.commentRender([[text, 0]])
            this.$formInput.value = ''
        }
    }


    html(){
        return `
<div id="jsplayer" data-pause="true" data-comment-off="false">
  <div id="screen" tabindex="1">
    <div id="guide"></div>
    <video id="video" loop autoplay></video>
  </div>
  <div id="controller">
    <div id="controllerArea">
      <div id="playButton"></div>
      <div id="timeCurrent">00:00</div>
      <div id="seekArea">
        <div id="seekTrack">
          <div id="seekThumb"></div>
        </div>
      </div>
      <div id="timeTotal">00:00</div>
      <div id="volumeButton"></div>
      <div id="volumeArea">
        <div id="volumeTrack">
          <div id="volumeThumb"></div>
        </div>
      </div>
      <div id="commentOffButton"></div>
      <div id="fullscreenButton"></div>
    </div>
    <form id="form" action="javascript:void(0)">
      <input id="formInput" type="text" value="" autocomplete="off" spellcheck="false" maxlength="64" tabindex="2" disabled>
      <input id="formButton" type="submit" value="コメントする" disabled>
    </form>
  </div>
</div>
    `}


    css(){
        return `
#jsplayer{
    --width: 960px;
    --height: 540px;
    --screen-width: var(--width);
}
#jsplayer *{
    box-sizing: border-box;
}
#video{
    width: 100%;
    height: 100%;
    object-fit: contain;
}
#screen{
    width: var(--width);
    height: var(--height);
    background-color: #000;
    overflow: hidden;
    white-space : nowrap;
    user-select: none;
    position: relative;
    cursor: default;
}
#screen:focus{
    outline: none;
}
#screen:fullscreen{
    position: absolute;
    width: 100% !important;
    height: 100% !important;
    left: 0;
    top: 0;
}
#guide{
    font-family: Arial, sans-serif;
    position: absolute;
    right: 2%;
    top: 5%;
    background-color: #000;
    color: #0f0;
    z-index: 3;
    animation-name: guide-hide;
    animation-duration: 3s;
    animation-fill-mode: forwards;
    animation-timing-function: step-end;
}
@keyframes guide-hide{
    to{
        opacity: 0;
    }
}
#controller{
    width: var(--width);
    color: white;
    background: #47494f;
    border-color: #2f3034 #2f3034 #232427;
    background-image: linear-gradient(to bottom, #555, #333 66%, #000);
    user-select: none;
    cursor: default;
    line-height: 1;
}
#screen > #controller{
    position: absolute;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    bottom: 0;
}
#controllerArea{
    width: 100%;
    display: flex;
    align-items: center;
    padding: 4px;
}
#timeCurrent,
#timeTotal{
    font-family: Arial, sans-serif;
    font-size: 12px;
    text-align: center;
    width: 40px;
    overflow: hidden;
}
#playButton,
#volumeButton,
#commentOffButton,
#fullscreenButton{
    width: 20px;
    height: 20px;
    background-size: 20px;
    background-repeat: no-repeat;
    background-position: 50% 50%;
    margin: 0 3px;
    padding: 0;
    cursor: pointer;
}
#playButton{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xNjY0IDE5MnYxNDA4cTAgMjYtMTkgNDV0LTQ1IDE5aC01MTJxLTI2IDAtNDUtMTl0LTE5LTQ1di0xNDA4cTAtMjYgMTktNDV0NDUtMTloNTEycTI2IDAgNDUgMTl0MTkgNDV6bS04OTYgMHYxNDA4cTAgMjYtMTkgNDV0LTQ1IDE5aC01MTJxLTI2IDAtNDUtMTl0LTE5LTQ1di0xNDA4cTAtMjYgMTktNDV0NDUtMTloNTEycTI2IDAgNDUgMTl0MTkgNDV6IiBmaWxsPSIjZmZmIi8+PC9zdmc+");
}
[data-pause="true"] #playButton{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xNTc2IDkyN2wtMTMyOCA3MzhxLTIzIDEzLTM5LjUgM3QtMTYuNS0zNnYtMTQ3MnEwLTI2IDE2LjUtMzZ0MzkuNSAzbDEzMjggNzM4cTIzIDEzIDIzIDMxdC0yMyAzMXoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=");
}
#volumeButton{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik04MzIgMzUydjEwODhxMCAyNi0xOSA0NXQtNDUgMTktNDUtMTlsLTMzMy0zMzNoLTI2MnEtMjYgMC00NS0xOXQtMTktNDV2LTM4NHEwLTI2IDE5LTQ1dDQ1LTE5aDI2MmwzMzMtMzMzcTE5LTE5IDQ1LTE5dDQ1IDE5IDE5IDQ1em0zODQgNTQ0cTAgNzYtNDIuNSAxNDEuNXQtMTEyLjUgOTMuNXEtMTAgNS0yNSA1LTI2IDAtNDUtMTguNXQtMTktNDUuNXEwLTIxIDEyLTM1LjV0MjktMjUgMzQtMjMgMjktMzUuNSAxMi01Ny0xMi01Ny0yOS0zNS41LTM0LTIzLTI5LTI1LTEyLTM1LjVxMC0yNyAxOS00NS41dDQ1LTE4LjVxMTUgMCAyNSA1IDcwIDI3IDExMi41IDkzdDQyLjUgMTQyem0yNTYgMHEwIDE1My04NSAyODIuNXQtMjI1IDE4OC41cS0xMyA1LTI1IDUtMjcgMC00Ni0xOXQtMTktNDVxMC0zOSAzOS01OSA1Ni0yOSA3Ni00NCA3NC01NCAxMTUuNS0xMzUuNXQ0MS41LTE3My41LTQxLjUtMTczLjUtMTE1LjUtMTM1LjVxLTIwLTE1LTc2LTQ0LTM5LTIwLTM5LTU5IDAtMjYgMTktNDV0NDUtMTlxMTMgMCAyNiA1IDE0MCA1OSAyMjUgMTg4LjV0ODUgMjgyLjV6bTI1NiAwcTAgMjMwLTEyNyA0MjIuNXQtMzM4IDI4My41cS0xMyA1LTI2IDUtMjYgMC00NS0xOXQtMTktNDVxMC0zNiAzOS01OSA3LTQgMjIuNS0xMC41dDIyLjUtMTAuNXE0Ni0yNSA4Mi01MSAxMjMtOTEgMTkyLTIyN3Q2OS0yODktNjktMjg5LTE5Mi0yMjdxLTM2LTI2LTgyLTUxLTctNC0yMi41LTEwLjV0LTIyLjUtMTAuNXEtMzktMjMtMzktNTkgMC0yNiAxOS00NXQ0NS0xOXExMyAwIDI2IDUgMjExIDkxIDMzOCAyODMuNXQxMjcgNDIyLjV6IiBmaWxsPSIjZmZmIi8+PC9zdmc+");
}
[data-mute="true"] #volumeButton{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im04MzIsMzQ4bDAsMTA4OHEwLDI2IC0xOSw0NXQtNDUsMTl0LTQ1LC0xOWwtMzMzLC0zMzNsLTI2MiwwcS0yNiwwIC00NSwtMTl0LTE5LC00NWwwLC0zODRxMCwtMjYgMTksLTQ1dDQ1LC0xOWwyNjIsMGwzMzMsLTMzM3ExOSwtMTkgNDUsLTE5dDQ1LDE5dDE5LDQ1eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==");
}
#commentOffButton{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im02NDAsNzkycTAsLTUzIC0zNy41LC05MC41dC05MC41LC0zNy41dC05MC41LDM3LjV0LTM3LjUsOTAuNXQzNy41LDkwLjV0OTAuNSwzNy41dDkwLjUsLTM3LjV0MzcuNSwtOTAuNXptMzg0LDBxMCwtNTMgLTM3LjUsLTkwLjV0LTkwLjUsLTM3LjV0LTkwLjUsMzcuNXQtMzcuNSw5MC41dDM3LjUsOTAuNXQ5MC41LDM3LjV0OTAuNSwtMzcuNXQzNy41LC05MC41em0zODQsMHEwLC01MyAtMzcuNSwtOTAuNXQtOTAuNSwtMzcuNXQtOTAuNSwzNy41dC0zNy41LDkwLjV0MzcuNSw5MC41dDkwLjUsMzcuNXQ5MC41LC0zNy41dDM3LjUsLTkwLjV6bTM4NCwwcTAsMTc0IC0xMjAsMzIxLjV0LTMyNiwyMzN0LTQ1MCw4NS41cS0xMTAsMCAtMjExLC0xOHEtMTczLDE3MyAtNDM1LDIyOXEtNTIsMTAgLTg2LDEzcS0xMiwxIC0yMiwtNnQtMTMsLTE4cS00LC0xNSAyMCwtMzdxNSwtNSAyMy41LC0yMS41dDI1LjUsLTIzLjV0MjMuNSwtMjUuNXQyNCwtMzEuNXQyMC41LC0zN3QyMCwtNDh0MTQuNSwtNTcuNXQxMi41LC03Mi41cS0xNDYsLTkwIC0yMjkuNSwtMjE2LjV0LTgzLjUsLTI2OS41cTAsLTE3NCAxMjAsLTMyMS41dDMyNiwtMjMzLjAwMDA3NnQ0NTAsLTg1LjUwMDMydDQ1MCw4NS41MDAzMnQzMjYsMjMzLjAwMDA3NnQxMjAsMzIxLjV6IiBmaWxsPSIjZmZmIi8+PC9zdmc+");
}
[data-comment-off="true"] #commentOffButton{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im0xNzkyLDc5MnEwLDE3NCAtMTIwLDMyMS41dC0zMjYsMjMzdC00NTAsODUuNXEtNzAsMCAtMTQ1LC04cS0xOTgsMTc1IC00NjAsMjQycS00OSwxNCAtMTE0LDIycS0xNywyIC0zMC41LC05dC0xNy41LC0yOWwwLC0xcS0zLC00IC0wLjUsLTEydDIsLTEwdDQuNSwtOS41bDYsLTlsNywtOC41bDgsLTlxNywtOCAzMSwtMzQuNXQzNC41LC0zOHQzMSwtMzkuNXQzMi41LC01MXQyNywtNTl0MjYsLTc2cS0xNTcsLTg5IC0yNDcuNSwtMjIwdC05MC41LC0yODFxMCwtMTMwIDcxLC0yNDguNXQxOTEsLTIwNC41MDA3OTN0Mjg2LC0xMzYuNDk5Nzg2dDM0OCwtNTAuNDk5ODE3cTI0NCwwIDQ1MCw4NS40OTk2OHQzMjYsMjMzLjAwMDM4MXQxMjAsMzIxLjUwMDMzNnoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=");
}
#fullscreenButton{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik04ODMgMTA1NnEwIDEzLTEwIDIzbC0zMzIgMzMyIDE0NCAxNDRxMTkgMTkgMTkgNDV0LTE5IDQ1LTQ1IDE5aC00NDhxLTI2IDAtNDUtMTl0LTE5LTQ1di00NDhxMC0yNiAxOS00NXQ0NS0xOSA0NSAxOWwxNDQgMTQ0IDMzMi0zMzJxMTAtMTAgMjMtMTB0MjMgMTBsMTE0IDExNHExMCAxMCAxMCAyM3ptNzgxLTg2NHY0NDhxMCAyNi0xOSA0NXQtNDUgMTktNDUtMTlsLTE0NC0xNDQtMzMyIDMzMnEtMTAgMTAtMjMgMTB0LTIzLTEwbC0xMTQtMTE0cS0xMC0xMC0xMC0yM3QxMC0yM2wzMzItMzMyLTE0NC0xNDRxLTE5LTE5LTE5LTQ1dDE5LTQ1IDQ1LTE5aDQ0OHEyNiAwIDQ1IDE5dDE5IDQ1eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==");
}
#configButton{
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMTUyIDg5NnEwLTEwNi03NS0xODF0LTE4MS03NS0xODEgNzUtNzUgMTgxIDc1IDE4MSAxODEgNzUgMTgxLTc1IDc1LTE4MXptNTEyLTEwOXYyMjJxMCAxMi04IDIzdC0yMCAxM2wtMTg1IDI4cS0xOSA1NC0zOSA5MSAzNSA1MCAxMDcgMTM4IDEwIDEyIDEwIDI1dC05IDIzcS0yNyAzNy05OSAxMDh0LTk0IDcxcS0xMiAwLTI2LTlsLTEzOC0xMDhxLTQ0IDIzLTkxIDM4LTE2IDEzNi0yOSAxODYtNyAyOC0zNiAyOGgtMjIycS0xNCAwLTI0LjUtOC41dC0xMS41LTIxLjVsLTI4LTE4NHEtNDktMTYtOTAtMzdsLTE0MSAxMDdxLTEwIDktMjUgOS0xNCAwLTI1LTExLTEyNi0xMTQtMTY1LTE2OC03LTEwLTctMjMgMC0xMiA4LTIzIDE1LTIxIDUxLTY2LjV0NTQtNzAuNXEtMjctNTAtNDEtOTlsLTE4My0yN3EtMTMtMi0yMS0xMi41dC04LTIzLjV2LTIyMnEwLTEyIDgtMjN0MTktMTNsMTg2LTI4cTE0LTQ2IDM5LTkyLTQwLTU3LTEwNy0xMzgtMTAtMTItMTAtMjQgMC0xMCA5LTIzIDI2LTM2IDk4LjUtMTA3LjV0OTQuNS03MS41cTEzIDAgMjYgMTBsMTM4IDEwN3E0NC0yMyA5MS0zOCAxNi0xMzYgMjktMTg2IDctMjggMzYtMjhoMjIycTE0IDAgMjQuNSA4LjV0MTEuNSAyMS41bDI4IDE4NHE0OSAxNiA5MCAzN2wxNDItMTA3cTktOSAyNC05IDEzIDAgMjUgMTAgMTI5IDExOSAxNjUgMTcwIDcgOCA3IDIyIDAgMTItOCAyMy0xNSAyMS01MSA2Ni41dC01NCA3MC41cTI2IDUwIDQxIDk4bDE4MyAyOHExMyAyIDIxIDEyLjV0OCAyMy41eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==");
}
#seekArea,
#volumeArea{
    margin: 0 5px;
    padding: 0;
    height: 20px;
}
#seekArea{
    flex-grow: 1;
}
#volumeArea{
    width: 100px;
}
#seekTrack,
#volumeTrack{
    position: relative;
    height: 5px;
    margin: 0 0 8px 0;
    padding: 0;
    background-color: #fff;
    border-radius: 2px;
    width: 100%;
    top: 7px;
}
#seekTrack{
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAAICAIAAABcT7kVAAAAFUlEQVQI12N0WX+DgYGBiYGBgSQKAGI2AdswIf1pAAAAAElFTkSuQmCC");
    background-repeat: no-repeat;
    background-position: 0;
    background-size : 0;
}
#seekThumb,
#volumeThumb{
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
#volumeThumb{
    left: calc(100% - 10px);
}
#form{
    width: 100%;
    margin: 0;
    padding: 0;
    display: flex;
}
#formInput{
    width: 80%;
    height: 26px;
    box-shadow: 3px 3px 3px rgba(200,200,200,0.2) inset;
    border: 1px solid #888888;
    border-radius: 0;
    padding:4px 6px 3px 12px;
    ime-mode: active;
}
#formButton{
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
.comment{
    font-family: 'MS PGothic', Meiryo, sans-serif;
    position: absolute;
    left: 100%;
    line-height: 1;
    z-index: 2;
    color: #fff;
    text-shadow: -1px -1px #333, 1px -1px #333, -1px 1px #333, 1px 1px #333;
    animation-name: comment-anima;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
    animation-duration: 34s;
    opacity: 0.95;
}
[data-pause="true"] .comment{
    animation-play-state: paused;
}
@keyframes comment-anima{
    to{
        transform:translateX(calc(-10 * var(--screen-width)));
    }
}
    `}
}



function clamp(min, val, max){
    return Math.min(Math.max(min, val), max)
}



function benry(self){ // https://qiita.com/economist/items/6c923c255f6b4b7bbf84
    self.$shadow = self.attachShadow({mode:'open'})
    self.$shadow.innerHTML = `${self.html()}<style>${self.css()}</style>`

    for(const el of self.$shadow.querySelectorAll('[id]')){
        self[`$${el.id}`] = el
    }

    for(const name of Object.getOwnPropertyNames(self.constructor.prototype)){
        if(typeof self[name] === 'function'){
            self[name]  = self[name].bind(self)
            const match = name.match(/^(\$.*?)_([^_]+)$/)
            if(match && self[match[1]]){
                self[match[1]].addEventListener(match[2], self[name])
            }
        }
    }

    self.$ = function(selector){
        if(selector.startsWith('*')){
            return Array.from(self.$shadow.querySelectorAll(selector.substring(1) || '*'))
        }
        else if(selector.includes('<')){
            const template = document.createElement('template')
            template.innerHTML = selector.trim()

            return template.content.childNodes.length === 1 ? template.content.firstChild : template.content
        }
        else{
            return self.$shadow.querySelector(selector)
        }
    }
}


customElements.define('js-player', JSPlayer)
