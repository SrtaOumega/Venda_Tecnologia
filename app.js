const express =  require ("express");
const mysql = require("mysql") 
const app = express();
const dotenv = require('dotenv');
const path = require('path')


dotenv.config({path: './.env'});

//conexão com bd
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_SENHA,
    database: process.env.DATABASE
});

const publicDirectory = path.join(__dirname, './public')
app.use(express.static(publicDirectory));

app.use(express.urlencoded({ extended: false}));
app.use(express.json());

app.set('view engine', 'hbs');

db.connect( (error) => {
    if(error){
        console.log(error)} else{
            console.log("MYSQL conectado")
        }
})

//Define rotas
app.use('/', require('./rotas/paginas'));
app.use('/auth', require('./rotas/auth'));

app.listen(5000, () => {
    console.log("Server começa no port 5000");
})

