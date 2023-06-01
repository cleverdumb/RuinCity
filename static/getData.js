function getData(sec) {
    let http = new XMLHttpRequest();
    let url = `${window.location.origin}/getHomeData`;
    let params = ''
    if (localStorage.getItem('session') && localStorage.getItem('session') && (Date.now()-localStorage.getItem('time'))<24*60*60*1000) {
        params = `session=${localStorage.getItem('session')}`
    }
    else {
        window.location.replace(`${window.location.origin}/login.html`);
        return;
    }
    http.open('POST', url, true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    http.send(params);

    http.onreadystatechange = () => {
        if (http.readyState == 4 && http.status == 200) {
            let res = JSON.parse(http.responseText);
            if (res.success) {
                document.getElementById(sec).innerHTML = `
                <p>Money: ${res.data.money}</p>
                <div style='width: 200px; height: 10px; border: 1px solid black;'>
                    <div style='width: ${200*res.data.energy/res.data.maxEnergy}px; height: 100%; background-color: #5E9625'></div>
                </div>
                <div>${res.data.energy}/${res.data.maxEnergy}</div>
                <div style='width: 200px; height: 10px; border: 1px solid black;'>
                    <div style='width: ${200*res.data.health/res.data.maxHealth}px; height: 100%; background-color: #505BD3'></div>
                </div>
                <div>${res.data.health}/${res.data.maxHealth}</div>
                `
            }
            else {
                switch (res.reason) {
                    case 0:
                        window.location.replace(`${window.location.origin}/login.html`);
                        break;
                    default:
                        alert('Unexpected error occured, please refresh to try again.')
                        break;
                }
            }
        }
    }
}