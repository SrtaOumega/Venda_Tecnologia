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

// ROTAS INICIAIS

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

// PRODUTOS

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

// CADASTRO

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

// LOGIN

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

// AUTENTICAÇÃO

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

// PERFIL DO USUÁRIO

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

// HISTÓRICO DE PEDIDOS

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

// REGISTRAR PEDIDO

app.post('/pedidos', autenticarToken, async (req, res) => {

    const { itens } = req.body;

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
                'Pendente'
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
// PAINEL ADMINISTRATIVO E ESTOQUE - PESSOA 4
// =========================================================

// Verifica se o usuário é administrador

async function exigirAdmin(req, res, next) {

    try {
        const [usuarios] = await db.execute(
            'SELECT perfil FROM usuarios WHERE id = ?',
            [req.usuario.id]
        );

        if (
            usuarios.length === 0 ||
            usuarios[0].perfil !== 'admin'
        ) {
            return res.status(403).json({
                erro: 'Acesso exclusivo para administradores.'
            });
        }

        next();

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao verificar acesso.'
        });
    }
}

const admin = express.Router();

admin.use(autenticarToken, exigirAdmin);

// Tratamento de erros administrativos

function erroAdmin(res, erro) {

    if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            erro: 'Código de produto já cadastrado.'
        });
    }

    if (erro.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            erro: 'Categoria ou referência inválida.'
        });
    }

    console.error(erro);

    return res.status(500).json({
        erro: 'Erro ao realizar operação administrativa.'
    });
}

// Indicadores do painel administrativo

admin.get('/indicadores', async (req, res) => {

    try {

        const [[dados]] = await db.query(
            `SELECT
                (SELECT COUNT(*)
                 FROM produtos
                 WHERE ativo = 1) AS totalProdutos,

                (SELECT COUNT(*)
                 FROM pedidos) AS totalPedidos,

                (SELECT COUNT(*)
                 FROM produtos
                 WHERE ativo = 1
                 AND estoque <= estoque_minimo) AS estoqueBaixo`
        );

        res.json(dados);

    } catch (erro) {
        erroAdmin(res, erro);
    }
});

// Consultar categorias

admin.get('/categorias', async (req, res) => {

    try {

        const [categorias] = await db.query(
            'SELECT id, nome FROM categorias ORDER BY nome'
        );

        res.json(categorias);

    } catch (erro) {
        erroAdmin(res, erro);
    }
});

// Listar produtos

admin.get('/produtos', async (req, res) => {

    try {

        const [produtos] = await db.query(
            'SELECT * FROM produtos ORDER BY id'
        );

        res.json(produtos);

    } catch (erro) {
        erroAdmin(res, erro);
    }
});

// Validar os dados do produto

function dadosProduto(body) {

    const {
        codigo,
        nome,
        descricao,
        categoria_id,
        preco,
        estoque_minimo,
        imagem
    } = body || {};

    const textoValido = (valor, maximo) =>
        typeof valor === 'string' &&
        valor.trim().length > 0 &&
        valor.trim().length <= maximo;

    if (
        !textoValido(codigo, 30) ||
        !textoValido(nome, 120) ||
        !textoValido(descricao, 16000) ||
        !textoValido(imagem, 255) ||
        !Number.isInteger(categoria_id) ||
        categoria_id < 1 ||
        typeof preco !== 'number' ||
        !Number.isFinite(preco) ||
        preco < 0 ||
        preco > 99999999.99 ||
        Math.abs(preco * 100 - Math.round(preco * 100)) > 0.00001 ||
        !Number.isInteger(estoque_minimo) ||
        estoque_minimo < 0 ||
        estoque_minimo > 2147483647
    ) {
        return null;
    }

    return [
        codigo.trim(),
        nome.trim(),
        descricao.trim(),
        categoria_id,
        preco,
        estoque_minimo,
        imagem.trim()
    ];
}

// Cadastro de produtos

