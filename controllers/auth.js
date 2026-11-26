//controla a entrada das senhas/ criptografa elas

const mysql = require("mysql")
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_SENHA,
    database: process.env.DATABASE
});


//login
exports.login = (req, res) => {
    console.log(req.body);

    const { name, email, senha, senhaConfirmar } = req.body;

    db.query('SELECT email FROM usuarios WHERE email = ?', [email], async (error, results) => {

        if (error) {
            console.log(error);
        } if (results.lenght > 0) {
            return res.render('cadastro', {
                message: 'Esse email já foi inserido'
            })
        } else if (senha !== senhaConfirmar) {
            return res.render('register', {
                message: 'Senha incorreta'
                   });
            }
        });


    };




//registro
exports.cadastro = (req, res) => {
    console.log(req.body);

    const { name, email, senha, senhaConfirmar } = req.body;

    db.query('SELECT email FROM usuarios WHERE email = ?', [email], async (error, results) => {

        if (error) {
            console.log(error);
        } if (results.lenght > 0) {
            return res.render('cadastro', {
                message: 'Esse email já foi inserido'
            })
        } else if (senha !== senhaConfirmar) {
            return res.render('register', {
                message: 'Senha incorreta'
            });
        }

        //encriptoiasmf da senha e guardada no bd
        let hashedPassword = await bcrypt.hash(senha, 8);
        console.log(hashedPassword);

        db.query('INSERT INTO usuarios SET ? ', { nome: name, email: email, senha: hashedPassword }, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                console.log(results);
                return res.render('register', {
                    message: 'Usuario registrado'
                });
            }
        });


    });

}

