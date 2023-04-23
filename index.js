const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const color = require('colors')

const app = express();
const port = process.env.PORT || 2050;

const db = new sqlite3.Database('./db/data.db')

db.exec('create table if not exists account (id integer unique not null primary key autoincrement, user varchar(40) not null unique, pass varchar(40) not null)')

// db.exec(`insert into account (user, pass) values ('a', '1')`)

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

/*
Error codes:
0: Empty user or pass
1: Wrong user or pass
*/

app.post('/login',(req, res)=>{
    let body = req.body;

    if (!(body.user && body.pass)) {
        res.send({success: false, reason: 0})
        return;
    }

    searchAll('account', {user: body.user, pass: body.pass}, (rows)=>{
        if (rows.length >= 1) {
            res.send({success: true})
            console.log(`Login - (user: ${body.user}, pass: ${body.pass}).green`)
            return
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
                res.send(JSON.stringify({success: true}))
                console.log(`Signup - (user: ${body.user}, pass: ${body.pass})`.green)
                return;
            })
        }
        else {
            res.send(JSON.stringify({success: false, reason: 2}))
            return;
        }
    })
})