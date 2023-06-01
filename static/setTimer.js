/**
 * Set a timer
 * @param {object} data 
 * @param {string} data.id - timer html element id
 * @param {number} data.timeMs - timer time in ms
 * @param {number} data.delayMs - delay start time in ms
 * @param {boolean} data.finished - if the data finished
 */

function setTimer(data) {
    let {id, timeMs, delayMs, finished} = data;
    if (!finished) {
        let inside = document.createElement('div');
        let outside = document.getElementById(id);
        outside.innerHTML = '';
        inside.classList.add('insideBar', 'progressBarAnim');
        outside.append(inside);
        inside.style.animationDuration = `${timeMs/1000}s`;
        if (delayMs) {
            inside.style.animationDelay = `-${delayMs/1000}s`;
        }
        if (outside.getAttribute('timerId') != 'none') {
            clearTimeout(outside.getAttribute('timerId'));
        }
        outside.setAttribute('timerId',setTimeout(()=>{
            outside.innerHTML = `<p style='color:red'>READY</p>`
            outside.setAttribute('timerId', 'none');
        }, timeMs-delayMs));
        
    }
}

/**
 * Gets a timer data
 * @param {string} name - timer name (in table)
 * @param {*} id - timer html element id
 */

function getTimer(name, id) {
    request('/getTimer', `dbName=${name}`, true, 'POST', res=>{
        if (res.success) {
            if (res.result == 'READY') {
                setTimer({id: id, timeMs: 0, delayMs: false, finished: true});
            }
            else {
                setTimer({id: id, timeMs: res.result.timer-res.result.prev, delayMs: Date.now()-res.result.prev, finished: false});
            }
        }
        else {
            switch (res.reason) {
                case 0:
                    return 'Not enough info';
                case 1:
                    return 'Session invalid';
                default:
                    return 'Unknown reason';
            }
        }
    })
}