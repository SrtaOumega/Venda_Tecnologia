
CREATE DATABASE IF NOT EXISTS bdd_eskillows
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE bdd_eskillows;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil ENUM('cliente', 'admin')
        NOT NULL DEFAULT 'cliente',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_usuarios_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tokens_revogados (
    jti CHAR(36) PRIMARY KEY,
    expira_em DATETIME NOT NULL,
    INDEX idx_tokens_expira (expira_em)
) ENGINE=InnoDB;

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,

    CONSTRAINT uq_categorias_nome UNIQUE (nome)
) ENGINE=InnoDB;

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT,
    categoria_id INT NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0,
    estoque_minimo INT NOT NULL DEFAULT 5,
    imagem VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_produtos_codigo UNIQUE (codigo),
    CONSTRAINT chk_produtos_preco CHECK (preco >= 0),
    CONSTRAINT chk_produtos_estoque CHECK (estoque >= 0),
    CONSTRAINT chk_produtos_estoque_minimo CHECK (estoque_minimo >= 0),
    CONSTRAINT fk_produtos_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_produtos_categoria_ativo (categoria_id, ativo),
    INDEX idx_produtos_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    data_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10, 2) NOT NULL,
    desconto DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    valor_total DECIMAL(10, 2) NOT NULL,
    status ENUM('Pendente', 'Concluído', 'Cancelado')
        NOT NULL DEFAULT 'Pendente',
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_pedidos_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_pedidos_desconto CHECK (
        desconto >= 0 AND desconto <= subtotal
    ),
    CONSTRAINT chk_pedidos_total CHECK (
        valor_total >= 0 AND valor_total = subtotal - desconto
    ),
    CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_pedidos_usuario_data (usuario_id, data_pedido)
) ENGINE=InnoDB;

CREATE TABLE itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    subtotal_item DECIMAL(10, 2) NOT NULL,

    CONSTRAINT chk_itens_quantidade CHECK (quantidade > 0),
    CONSTRAINT chk_itens_preco CHECK (preco_unitario >= 0),
    CONSTRAINT chk_itens_subtotal CHECK (
        subtotal_item = quantidade * preco_unitario
    ),
    CONSTRAINT fk_itens_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_itens_produto
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_item_produto_por_pedido UNIQUE (pedido_id, produto_id),
    INDEX idx_itens_produto (produto_id)
) ENGINE=InnoDB;

CREATE TABLE movimentacoes_estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    usuario_id INT NULL,
    pedido_id INT NULL,
    tipo ENUM('entrada', 'saida', 'ajuste') NOT NULL,
    quantidade INT NOT NULL,
    saldo_resultante INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    data_movimentacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_mov_quantidade CHECK (quantidade > 0),
    CONSTRAINT chk_mov_saldo CHECK (saldo_resultante >= 0),
    CONSTRAINT fk_mov_produto
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_mov_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_mov_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_mov_produto_data (produto_id, data_movimentacao),
    INDEX idx_mov_pedido (pedido_id)
) ENGINE=InnoDB;

INSERT INTO categorias (nome) VALUES
    ('Periféricos'),
    ('Áudio e Vídeo'),
    ('Mobiliário Gamer');

INSERT INTO produtos
    (codigo, nome, descricao, categoria_id, preco, estoque,
     estoque_minimo, imagem, ativo)
VALUES
    ('PROD-001', 'Mouse Gamer RGB',
     'Mouse óptico de alta precisão com iluminação RGB e botões programáveis.',
     1, 149.90, 20, 5, '../imagens/mouse.jpeg', TRUE),

    ('PROD-002', 'Teclado Mecânico',
     'Teclado mecânico com switches táteis e estrutura reforçada para jogos.',
     1, 289.90, 15, 5, '../imagens/teclado.png', TRUE),

    ('PROD-003', 'Mousepad Speed Extra Grande',
     'Superfície de tecido otimizada com base emborrachada antiderrapante.',
     1, 69.90, 30, 5, '../imagens/mousepad.jpeg', TRUE),

    ('PROD-004', 'Headset Gamer Surround',
     'Fone de ouvido com som imersivo, almofadas confortáveis e microfone integrado.',
     2, 249.90, 12, 5, '../imagens/fone.jpeg', TRUE),

    ('PROD-005', 'Microfone Condensador USB',
     'Microfone de mesa com captação clara ideal para streaming e chamadas.',
     2, 319.90, 8, 3, '../imagens/microfone.jpeg', TRUE),

    ('PROD-006', 'Caixa de Som Estéreo',
     'Sistema de áudio compacto com graves reforçados e conexão USB/P2.',
     2, 119.90, 18, 5, '../imagens/caixa de som.jpeg', TRUE),

    ('PROD-007', 'Webcam Full HD 1080p',
     'Câmera com foco automático e correção de luz para videoconferências.',
     2, 199.90, 10, 4, '../imagens/webcam.jpeg', TRUE),

    ('PROD-008', 'Cadeira Gamer Ergonômica',
     'Cadeira reclinável com apoio lombar, ajuste de altura e revestimento sintético.',
     3, 899.90, 5, 2, '../imagens/cadeira 2.jpeg', TRUE);

INSERT INTO movimentacoes_estoque
    (produto_id, usuario_id, pedido_id, tipo, quantidade,
     saldo_resultante, motivo)
SELECT
    id, NULL, NULL, 'entrada', estoque, estoque_resultante,
    'Registro do estoque inicial'
FROM (
    SELECT id, estoque, estoque AS estoque_resultante
    FROM produtos
) AS produtos_iniciais
WHERE estoque > 0;

SELECT
    p.id,
    p.codigo,
    p.nome AS produto,
    c.nome AS categoria,
    p.preco,
    p.estoque,
    p.estoque_minimo,
    p.ativo
FROM produtos AS p
INNER JOIN categorias AS c ON c.id = p.categoria_id
ORDER BY p.id;

SELECT
    nome,
    estoque,
    estoque_minimo
FROM produtos
WHERE estoque <= estoque_minimo
  AND ativo = TRUE;

SELECT
    m.id,
    p.nome AS produto,
    m.tipo,
    m.quantidade,
    m.saldo_resultante,
    m.motivo,
    m.data_movimentacao,
    u.nome AS responsavel,
    m.pedido_id
FROM movimentacoes_estoque AS m
INNER JOIN produtos AS p ON p.id = m.produto_id
LEFT JOIN usuarios AS u ON u.id = m.usuario_id
ORDER BY m.data_movimentacao DESC;

