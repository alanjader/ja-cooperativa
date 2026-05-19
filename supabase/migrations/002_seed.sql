-- ============================================================
-- JA Cooperativa — Seed inicial (DEV ONLY)
-- Não rodar em produção.
-- ============================================================

-- Cooperativa de exemplo
insert into cooperativa.cooperativas (id, nome, cnpj, uf, cidade)
values ('00000000-0000-0000-0000-000000000001', 'Cooperativa Demo Grãos', '00.000.000/0001-00', 'GO', 'Goiânia')
on conflict (id) do nothing;

-- Safra atual
insert into cooperativa.safras (id, cooperativa_id, ano_inicio, ano_fim, nome, cultura)
values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 2025, 2026, '2025/26', 'soja')
on conflict do nothing;

-- 5 cooperados de exemplo
insert into cooperativa.cooperados (id, cooperativa_id, codigo, nome, cpf_cnpj, modo, status, score_geral, semaforo)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'C0001', 'João da Silva',   '111.111.111-11', 'integrado',     'ativo',  92, 'verde'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'C0002', 'Maria Souza',     '222.222.222-22', 'simplificado',  'ativo',  78, 'amarelo'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'C0003', 'Pedro Almeida',   '333.333.333-33', 'integrado',     'ativo',  55, 'vermelho'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'C0004', 'Ana Beatriz',     '444.444.444-44', 'simplificado',  'ativo',  88, 'verde'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'C0005', 'Carlos Pereira',  '555.555.555-55', 'integrado',     'ativo',  70, 'amarelo')
on conflict (cooperativa_id, codigo) do nothing;

-- Alguns alertas
insert into cooperativa.alertas (cooperativa_id, cooperado_id, tipo, severidade, titulo, detalhe)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', 'certificacao_vencida', 'vermelho', 'Rainforest vencida há 12 dias', 'Renovação pendente.'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'visita_atrasada',      'amarelo',  'Visita ATR atrasada 7 dias', 'Reagendar prioridade.');

refresh materialized view cooperativa.mv_dashboard_executivo;
