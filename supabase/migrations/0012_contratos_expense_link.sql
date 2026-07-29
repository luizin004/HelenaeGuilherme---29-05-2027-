-- Liga hg_contracts a hg_expenses: quando uma despesa vira "contratado" (ou
-- "pago"), o financeiro sincroniza automaticamente um registro em Contratos
-- (para anexar o arquivo assinado entre as partes).
alter table hg_contracts
  add column if not exists expense_id uuid references hg_expenses(id) on delete set null;

create unique index if not exists hg_contracts_expense_id_key
  on hg_contracts (expense_id)
  where expense_id is not null;
