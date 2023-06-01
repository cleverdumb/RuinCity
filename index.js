const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const color = require('colors')

const app = express();
const port = process.env.PORT || 2050;

const db = new sqlite3.Database('./db/data.db')

db.exec('pragma foreign_keys = ON')

db.exec(`create table if not exists account (
    id integer unique not null primary key autoincrement,
    user varchar(40) not null unique,
    pass varchar(40) not null)`)

db.exec(`create table if not exists session (
    id integer not null unique,
    session varchar(12) not null unique,
    foreign key (id) references account (id) on delete cascade on update cascade)`)

db.exec(`create table if not exists profile (
    id integer not null unique,
    money integer not null,
    foreign key (id) references account (id) on delete cascade on update cascade)`)

db.exec(`create table if not exists cTimers (
    id integer not null unique,
    prev integer not null,
    timer integer not null,
    foreign key (id) references account (id) on delete cascade on update cascade)`)

// db.exec(`insert into account (user, pass) values ('a', '1')`)

chatRecord = [];

app.use(express.static('static'))
app.use(bodyParser.urlencoded({extended:true}))

app.listen(port, ()=>{
    console.log(`App running on port ${port}`);
})


const insertRow = (table, data, cb) => {
    let keys = Object.keys(data);
    let values = Object.values(data);

    db.run(`insert into ${table} (${keys.join(',')}) values (${Array(values.length).fill('?').join(',')})`, values, (err)=>{
        if (err) throw err
        cb()
    })
}

const searchAll = (table, data, cb) => {
    let keys = Object.keys(data);
    let values = Object.values(data);

    db.all(`select * from ${table} ${keys.length>0?'where':''} ${keys.map(x=>`${x}=?`).join(' and ')}`, values, (err, rows)=>{
        if (err) throw err;
        cb(rows);
    })
}

function getSession(user, pass, res, ses) {
    if (!ses) {
        // console.log('normal case')
        let session = Math.round(Math.random()*3)+1;
        searchAll('session', {session: session}, (rows)=>{
            if (rows.length >= 1) {
                getSession(user, pass, res, ses);
                return
            }
            else {
                // console.log(user);
                searchAll('account', {user: user}, (r)=>{
                    // console.log(r)
                    let row = r[0];
                    let id = row.id;
                    searchAll('session', {id: id}, (rs)=>{
                        if (rs.length >= 1) {
                            db.run('update session set session=? where id=?', [session, id], (err)=>{
                                if (err) throw err;
                                res.send({success: true, session: session})
                                // if (ses) {
                                //     console.log(`Login - (session: ${ses})`)
                                // }
                                // else {
                                    console.log(`Login - (user: ${user}, pass: ${pass})`.green)
                                // }
                                return
                            })
                        }
                        else {
                            insertRow('session', {id: id, session: session}, ()=>{
                                res.send({success: true, session: session})
                                // if (session) {
                                //     console.log(`Login - (session: ${ses})`)
                                // }
                                // else {
                                    console.log(`Login - (user: ${user}, pass: ${pass})`.green)
                                // }
                                return
                            })
                        }
                    })
                })
            }
        })
    }
    else {
        // console.log('session case');
        let session = Math.round(Math.random()*3+1);
        searchAll('session', {session: session}, (rows)=>{
            if (rows.length >= 1) {
                getSession(user, pass, res, ses);
                return;
            }
            else {
                searchAll('session', {session: ses}, (r)=>{
                    let id = r[0].id;
                    db.run('update session set session=? where id=?', [session, id], (err)=>{
                        if (err) throw err;
                        res.send(JSON.stringify({success: true, session: session}));
                        console.log(`Login - (session: ${ses})`.green)
                        return;
                    })
                })
            }
        })
    }
}

function fromSes(ses, cb) {
    if (!ses) {
        cb(null);
    }
    else {
        // console.log(ses);
        searchAll('session', {session: ses}, (rows)=>{
            // console.log(rows);
            if (rows.length >= 1) {
                let row = rows[0];
                // console.log(row);
                cb(row.id);
            }
            else {
                cb(null);
            }
        })
    }
}

/*
Error codes:
0: Empty user or pass
1: Wrong user or pass
*/

app.post('/login',(req, res)=>{
    let body = req.body;

    if (body.session) {
        // console.log('session in post')
        searchAll('session', {session: body.session}, (rows)=>{
            if (rows.length >= 1) {
                // console.log('inside')
                getSession(null, null, res, body.session)
                return;
            }
            else {
                res.send(JSON.stringify({success: false, reason: 4}));
                return;
            }
        })
        return;
    }

    if (!(body.user && body.pass)) {
        res.send({success: false, reason: 0})
        return;
    }

    searchAll('account', {user: body.user, pass: body.pass}, (rows)=>{
        if (rows.length >= 1) {
            // res.send({success: true, session: session})
            // console.log(`Login - (user: ${body.user}, pass: ${body.pass}).green`)
            // return
            getSession(body.user, body.pass, res, null);
        }
        else {
            res.send({success: false, reason: 1})
            return
        }
    })
})

