
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('Configure JWT_SECRET no arquivo .env');
}

// =========================================================
// ROTAS INICIAIS
// =========================================================

app.get('/', (req, res) => {
    res.json({
        mensagem: 'API do Eskillows funcionando!'
    });
});

app.get('/teste-banco', async (req, res) => {
    try {
        const [resultado] = await db.query(
            'SELECT 1 AS conectado'
        );

        res.json({
            mensagem: 'Banco conectado com sucesso!',
            resultado
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao conectar com o banco.'
        });
    }
});

// =========================================================
// PRODUTOS
// =========================================================

app.get('/produtos', async (req, res) => {
    try {
        const [produtos] = await db.query(
            'SELECT * FROM produtos WHERE ativo = TRUE'
        );

        res.json(produtos);
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao buscar produtos.'
        });
    }
});

// =========================================================
// CADASTRO
// =========================================================

app.post('/cadastro', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                erro: 'Preencha todos os campos.'
            });
        }

        if (
            typeof nome !== 'string' ||
            typeof email !== 'string' ||
            typeof senha !== 'string'
        ) {
            return res.status(400).json({
                erro: 'Os dados informados são inválidos.'
            });
        }

        if (nome.trim().length < 3 || nome.trim().length > 120) {
            return res.status(400).json({
                erro: 'O nome deve ter entre 3 e 120 caracteres.'
            });
        }

        if (senha.length < 8) {
            return res.status(400).json({
                erro: 'A senha deve ter pelo menos 8 caracteres.'
            });
        }

        const emailNormalizado = email.trim().toLowerCase();

        const [existente] = await db.execute(
            'SELECT id FROM usuarios WHERE email = ?',
            [emailNormalizado]
        );

        if (existente.length > 0) {
            return res.status(409).json({
                erro: 'Este e-mail já está cadastrado.'
            });
        }

        const senhaHash = await bcrypt.hash(senha, 12);

        const [resultado] = await db.execute(
            `INSERT INTO usuarios (nome, email, senha_hash)
             VALUES (?, ?, ?)`,
            [nome.trim(), emailNormalizado, senhaHash]
        );

        res.status(201).json({
            mensagem: 'Cadastro realizado com sucesso!',
            usuario: {
                id: resultado.insertId,
                nome: nome.trim(),
                email: emailNormalizado
            }
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Não foi possível realizar o cadastro.'
        });
    }
});

// =========================================================
// LOGIN
// =========================================================

app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                erro: 'Informe seu e-mail e sua senha.'
            });
        }

        if (
            typeof email !== 'string' ||
            typeof senha !== 'string'
        ) {
            return res.status(400).json({
                erro: 'Os dados informados são inválidos.'
            });
        }

        const [usuarios] = await db.execute(
            `SELECT id, nome, email, senha_hash, perfil
             FROM usuarios
             WHERE email = ?`,
            [email.trim().toLowerCase()]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                erro: 'E-mail ou senha incorretos.'
            });
        }

        const usuario = usuarios[0];

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha_hash
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: 'E-mail ou senha incorretos.'
            });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                perfil: usuario.perfil
            },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({
            mensagem: 'Login realizado com sucesso!',
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil
            }
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Não foi possível realizar o login.'
        });
    }
});

// =========================================================
// AUTENTICAÇÃO POR TOKEN
// =========================================================

function autenticarToken(req, res, next) {
    const cabecalho = req.headers.authorization;

    if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
        return res.status(401).json({
            erro: 'Faça login para continuar.'
        });
    }

    const token = cabecalho.split(' ')[1];

    try {
        req.usuario = jwt.verify(token, JWT_SECRET);
        next();
    } catch (erro) {
        return res.status(401).json({
            erro: 'Sessão inválida ou expirada.'
        });
    }
}

// =========================================================
// PERFIL DO USUÁRIO
// =========================================================

app.get('/perfil', autenticarToken, async (req, res) => {
    try {
        const [usuarios] = await db.execute(
            `SELECT id, nome, email, perfil
             FROM usuarios
             WHERE id = ?`,
            [req.usuario.id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                erro: 'Usuário não encontrado.'
            });
        }

        res.json({
            usuario: usuarios[0]
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao consultar perfil.'
        });
    }
});

// =========================================================
// HISTÓRICO DE PEDIDOS DO USUÁRIO
// =========================================================

app.get('/meus-pedidos', autenticarToken, async (req, res) => {
    try {
        const [resultados] = await db.execute(
            `SELECT
                p.id AS pedido_id,
                p.data_pedido,
                p.subtotal,
                p.desconto,
                p.valor_total,
                p.status,
                ip.produto_id,
                ip.quantidade,
                ip.preco_unitario,
                ip.subtotal_item,
                pr.nome AS produto_nome
             FROM pedidos p
             LEFT JOIN itens_pedido ip
                ON ip.pedido_id = p.id
             LEFT JOIN produtos pr
                ON pr.id = ip.produto_id
             WHERE p.usuario_id = ?
             ORDER BY p.id DESC`,
            [req.usuario.id]
        );

        const pedidos = new Map();

        for (const linha of resultados) {
            if (!pedidos.has(linha.pedido_id)) {
                pedidos.set(linha.pedido_id, {
                    id: linha.pedido_id,
                    data: linha.data_pedido,
                    subtotal: linha.subtotal,
                    desconto: linha.desconto,
                    valorTotal: linha.valor_total,
                    status: linha.status,
                    itens: []
                });
            }

            if (linha.produto_id !== null) {
                pedidos.get(linha.pedido_id).itens.push({
                    produtoId: linha.produto_id,
                    nome: linha.produto_nome,
                    quantidade: linha.quantidade,
                    precoUnitario: linha.preco_unitario,
                    subtotal: linha.subtotal_item
                });
            }
        }

        res.json({
            pedidos: Array.from(pedidos.values())
        });
    } catch (erro) {
        console.error('Erro ao buscar pedidos:', erro);

        res.status(500).json({
            erro: 'Não foi possível carregar seu histórico de pedidos.'
        });
    }
});