admin.post('/produtos', async (req, res) => {

    const dados = dadosProduto(req.body);

    if (!dados) {
        return res.status(400).json({
            erro: 'Dados do produto inválidos.'
        });
    }

    try {

        const [resultado] = await db.execute(
            `INSERT INTO produtos
             (codigo, nome, descricao, categoria_id,
              preco, estoque_minimo, imagem)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            dados
        );

        res.status(201).json({
            mensagem: 'Produto cadastrado com sucesso!',
            id: resultado.insertId
        });

    } catch (erro) {
        erroAdmin(res, erro);
    }
});

// Edição de produtos

admin.put('/produtos/:id', async (req, res) => {

    const id = Number(req.params.id);

    const dados = dadosProduto(req.body);

    if (!dados || !Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({
            erro: 'Dados do produto inválidos.'
        });
    }

    try {

        const [resultado] = await db.execute(
            `UPDATE produtos SET
                codigo = ?,
                nome = ?,
                descricao = ?,
                categoria_id = ?,
                preco = ?,
                estoque_minimo = ?,
                imagem = ?
             WHERE id = ?`,
            [...dados, id]
        );

        if (!resultado.affectedRows) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        res.json({
            mensagem: 'Produto atualizado com sucesso!'
        });

    } catch (erro) {
        erroAdmin(res, erro);
    }
});

// Histórico de movimentações

admin.get('/estoque/historico', async (req, res) => {

    try {

        const [historico] = await db.query(
            `SELECT m.*, p.nome AS produto_nome
             FROM movimentacoes_estoque m
             JOIN produtos p ON p.id = m.produto_id
             ORDER BY m.data_movimentacao DESC, m.id DESC`
        );

        res.json(historico);

    } catch (erro) {
        erroAdmin(res, erro);
    }
});

// Entrada, saída e ajuste de estoque

admin.post('/estoque', async (req, res) => {

    const {
        produto_id,
        tipo,
        quantidade,
        motivo
    } = req.body || {};

    // Validação da movimentação

    if (
        !Number.isInteger(produto_id) ||
        produto_id < 1 ||
        !['entrada', 'saida', 'ajuste'].includes(tipo) ||
        !Number.isInteger(quantidade) ||
        quantidade < (tipo === 'ajuste' ? 0 : 1) ||
        quantidade > 2147483647 ||
        typeof motivo !== 'string' ||
        !motivo.trim() ||
        motivo.trim().length > 255
    ) {
        return res.status(400).json({
            erro: 'Movimentação inválida.'
        });
    }

    let conexao;

    try {

        conexao = await db.getConnection();

        await conexao.beginTransaction();

        const [produtos] = await conexao.execute(
            `SELECT estoque
             FROM produtos
             WHERE id = ?
             FOR UPDATE`,
            [produto_id]
        );

        if (produtos.length === 0) {

            await conexao.rollback();

            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        const estoqueAtual = Number(produtos[0].estoque);

        let novoEstoque;

        // Entrada de estoque

        if (tipo === 'entrada') {
            novoEstoque = estoqueAtual + quantidade;
        }

        // Saída de estoque

        else if (tipo === 'saida') {
            novoEstoque = estoqueAtual - quantidade;
        }

        // Ajuste de estoque

        else {
            novoEstoque = quantidade;
        }

        const quantidadeMovimentada =
            Math.abs(novoEstoque - estoqueAtual);

        // Impede estoque negativo

        if (novoEstoque < 0) {

            await conexao.rollback();

            return res.status(409).json({
                erro: 'Estoque insuficiente para realizar a saída.'
            });
        }

        if (novoEstoque > 2147483647) {

            await conexao.rollback();

            return res.status(409).json({
                erro: 'Limite de estoque excedido.'
            });
        }

        if (quantidadeMovimentada === 0) {

            await conexao.rollback();

            return res.status(409).json({
                erro: 'A movimentação não altera o estoque.'
            });
        }

        // Atualiza o estoque do produto

        await conexao.execute(
            `UPDATE produtos
             SET estoque = ?
             WHERE id = ?`,
            [novoEstoque, produto_id]
        );

        // Registra a movimentação no histórico

        await conexao.execute(
            `INSERT INTO movimentacoes_estoque
             (produto_id, usuario_id, tipo,
              quantidade, saldo_resultante, motivo)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                produto_id,
                req.usuario.id,
                tipo,
                quantidadeMovimentada,
                novoEstoque,
                motivo.trim()
            ]
        );

        await conexao.commit();

        res.status(201).json({
            mensagem: 'Movimentação registrada com sucesso!',
            saldo: novoEstoque
        });

    } catch (erro) {

        if (conexao) {
            try {
                await conexao.rollback();
            } catch (falha) {
                console.error(falha);
            }
        }

        erroAdmin(res, erro);

    } finally {

        if (conexao) {
            conexao.release();
        }
    }
});

// Rotas administrativas

app.use('/admin', admin);

// INICIALIZAÇÃO DO SERVIDOR

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});