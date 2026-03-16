# Rede PERT-CPM
## InteliCareer — Career Intelligence Dashboard
**Projeto Interdisciplinar | FECAP | 4ADS — 2026**

---

## 1. Lista de Atividades

| ID | Atividade | Predecessora | Duração (dias) | Otimista (a) | Mais Provável (m) | Pessimista (b) |
|---|---|---|---|---|---|---|
| A | Termo de Abertura e Planejamento | — | 3 | 2 | 3 | 5 |
| B | Modelagem do Banco de Dados | A | 4 | 3 | 4 | 7 |
| C | Configuração do Ambiente e Docker | A | 2 | 1 | 2 | 4 |
| D | Desenvolvimento da API de Autenticação | B, C | 3 | 2 | 3 | 5 |
| E | API de Aplicações (Tracker) | D | 4 | 3 | 4 | 6 |
| F | Pipeline de Dados (Coleta e ETL) | B | 5 | 4 | 5 | 9 |
| G | API de Market Data | F | 3 | 2 | 3 | 5 |
| H | Frontend — Autenticação e Layout | D | 3 | 2 | 3 | 5 |
| I | Frontend — Kanban Tracker | E, H | 4 | 3 | 4 | 7 |
| J | Frontend — Dashboard de Mercado | G, H | 4 | 3 | 4 | 6 |
| K | Frontend — Skill Gap Analyzer | G, I | 3 | 2 | 3 | 6 |
| L | Serviço de IA (FastAPI — Resume Parser) | B | 5 | 4 | 5 | 8 |
| M | Frontend — Insights e Resume Analyzer | J, K, L | 4 | 3 | 4 | 7 |
| N | Testes de Integração e QA | M | 3 | 2 | 3 | 5 |
| O | Deploy (Railway + Vercel) | N | 2 | 1 | 2 | 4 |
| P | Documentação Final e Apresentação | O | 3 | 2 | 3 | 5 |

---

## 2. Duração Esperada PERT

**Fórmula:** `te = (a + 4m + b) / 6`

| ID | Atividade | te (dias) | Variância σ² |
|---|---|---|---|
| A | Planejamento | 3,2 | 0,25 |
| B | Modelagem BD | 4,3 | 0,44 |
| C | Ambiente / Docker | 2,2 | 0,25 |
| D | API Auth | 3,2 | 0,25 |
| E | API Tracker | 4,2 | 0,25 |
| F | Pipeline ETL | 5,5 | 0,69 |
| G | API Market | 3,2 | 0,25 |
| H | Frontend Auth | 3,2 | 0,25 |
| I | Frontend Kanban | 4,3 | 0,44 |
| J | Frontend Dashboard | 4,2 | 0,25 |
| K | Skill Gap UI | 3,3 | 0,44 |
| L | IA Service | 5,3 | 0,44 |
| M | Frontend Insights | 4,3 | 0,44 |
| N | Testes QA | 3,2 | 0,25 |
| O | Deploy | 2,2 | 0,25 |
| P | Documentação | 3,2 | 0,25 |

---

## 3. Caminho Crítico

```
A → B → F → G → J → M → N → O → P
```

| Caminho | Duração Total |
|---|---|
| **A→B→F→G→J→M→N→O→P** | **33,5 dias** ← CRÍTICO |
| A→B→D→E→I→K→M→N→O→P | 32,1 dias |
| A→B→L→M→N→O→P | 26,7 dias |
| A→C→D→H→I→K→M→N→O→P | 31,2 dias |

> O caminho crítico tem duração total de **~34 dias úteis (≈ 7 semanas)**, confirmando a viabilidade do cronograma de 12 semanas com folga para revisões.

---

## 4. Diagrama de Rede (Simplificado)

```
         ┌─ C ─────────────────┐
A ─── B ─┼─ D ─ E ─ I ─ K ───┼─ M ─ N ─ O ─ P
         ├─ F ─ G ─ J ─────────┤
         └─ L ─────────────────┘

         H ─ (paralelo a I, J)
```

---

## 5. Folgas por Atividade

| Atividade | Folga Total (dias) | No Caminho Crítico? |
|---|---|---|
| A | 0 | Sim |
| B | 0 | Sim |
| C | 2,1 | Não |
| D | 1,4 | Não |
| E | 1,4 | Não |
| F | 0 | Sim |
| G | 0 | Sim |
| H | 2,1 | Não |
| I | 1,4 | Não |
| J | 0 | Sim |
| K | 1,4 | Não |
| L | 6,8 | Não |
| M | 0 | Sim |
| N | 0 | Sim |
| O | 0 | Sim |
| P | 0 | Sim |

---

*Análise elaborada com base na técnica PERT/CPM para controle do cronograma do projeto.*
