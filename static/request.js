/**
 * To give a http request.
 * @param {string} path - in the form /path
 * @param {string} params - in the form 'p1=v1&p2=v2'
 * @param {boolean} session - need session parameter or not
 * @param {string} method - eg: POST, GET
 * @param {function} cb - callback function, params: response object
 */

function request(path, params, session, method, cb) {
    let http = new XMLHttpRequest();
    let url = `${window.location.origin}${path}`;
    if (session) {
        if (localStorage.getItem('session') && (Date.now()-localStorage.getItem('time'))<12*60*60*1000) {
            params += `${params.length>0 ? '&' : ''}session=${localStorage.getItem('session')}`
        }
        else {
            window.location.replace(`${window.location.origin}/login.html`);
            return;
        }
    }
    http.open(method, url, true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    http.send(params);

    http.onreadystatechange = ()=>{
        if (http.readyState == 4 && http.status == 200) {
            cb(JSON.parse(http.responseText));
        }
    }
}