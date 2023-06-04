function getData(sec, dataWanted=[]) {
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
                ${dataWanted.includes('money') ? `<p>Money: ${res.data.money}</p>` : ''}
                ${dataWanted.includes('energy') ? `<div style='display: flex;'>
                    <div style='width: 200px; height: 10px; border: 1px solid black; flex: 0 0 auto;'>
                        <div style='width: ${200*res.data.energy/res.data.maxEnergy}px; height: 100%; background-color: #5E9625'></div>
                    </div>
                    <div style='flex: 0 0 auto;'>${res.data.energy}/${res.data.maxEnergy}</div>
                </div>
                <br>` : ''}
                ${dataWanted.includes('health') ? `<div>
                    <div style='width: 200px; height: 10px; border: 1px solid black; display: inline-block;'>
                        <div style='width: ${200*res.data.health/res.data.maxHealth}px; height: 100%; background-color: #505BD3'></div>
                    </div>
                    <div style='display:inline-block;'>${res.data.health}/${res.data.maxHealth}</div>
                </div>
                <br>` : ''}
                ${dataWanted.includes('battleStats') ? `<p>Battle stats</p>
                <ul>
                    <li>Strength: ${res.data.str}</li>
                    <li>Defense: ${res.data.def}</li>
                    <li>Speed: ${res.data.spd}</li>
                    <li>Dexterity: ${res.data.dex}</li>
                    <li>Stealth: ${res.data.sth}</li>
                    <li>Perception: ${res.data.per}</li>
                </ul>` : ''}
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

function getCrimeRecord(sec) {
    request('/getCrimeRecord', '', true, 'POST', res=>{
        if (res.success) {
            let {data} = res;
            let content = '<ul>';
            data.forEach(x=>{
                content += `<li>${x.name}: ${x.count}</li>`;
            })
            content += '</ul>';
            document.getElementById(sec).innerHTML = content;
        }
    })
}