/*
Error codes:
0: User or password is empty
1: Wrong length
2: Username used
*/

app.post('/signup', (req, res)=>{
    let body = req.body;

    if (!(req.body.user && req.body.pass)) {
        res.send(JSON.stringify({success: false, reason: 0}))
        return;
    }

    // if (body.user.length <= 3 || body.user.length > 20 || body.pass.length <= 7 || body.pass.length > 30) {
    //     res.send(JSON.stringify({success: false, reason: 1}))
    //     return;
    // }

    // ! CHANGE BACK (UNCOMMENT)

    searchAll('account', {user: body.user}, (rows)=>{
        if (rows.length <= 0) {
            insertRow('account', {user: body.user, pass: body.pass}, ()=>{
                searchAll('account', {user: body.user}, (rows)=>{
                    let id = rows[0].id;
                    insertRow('profile', {id: id, money: 0}, ()=>{
                        insertRow('cTimers', {id: id, timer: Date.now(), prev: 0}, ()=>{
                            res.send(JSON.stringify({success: true}));
                            console.log(`Signup - (user: ${body.user}, pass: ${body.pass})`.green);
                            return;
                        })
                        return;
                    })
                })
            })
        }
        else {
            res.send(JSON.stringify({success: false, reason: 2}))
            return;
        }
    })
})

/*
Error codes:
0: Empty chat value
1: Invalid session
*/

app.post('/chat', (req,res) => {
    let body = req.body;
    // console.log(body);
    let ses = body.session;
    fromSes(ses, (id)=> {
        if (id) {
            if (body.val.length > 0) {
                searchAll('account', {id: id}, (rows)=>{
                    if (rows.length >= 1) {
                        let row = rows[0];
                        let user = row.user;
                        chatRecord.push({val: body.val, user: user, time: Date.now()})
                        if (chatRecord.length > 200) {
                            chatRecord.shift()
                        }
                        // console.log(chatRecord);
                        res.send(JSON.stringify({success: true}))
                    }
                    else {
                        res.send(JSON.stringify({success: false, reason: 100}))
                    }
                })
            }
            else {
                res.send(JSON.stringify({success: false, reason: 0}))
            }
        }
        else {
            res.send(JSON.stringify({success:false, reason: 1}))
        }
    })
})

app.get('/getChat',(req, res)=>{
    // console.log('get chat')
    res.send(JSON.stringify(chatRecord));
})

/*
Error codes:
0: Invalid session
*/

app.post('/getHomeData', (req, res)=>{
    let session = req.body.session;
    fromSes(session, (id)=>{
        if (id) {
            searchAll('profile', {id: id}, (rows)=>{
                if (rows.length >= 1) {
                    let row = rows[0];
                    res.send(JSON.stringify({success: true, data: row}));
                }
                else {
                    res.send(JSON.stringify({success: false, reason: 100}));
                }
            })
        }
        else {
            res.send(JSON.stringify({success: false, reason: 0}))
        }
    })
})

/*
Error codes:
0: Invalid session
1: Still on cooldown
*/

app.post('/crime', (req, res)=>{
    let type = req.body.type;
    fromSes(req.body.session, (id)=>{
        if (id) {
            searchAll('cTimers', {id: id}, rows=>{
                if (rows.length > 0) {
                    let row = rows[0];
                    let readyTime = row.timer;
                    if (readyTime<=Date.now()) {
                        db.run(`update profile set money=((select money from profile where id=?)+${10}) where id=?`, [id, id], err=>{
                            if (err) throw err;
                            db.run(`update cTimers set timer=${Date.now()+5000}, prev=${Date.now()} where id=?`, [id], (err)=>{
                                if (err) throw err;
                                res.send(JSON.stringify({success: true, rem: 5000}));
                            })
                            return;
                        })
                    }
                    else {
                        res.send(JSON.stringify({success: false, reason: 1, rem: readyTime-Date.now()}))
                        return;
                    }
                }
            })
        }
        else {
            res.send(JSON.stringify({success:false, reason: 0}))
            return;
        }
    })
})

/*
Error codes:
0: Not enough info provided
1: Session not valid
*/

app.post('/getTimer', (req, res)=>{
    let body = req.body;
    let {session, dbName} = body;
    if (!session || !dbName) {
        res.send(JSON.stringify({success: false, reason: 0}))
    }
    fromSes(session, id=>{
        if (id) {
            searchAll(dbName, {id: id}, rows=>{
                if (rows.length > 0) {
                    let {prev, timer} = rows[0];
                    let now = Date.now();
                    if (now >= timer) {
                        res.send(JSON.stringify({success: true, result: 'READY'}));
                    }
                    else {
                        res.send(JSON.stringify({success: true, result: {prev: prev, timer: timer}}));
                    }
                }
            })
        }
        else {
            res.send(JSON.stringify({success: false, reason: 1}))
        }
    })
})