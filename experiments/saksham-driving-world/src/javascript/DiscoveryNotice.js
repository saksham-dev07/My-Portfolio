export function discoveryNotice({document,window,focusWorld}) {
    const panel=document.createElement('aside')
    panel.className='discovery-status';panel.hidden=true
    panel.setAttribute('aria-label','Secret discovery')
    const message=document.createElement('p')
    message.setAttribute('role','status');message.setAttribute('aria-live','polite');message.setAttribute('aria-atomic','true')
    const actions=document.createElement('div')
    const replay=document.createElement('button');replay.type='button';replay.textContent='Bloom again'
    replay.setAttribute('aria-label','Bloom the secret garden again')
    const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='Close'
    dismiss.setAttribute('aria-label','Dismiss secret discovery')
    actions.append(replay,dismiss);panel.append(message,actions);document.body.append(panel)
    let cooldown
    window.addEventListener('drive-discovery',event=>{
        panel.hidden=false
        message.textContent=`${event.detail.title} ${event.detail.message}`
        replay.disabled=true
        window.clearTimeout(cooldown)
        cooldown=window.setTimeout(()=>{replay.disabled=false},900)
    })
    replay.addEventListener('click',()=>{
        window.dispatchEvent(new CustomEvent('drive-secret-replay'))
        focusWorld()
    })
    dismiss.addEventListener('click',()=>{panel.hidden=true;focusWorld()})
    return {panel,message,replay,dismiss}
}
