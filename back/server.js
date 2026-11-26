
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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

app.get('/produtos', async (req, res) => {
    try {
        const condicoes = ['p.ativo = TRUE'];
        const parametros = [];

        if (req.query.busca !== undefined) {
            if (typeof req.query.busca !== 'string') {
                return res.status(400).json({
                    erro: 'O termo de pesquisa é inválido.'
                });
            }

            const busca = req.query.busca.trim();

            if (busca) {
                condicoes.push('p.nome LIKE ?');
                parametros.push(`%${busca}%`);
            }
        }

        if (req.query.categoria_id !== undefined) {
            const categoriaId = Number(req.query.categoria_id);

            if (
                !Number.isInteger(categoriaId) ||
                categoriaId <= 0
            ) {
                return res.status(400).json({
                    erro: 'Categoria inválida.'
                });
            }

            condicoes.push('p.categoria_id = ?');
            parametros.push(categoriaId);
        }

        const sql = `
            SELECT
                p.id,
                p.codigo,
                p.nome,
                p.descricao,
                p.preco,
                p.estoque,
                p.estoque_minimo,
                p.imagem,
                p.ativo,
                c.id AS categoria_id,
                c.nome AS categoria
            FROM produtos p
            INNER JOIN categorias c
                ON p.categoria_id = c.id
            WHERE ${condicoes.join(' AND ')}
            ORDER BY p.nome
        `;

        const [produtos] = await db.execute(sql, parametros);

        return res.json(produtos);

    } catch (erro) {
        console.error('Erro ao consultar produtos:', erro);

        return res.status(500).json({
            erro: 'Não foi possível consultar os produtos.'
        });
    }
});

app.get('/produtos/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'Identificador do produto inválido.'
            });
        }

        const [produtos] = await db.execute(`
            SELECT
                p.id,
                p.codigo,
                p.nome,
                p.descricao,
                p.preco,
                p.estoque,
                p.estoque_minimo,
                p.imagem,
                c.id AS categoria_id,
                c.nome AS categoria
            FROM produtos p
            INNER JOIN categorias c
                ON p.categoria_id = c.id
            WHERE p.id = ?
              AND p.ativo = TRUE
        `, [id]);

        if (produtos.length === 0) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        return res.json(produtos[0]);

    } catch (erro) {
        console.error('Erro ao consultar produto:', erro);

        return res.status(500).json({
            erro: 'Não foi possível consultar o produto.'
        });
    }
});

app.get('/categorias', async (req, res) => {
    try {
        const [categorias] = await db.query(
            `SELECT id, nome
             FROM categorias
             ORDER BY nome`
        );

        res.json(categorias);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao buscar categorias.'
        });
    }
});

app.post('/cadastro', async (req, res) => {
    try {
        const { nome, email, senha } = req.body || {};

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

        const nomeNormalizado = nome.trim();
        const emailNormalizado = email.trim().toLowerCase();

        if (
            nomeNormalizado.length < 3 ||
            nomeNormalizado.length > 120
        ) {
            return res.status(400).json({
                erro: 'O nome deve ter entre 3 e 120 caracteres.'
            });
        }

        const emailValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado);

        if (!emailValido || emailNormalizado.length > 150) {
            return res.status(400).json({
                erro: 'Informe um e-mail válido.'
            });
        }

        if (senha.length < 8) {
            return res.status(400).json({
                erro: 'A senha deve ter pelo menos 8 caracteres.'
            });
        }

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
            `INSERT INTO usuarios
                (nome, email, senha_hash, perfil)
             VALUES (?, ?, ?, 'cliente')`,
            [
                nomeNormalizado,
                emailNormalizado,
                senhaHash
            ]
        );

        return res.status(201).json({
            mensagem: 'Cadastro realizado com sucesso!',
            usuario: {
                id: resultado.insertId,
                nome: nomeNormalizado,
                email: emailNormalizado,
                perfil: 'cliente'
            }
        });

    } catch (erro) {
        console.error('Erro no cadastro:', erro);

        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                erro: 'Este e-mail já está cadastrado.'
            });
        }

        return res.status(500).json({
            erro: 'Não foi possível realizar o cadastro.'
        });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body || {};

        if (
            typeof email !== 'string' ||
            typeof senha !== 'string' ||
            !email.trim() ||
            !senha
        ) {
            return res.status(400).json({
                erro: 'Informe seu e-mail e sua senha.'
            });
        }

        const emailNormalizado = email.trim().toLowerCase();

        const [usuarios] = await db.execute(
            `SELECT id, nome, email, senha_hash, perfil
             FROM usuarios
             WHERE email = ?
             LIMIT 1`,
            [emailNormalizado]
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
                perfil: usuario.perfil,
                jti: crypto.randomUUID()
            },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        return res.status(200).json({
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
        console.error('Erro no login:', erro);

        return res.status(500).json({
            erro: 'Não foi possível realizar o login.'
        });
    }
});

