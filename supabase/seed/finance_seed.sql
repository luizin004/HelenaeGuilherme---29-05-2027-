-- ============================================================
-- Seed financeiro REAL — Helena & Guilherme (planilha do cliente)
-- Valores em CENTAVOS. Onde a planilha não define responsável, centro de custo
-- ou vencimento, o campo fica NULO/pendente (nunca inventado).
-- Idempotente: hg_expenses é exclusiva do casamento.
-- Aplicado em: projeto "Sistema De Orçamentos" (schema isolado hg_).
-- ============================================================

delete from hg_expense_installments;
delete from hg_expenses;

insert into hg_expenses (descricao, estado, gratuito, valor_total_cents, observacao) values
 ('Fotógrafo','orcado',false,540300,'30% (R$ 1.620,90) na assinatura do contrato; restante pode ser negociado.'),
 ('Cerimonialista','orcado',false,450000,'30% (R$ 1.350,00) na assinatura; restante R$ 3.150,00. Última parcela até 30 dias antes do casamento.'),
 ('Salão - Jessyca Cardoso','orcado',false,270500,'30% (R$ 811,50) na assinatura; restante R$ 1.893,50 em até 6x (cartão ou transferência mensal).'),
 ('Churrasco do Guh','orcado',false,2671130,'Cardápio completo (parrilla, fogo de chão, mesa gourmet 2h).'),
 ('Chopp - Joe','previsto',false,null,'Valor a definir.'),
 ('Convite - Vip','gratuito',true,null,'Gratuito. Ganhamos da Tia Elen.'),
 ('Som','previsto',false,null,'Valor a definir.'),
 ('Banda - Na Ideia','previsto',false,null,'Opção de banda. Valor a definir.'),
 ('Banda - Calangodum','previsto',false,null,'Opção de banda. Valor a definir.'),
 ('Banda - Zé Pretin','previsto',false,null,'Opção de banda. Valor a definir.'),
 ('DJ','previsto',false,null,'Valor a definir.'),
 ('Churrasqueiro - Domingo','orcado',false,25000,'Churrasqueiro para paiada - Anderson.'),
 ('Buffet','previsto',false,null,'Valor a definir.'),
 ('Cantor - Igreja','previsto',false,null,'Valor a definir.'),
 ('Violinista','previsto',false,null,'Valor a definir.'),
 ('Mobília e Cadeira','previsto',false,null,'Valor a definir.'),
 ('Decoração - Regina','previsto',false,null,'Valor a definir.'),
 ('Decoração - Flor - Festa','previsto',false,null,'Valor a definir.'),
 ('Decoração - Casamento','previsto',false,null,'Valor a definir.'),
 ('Vestido de Casamento','orcado',false,1000000,'Valor provisório — a noiva ainda vai definir o vestido real.'),
 ('Terno Guilherme','gratuito',true,null,'Gratuito. VL presenteou.'),
 ('Parque de Diversão','previsto',false,null,'Valor a definir.'),
 ('Monitor - Crianças','previsto',false,null,'Valor a definir.'),
 ('Tenda','orcado',false,450000,'Tenda de Q30 referente ao local. (R$ 4.500,00 informado na coluna de pagamento — confirmar.)');

-- Cronogramas conhecidos (entrada + restante). Fecham EXATAMENTE o total; vencimentos nulos (não informados).
insert into hg_expense_installments (expense_id, numero, valor_cents, vencimento, is_entrada)
select id, 1, 162090, null::date, true  from hg_expenses where descricao='Fotógrafo'
union all select id, 2, 378210, null::date, false from hg_expenses where descricao='Fotógrafo'
union all select id, 1, 135000, null::date, true  from hg_expenses where descricao='Cerimonialista'
union all select id, 2, 315000, null::date, false from hg_expenses where descricao='Cerimonialista'
union all select id, 1,  81150, null::date, true  from hg_expenses where descricao='Salão - Jessyca Cardoso'
union all select id, 2, 189350, null::date, false from hg_expenses where descricao='Salão - Jessyca Cardoso';

-- PENDENTE (não inventado): responsáveis por item (Helena/Guilherme/Toninho),
-- centros de custo por item, e vencimentos concretos. Ver docs/PENDING_DECISIONS.md.
