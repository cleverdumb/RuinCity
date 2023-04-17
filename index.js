const express = require('express');

const app = express();
const port = process.env.PORT || 2050;

app.listen(port, ()=>{
    console.log(`App running on port ${port}`)
})

app.use(express.static('static'))