async function autenticarToken(req, res, next) {
    const cabecalho = req.headers.authorization;

    if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
        return res.status(401).json({
            erro: 'Faça login para continuar.'
        });
    }

    const token = cabecalho.slice(7).trim();

    let usuarioToken;

    try {
        usuarioToken = jwt.verify(token, JWT_SECRET);

    } catch (erro) {
        return res.status(401).json({
            erro: 'Sessão inválida ou expirada.'
        });
    }

    if (!usuarioToken.jti) {
        return res.status(401).json({
            erro: 'Sessão antiga. Faça login novamente.'
        });
    }

    try {
        const [revogados] = await db.execute(
            `SELECT jti
             FROM tokens_revogados
             WHERE jti = ?
               AND expira_em > NOW()`,
            [usuarioToken.jti]
        );

        if (revogados.length > 0) {
            return res.status(401).json({
                erro: 'Esta sessão foi encerrada. Faça login novamente.'
            });
        }

        req.usuario = usuarioToken;

        return next();

    } catch (erro) {
        console.error('Erro ao verificar sessão:', erro);

        return res.status(500).json({
            erro: 'Não foi possível verificar a autenticação.'
        });
    }
}

app.post('/logout', autenticarToken, async (req, res) => {
    try {

        await db.execute(
            'DELETE FROM tokens_revogados WHERE expira_em <= NOW()'
        );

        await db.execute(
            `INSERT INTO tokens_revogados (jti, expira_em)
             VALUES (?, FROM_UNIXTIME(?))`,
            [
                req.usuario.jti,
                req.usuario.exp
            ]
        );

        return res.json({
            mensagem: 'Logout realizado com sucesso!'
        });

    } catch (erro) {
        console.error('Erro ao realizar logout:', erro);

        return res.status(500).json({
            erro: 'Não foi possível encerrar a sessão.'
        });
    }
});

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

app.post('/pedidos', autenticarToken, async (req, res) => {
    const { itens } = req.body || {};

    if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({
            erro: 'O carrinho está vazio.'
        });
    }

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

        const descontoCentavos =
            subtotalCentavos >= 30000
                ? Math.round(subtotalCentavos * 0.10)
                : 0;

        const valorTotalCentavos =
            subtotalCentavos - descontoCentavos;

        const subtotal = subtotalCentavos / 100;
        const desconto = descontoCentavos / 100;
        const valorTotal = valorTotalCentavos / 100;

        const [pedido] = await conexao.execute(
            `INSERT INTO pedidos
             (usuario_id, subtotal, desconto, valor_total, status)
             VALUES (?, ?, ?, ?, ?)`,
            [
                req.usuario.id,
                subtotal,
                desconto,
                valorTotal,
                'Concluído'
            ]
        );

        const pedidoId = pedido.insertId;

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

        await conexao.commit();

        res.status(201).json({
            mensagem: 'Pedido registrado com sucesso!',
            pedido: {
                id: pedidoId,
                subtotal,
                desconto,
                valorTotal,
                status: 'Concluído'
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

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
