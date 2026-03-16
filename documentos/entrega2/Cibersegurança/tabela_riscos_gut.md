# Tabela de Riscos — Matriz GUT
## InteliCareer — Career Intelligence Dashboard
**Projeto Interdisciplinar | FECAP | 4ADS — 2026**

---

## 1. Metodologia GUT

A técnica **GUT** avalia riscos por três critérios pontuados de 1 a 5:

| Critério | Definição | Escala |
|---|---|---|
| **G — Gravidade** | Impacto do problema se não for resolvido | 1 (mínimo) a 5 (extremamente grave) |
| **U — Urgência** | Pressão do tempo para resolver o problema | 1 (pode esperar) a 5 (ação imediata) |
| **T — Tendência** | Evolução do problema sem intervenção | 1 (desaparece) a 5 (piora rapidamente) |

**Score GUT = G × U × T** (máximo: 125)

> Prioridade de ação: score ≥ 75 = Crítico | 40–74 = Alto | 15–39 = Médio | < 15 = Baixo

---

## 2. Referência de Escala

### Gravidade (G)
| Valor | Descrição |
|---|---|
| 5 | Extremamente grave — comprometimento total do sistema ou dados |
| 4 | Muito grave — impacto significativo em funcionalidades críticas |
| 3 | Grave — degradação perceptível do sistema |
| 2 | Pouco grave — impacto limitado, workaround disponível |
| 1 | Sem gravidade — impacto mínimo |

### Urgência (U)
| Valor | Descrição |
|---|---|
| 5 | Ação imediata — risco ativo ou prestes a ocorrer |
| 4 | Urgente — deve ser resolvido nesta sprint |
| 3 | Médio prazo — pode aguardar até próxima sprint |
| 2 | Baixa urgência — pode ser planejado |
| 1 | Sem urgência — pode ser ignorado por longo período |

### Tendência (T)
| Valor | Descrição |
|---|---|
| 5 | Piora muito rapidamente sem ação |
| 4 | Piora em pouco tempo |
| 3 | Piora a médio prazo |
| 2 | Piora lentamente |
| 1 | Não piora ou desaparece naturalmente |

---

## 3. Tabela GUT — Riscos do Projeto

| ID | Risco | Categoria | G | U | T | Score GUT | Prioridade |
|---|---|---|---|---|---|---|---|
| R01 | APIs externas atingem limite de requisições | Técnico | 4 | 4 | 4 | **64** | Alto |
| R02 | Custo da OpenAI API ultrapassa orçamento | Financeiro | 3 | 3 | 3 | **27** | Médio |
| R03 | Membro da equipe indisponível | Equipe | 3 | 4 | 2 | **24** | Médio |
| R04 | Scope creep — features não planejadas | Projeto | 3 | 4 | 4 | **48** | Alto |
| R05 | Falha de segurança — IDOR ou XSS | Segurança | 5 | 3 | 3 | **45** | Alto |
| R06 | Banco de dados corrompido / perda de dados | Técnico | 5 | 3 | 2 | **30** | Médio |
| R07 | Atraso na entrega por dificuldade técnica | Projeto | 4 | 4 | 3 | **48** | Alto |
| R08 | Qualidade dos dados de mercado baixa | Dados | 3 | 3 | 4 | **36** | Médio |
| R09 | Não conformidade com LGPD | Legal | 5 | 2 | 2 | **20** | Médio |
| R10 | Concorrente lança produto similar | Mercado | 3 | 2 | 3 | **18** | Baixo |
| R11 | Upload de arquivo malicioso no Resume Analyzer | Segurança | 4 | 3 | 2 | **24** | Médio |
| R12 | Vazamento de tokens JWT | Segurança | 5 | 4 | 3 | **60** | Alto |

---

## 4. Ranking por Prioridade

### Crítico (Score ≥ 75)
> Nenhum risco atingiu nível crítico com as mitigações planejadas.

### Alto (Score 40–74)
| Rank | ID | Risco | Score |
|---|---|---|---|
| 1 | R01 | APIs externas — rate limit | 64 |
| 2 | R12 | Vazamento de tokens JWT | 60 |
| 3 | R04 | Scope creep | 48 |
| 4 | R07 | Atraso na entrega | 48 |
| 5 | R05 | Falha de segurança — IDOR/XSS | 45 |

### Médio (Score 15–39)
| Rank | ID | Risco | Score |
|---|---|---|---|
| 6 | R06 | Banco de dados corrompido | 30 |
| 7 | R02 | Custo OpenAI acima do orçamento | 27 |
| 8 | R03 | Membro da equipe indisponível | 24 |
| 9 | R11 | Upload malicioso | 24 |
| 10 | R09 | Não conformidade LGPD | 20 |
| 11 | R08 | Qualidade dos dados baixa | 36 |

### Baixo (Score < 15)
| Rank | ID | Risco | Score |
|---|---|---|---|
| 12 | R10 | Concorrente lança produto similar | 18 |

---

## 5. Plano de Ação por Prioridade

| ID | Score | Ação Prioritária | Prazo |
|---|---|---|---|
| R01 | 64 | Implementar cache de 6h e múltiplas fontes API | Sprint 2 |
| R12 | 60 | JWT com 15min expiry + refresh token em HttpOnly cookie | Sprint 1 |
| R04 | 48 | Congelar escopo após Sprint 2; backlog para v2 | Sprint 2 |
| R07 | 48 | Buffer 20% no cronograma; monitorar PERT-CPM | Contínuo |
| R05 | 45 | Code review + checklist OWASP; UUID em todos os IDs | Sprint 1 |
| R08 | 36 | Validação Pydantic nos scripts ETL | Sprint 3 |
| R06 | 30 | Backups diários automáticos no Railway/Supabase | Sprint 1 |
| R02 | 27 | Limite de 10 chamadas IA/dia por usuário free | Sprint 2 |
| R03 | 24 | Backlog priorizado; qualquer membro pode assumir tarefa | Contínuo |
| R11 | 24 | Validar MIME type; limite 5MB; container isolado | Sprint 2 |
| R09 | 20 | Política de privacidade + opt-in para dados sensíveis | Sprint 3 |
| R10 | 18 | Foco no nicho de devs e mercado remoto | Estratégico |

---

## 6. Matriz Visual GUT

```
GRAVIDADE
    5 │          R09      R06  R05      R12
    4 │     R08       R07          R01
    3 │ R10      R02  R03  R04  R08  R11
    2 │
    1 │
      └────────────────────────────────── URGÊNCIA
          1    2    3    4    5
```

> Riscos no quadrante superior-direito (G≥4, U≥4) requerem ação imediata.

---

*Matriz GUT elaborada conforme metodologia de priorização de riscos. Revisão prevista ao início de cada sprint.*