// =========================================================
// REGISTRAR PEDIDO
// =========================================================

app.post('/pedidos', autenticarToken, async (req, res) => {
    const { itens } = req.body;

    if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({
            erro: 'O carrinho está vazio.'
        });
    }

    // Agrupa produtos repetidos.
    const quantidades = new Map();

    for (const item of itens) {
        if (!item || typeof item !== 'object') {
            return res.status(400).json({
                erro: 'Um dos produtos informados é inválido.'
            });
        }

        const codigo = String(item.codigo || '').trim();
        const quantidade = Number(item.quantidade);

        if (
            !codigo ||
            !Number.isInteger(quantidade) ||
            quantidade < 1
        ) {
            return res.status(400).json({
                erro: 'Os produtos ou as quantidades são inválidos.'
            });
        }

        quantidades.set(
            codigo,
            (quantidades.get(codigo) || 0) + quantidade
        );
    }

    const codigos = [...quantidades.keys()];

    let conexao;

    try {
        conexao = await db.getConnection();

        await conexao.beginTransaction();

        const placeholders = codigos.map(() => '?').join(',');

        // Busca os produtos diretamente no banco.
        // FOR UPDATE bloqueia as linhas durante a transação.
        const [produtosBanco] = await conexao.execute(
            `SELECT id, codigo, nome, preco, estoque
             FROM produtos
             WHERE codigo IN (${placeholders})
             AND ativo = 1
             FOR UPDATE`,
            codigos
        );

        if (produtosBanco.length !== codigos.length) {
            const erro = new Error(
                'Um ou mais produtos não foram encontrados.'
            );

            erro.status = 404;
            throw erro;
        }

        let subtotalCentavos = 0;

        const itensPedido = [];

        for (const produto of produtosBanco) {
            const quantidade = quantidades.get(produto.codigo);

            if (Number(produto.estoque) < quantidade) {
                const erro = new Error(
                    `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}.`
                );

                erro.status = 409;
                throw erro;
            }

            const precoCentavos = Math.round(
                Number(produto.preco) * 100
            );

            const subtotalItemCentavos =
                precoCentavos * quantidade;

            subtotalCentavos += subtotalItemCentavos;

            itensPedido.push({
                produto,
                quantidade,
                precoCentavos,
                subtotalItemCentavos
            });
        }

        // Calcula o desconto de 10% para compras a partir de R$ 300.
        const descontoCentavos =
            subtotalCentavos >= 30000
                ? Math.round(subtotalCentavos * 0.10)
                : 0;

        const valorTotalCentavos =
            subtotalCentavos - descontoCentavos;

        const subtotal = subtotalCentavos / 100;
        const desconto = descontoCentavos / 100;
        const valorTotal = valorTotalCentavos / 100;

        // Registra o pedido.
        const [pedido] = await conexao.execute(
            `INSERT INTO pedidos
             (usuario_id, subtotal, desconto, valor_total, status)
             VALUES (?, ?, ?, ?, ?)`,
            [
                req.usuario.id,
                subtotal,
                desconto,
                valorTotal,
                'Pendente'
            ]
        );

        const pedidoId = pedido.insertId;

        // Registra os itens, atualiza o estoque
        // e registra cada movimentação.
        for (const item of itensPedido) {
            const novoEstoque =
                Number(item.produto.estoque) - item.quantidade;

            await conexao.execute(
                `INSERT INTO itens_pedido
                 (pedido_id, produto_id, quantidade, preco_unitario, subtotal_item)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    pedidoId,
                    item.produto.id,
                    item.quantidade,
                    item.precoCentavos / 100,
                    item.subtotalItemCentavos / 100
                ]
            );

            await conexao.execute(
                `UPDATE produtos
                 SET estoque = ?
                 WHERE id = ?`,
                [
                    novoEstoque,
                    item.produto.id
                ]
            );

            await conexao.execute(
                `INSERT INTO movimentacoes_estoque
                 (produto_id, usuario_id, pedido_id, tipo,
                  quantidade, saldo_resultante, motivo)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    item.produto.id,
                    req.usuario.id,
                    pedidoId,
                    'saida',
                    item.quantidade,
                    novoEstoque,
                    `Venda referente ao pedido ${pedidoId}`
                ]
            );
        }

        // Confirma todas as operações.
        await conexao.commit();

        res.status(201).json({
            mensagem: 'Pedido registrado com sucesso!',
            pedido: {
                id: pedidoId,
                subtotal,
                desconto,
                valorTotal,
                status: 'Pendente'
            }
        });
    } catch (erro) {
        if (conexao) {
            try {
                await conexao.rollback();
            } catch (erroRollback) {
                console.error(
                    'Erro ao desfazer transação:',
                    erroRollback
                );
            }
        }

        console.error('Erro ao registrar pedido:', erro);

        res.status(erro.status || 500).json({
            erro: erro.message || 'Não foi possível registrar o pedido.'
        });
    } finally {
        if (conexao) {
            conexao.release();
        }
    }
});

// =========================================================
// INICIALIZAÇÃO
// =========================================================

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
