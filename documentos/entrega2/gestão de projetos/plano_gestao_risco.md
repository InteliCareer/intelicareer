# Plano de Gestão de Risco
## InteliCareer — Career Intelligence Dashboard
**Projeto Interdisciplinar | FECAP | 4ADS — 2026**

---

## 1. Metodologia

Riscos avaliados por **Probabilidade × Impacto** (Matriz 5×5) e priorizados pela técnica **GUT** (Gravidade, Urgência, Tendência). Ver tabela completa em `/entrega2/Cibersegurança/tabela_riscos_gut.md`.

---

## 2. Registro de Riscos

| ID | Risco | Categoria | Prob. | Impacto | Score |
|---|---|---|---|---|---|
| R01 | APIs externas atingem limite de requisições | Técnico | Alta | Alto | 12 |
| R02 | Custo da OpenAI API ultrapassa orçamento | Financeiro | Média | Médio | 6 |
| R03 | Membro da equipe indisponível | Equipe | Média | Alto | 8 |
| R04 | Scope creep — adição de features não planejadas | Projeto | Alta | Médio | 8 |
| R05 | Falha de segurança — IDOR ou XSS | Segurança | Baixa | Crítico | 10 |
| R06 | Banco de dados corrompido / perda de dados | Técnico | Baixa | Crítico | 10 |
| R07 | Atraso na entrega por dificuldade técnica | Projeto | Média | Alto | 8 |
| R08 | Qualidade dos dados de mercado baixa | Dados | Alta | Médio | 8 |
| R09 | Não conformidade com LGPD | Legal | Baixa | Alto | 6 |
| R10 | Concorrente lança produto similar | Mercado | Baixa | Médio | 4 |

---

## 3. Plano de Resposta

| ID | Estratégia | Ação de Resposta | Responsável |
|---|---|---|---|
| R01 | Mitigar | Cache de 6h, múltiplas fontes de dados | Dev Backend |
| R02 | Mitigar | Limitar chamadas IA por usuário (10/dia) | Dev Backend |
| R03 | Aceitar | Backlog priorizado; qualquer membro pode assumir tarefa | PM |
| R04 | Evitar | Congelar escopo após sprint 2; backlog para v2 | PM |
| R05 | Mitigar | Code review obrigatório; checklist OWASP | Dev Backend |
| R06 | Mitigar | Backups diários automáticos no Railway/Supabase | DevOps |
| R07 | Mitigar | Buffer de 20% no cronograma; PERT-CPM monitorado | PM |
| R08 | Mitigar | Validação de qualidade nos scripts ETL (Pydantic) | Data Eng. |
| R09 | Evitar | Política de privacidade + opt-in para dados sensíveis | Equipe |
| R10 | Aceitar | Foco no nicho de desenvolvedores e mercado remoto | PM |

---

## 4. Monitoramento

| Frequência | Atividade |
|---|---|
| Semanal | Revisão do log de erros do sistema |
| Por sprint | Atualização da matriz de riscos |
| Por entrega | Auditoria de segurança (checklist OWASP) |
| Mensal | Revisão de custos de infraestrutura |

---

*Documento elaborado conforme PMBOK — Área de Conhecimento: Gerenciamento de Riscos.*
