"""Valida uma base SQLite sem modificar registros ou executar migrações."""
import argparse
from collections import defaultdict
import json
from pathlib import Path
import sqlite3

def validar(path):
    path = Path(path).resolve()
    with sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True) as db:
        assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        assert not db.execute("PRAGMA foreign_key_check").fetchall()
        assert not db.execute("SELECT i.produto_sku FROM itens_pedido i LEFT JOIN produtos p ON p.sku=i.produto_sku WHERE p.sku IS NULL").fetchall()
        assert not db.execute("SELECT p.codigo FROM pedidos p LEFT JOIN clientes c ON c.codigo=p.cliente_codigo WHERE c.codigo IS NULL").fetchall()
        assert not db.execute("SELECT p.codigo FROM pedidos p JOIN itens_pedido i ON i.pedido_codigo=p.codigo GROUP BY p.codigo HAVING ROUND(p.valor_total,2) != ROUND(SUM(i.subtotal),2)").fetchall()
        assert not db.execute("SELECT id FROM itens_pedido WHERE ROUND(subtotal,2)!=ROUND(quantidade*valor_unitario,2)").fetchall()
        assert not db.execute("""SELECT p.sku FROM produtos p LEFT JOIN movimentacoes m ON m.produto_sku=p.sku GROUP BY p.sku
            HAVING p.estoque_atual != COALESCE(SUM(CASE m.tipo WHEN 'entrada' THEN m.quantidade ELSE -m.quantidade END),0)""").fetchall()
        assert not db.execute("""SELECT p.sku FROM produtos p JOIN itens_pedido i ON i.produto_sku=p.sku JOIN pedidos o ON o.codigo=i.pedido_codigo
            WHERE o.status IN ('pendente','processando') AND o.estoque_baixado=0 GROUP BY p.sku HAVING SUM(i.quantidade)>p.estoque_atual""").fetchall()
        assert not db.execute("SELECT codigo FROM pedidos WHERE enviado_em<criado_em OR entregue_em<enviado_em OR cancelado_em<criado_em OR devolvido_em<entregue_em").fetchall()
        assert not db.execute("SELECT codigo FROM pedidos WHERE (status IN ('enviado','entregue') AND estoque_baixado=0) OR (status IN ('cancelado','devolvido') AND estoque_baixado=1)").fetchall()
        assert not db.execute("SELECT nome,marca,especificacao FROM produtos GROUP BY LOWER(nome),LOWER(marca),LOWER(especificacao) HAVING COUNT(*)>1").fetchall()
        codigos, marcas = set(), defaultdict(set)
        for codigo, categoria, marca, especificacao in db.execute("SELECT gtin_ean,categoria,marca,especificacao FROM produtos"):
            assert codigo and len(codigo)==13 and codigo.isdigit()
            assert sum(int(n)*(1 if i%2==0 else 3) for i,n in enumerate(codigo[:12])) % 10 == (-int(codigo[-1])) % 10
            assert codigo not in codigos
            assert marca and especificacao
            codigos.add(codigo)
            marcas[categoria].add(marca)
        assert all(len(values)>=3 for values in marcas.values())
        for sku, saldo in db.execute("SELECT sku,estoque_atual FROM produtos"):
            running = 0
            for tipo, quantidade, antes, depois in db.execute("SELECT tipo,quantidade,saldo_anterior,saldo_posterior FROM movimentacoes WHERE produto_sku=? ORDER BY criado_em,id", (sku,)):
                assert antes==running, (sku, antes, running)
                running += quantidade if tipo=='entrada' else -quantidade
                assert running==depois and running>=0
            assert running==saldo
        summary = {"integridade": "ok", "relacionamentos": "ok", "saldos_e_cadeias_conciliados": True,
            "reservas_dentro_do_saldo": True, "totais_dos_pedidos_conciliados": True,
            "identidades_e_ean13_unicos": True, "datas_e_estados_coerentes": True,
            "categorias": {key: len(values) for key, values in marcas.items()},
            "pedidos_por_ano": dict(db.execute("SELECT substr(criado_em,1,4),COUNT(*) FROM pedidos GROUP BY substr(criado_em,1,4)")),
            "pedidos_por_status": dict(db.execute("SELECT status,COUNT(*) FROM pedidos GROUP BY status")),
            "auditoria_por_ano": dict(db.execute("SELECT substr(criado_em,1,4),COUNT(*) FROM auditoria GROUP BY substr(criado_em,1,4)"))}
        return summary

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--banco', required=True)
    parser.add_argument('--saida')
    args=parser.parse_args()
    resultado=json.dumps(validar(args.banco), ensure_ascii=False, indent=2)
    if args.saida: Path(args.saida).write_text(resultado, encoding='utf-8')
    print(resultado)
