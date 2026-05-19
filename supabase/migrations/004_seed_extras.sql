-- 004_seed_extras.sql
-- Seed: Certificacoes + ATR + Laudos + IA log + Vendas + Documentos
set search_path = cooperativa, public;

insert into cooperativa.certificacoes (id, cooperado_id, tipo, status, emitida_em, valida_ate, documento_url, metadados) values
  ('00000000-0000-0000-0000-0000000ce001','00000000-0000-0000-0000-000000000101','rainforest','ativa','2024-03-15','2026-03-15','https://docs.example.com/cert-001.pdf','{}'::jsonb),
  ('00000000-0000-0000-0000-0000000ce002','00000000-0000-0000-0000-000000000101','globalgap','ativa','2024-05-20','2025-05-20','https://docs.example.com/cert-002.pdf','{}'::jsonb),
  ('00000000-0000-0000-0000-0000000ce003','00000000-0000-0000-0000-000000000102','organico','ativa','2024-01-10','2027-01-10','https://docs.example.com/cert-003.pdf','{}'::jsonb),
  ('00000000-0000-0000-0000-0000000ce004','00000000-0000-0000-0000-000000000103','fair_trade','vencida','2023-06-30','2025-06-30','https://docs.example.com/cert-004.pdf','{}'::jsonb),
  ('00000000-0000-0000-0000-0000000ce005','00000000-0000-0000-0000-000000000104','4c','ativa','2025-02-15','2026-08-15','https://docs.example.com/cert-005.pdf','{}'::jsonb),
  ('00000000-0000-0000-0000-0000000ce006','00000000-0000-0000-0000-000000000105','rtrs','ativa','2024-08-01','2026-02-01','https://docs.example.com/cert-006.pdf','{}'::jsonb)
on conflict (id) do nothing;

insert into cooperativa.visitas_atr (id, cooperativa_id, cooperado_id, agendada_para, realizada_em, recomendacoes, observacoes) values
  ('00000000-0000-0000-0000-0000000a7001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','2025-05-10 09:00+00','2025-05-10 09:35+00','{"acoes":[{"prioridade":"alta","descricao":"Aplicar fungicida em T-01"}]}'::jsonb,'Lavoura em bom estado.'),
  ('00000000-0000-0000-0000-0000000a7002','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000102','2025-05-12 14:00+00','2025-05-12 14:50+00','{"acoes":[{"prioridade":"media","descricao":"Ajustar NPK"}]}'::jsonb,'Boas praticas.'),
  ('00000000-0000-0000-0000-0000000a7003','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000103','2025-05-15 08:00+00',null,'{}'::jsonb,'Agendada.'),
  ('00000000-0000-0000-0000-0000000a7004','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000104','2025-04-28 10:00+00','2025-04-28 10:40+00','{"acoes":[{"prioridade":"alta","descricao":"Revisar irrigacao"}]}'::jsonb,'Irrigacao desuniforme.'),
  ('00000000-0000-0000-0000-0000000a7005','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000105','2025-05-18 13:00+00',null,'{}'::jsonb,'Pendente.')
on conflict (id) do nothing;

insert into cooperativa.laudos_qualidade (id, lote_id, emitido_em, umidade, impureza, graos_avariados, resultado, metadados, hash) values
  ('00000000-0000-0000-0000-00000001a001','00000000-0000-0000-0000-00000000c001','2025-04-20 10:00+00',13.5, 0.8, 1.2, 'aprovado','{}'::jsonb,'h_001'),
  ('00000000-0000-0000-0000-00000001a002','00000000-0000-0000-0000-00000000c002','2025-04-22 11:00+00',14.8, 1.5, 2.0, 'aprovado_com_desconto','{}'::jsonb,'h_002'),
  ('00000000-0000-0000-0000-00000001a003','00000000-0000-0000-0000-00000000c003','2025-04-25 09:30+00',13.0, 0.5, 0.9, 'aprovado','{}'::jsonb,'h_003'),
  ('00000000-0000-0000-0000-00000001a004','00000000-0000-0000-0000-00000000c004','2025-04-28 14:00+00',16.5, 3.0, 5.2, 'reprovado','{}'::jsonb,'h_004')
on conflict (id) do nothing;

insert into cooperativa.ai_agentes_log (id, cooperativa_id, agente, input, output, custo_tokens, latencia_ms, criado_em) values
  ('00000000-0000-0000-0000-0000000a1001','00000000-0000-0000-0000-000000000001','agent-risco','{}'::jsonb,'{"alertas_gerados":2,"sumario":"2 cooperados em risco."}'::jsonb, 1240, 1850, now() - interval '2 hours'),
  ('00000000-0000-0000-0000-0000000a1002','00000000-0000-0000-0000-000000000001','agent-certificacao','{}'::jsonb,'{"sumario":"1 certificacao vencida."}'::jsonb, 820, 1100, now() - interval '1 hour')
on conflict (id) do nothing;

refresh materialized view cooperativa.mv_dashboard_executivo;
-- fim 004_seed_extras.sql
