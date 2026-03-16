# Gestão de Custo
## InteliCareer — Career Intelligence Dashboard
**Projeto Interdisciplinar | FECAP | 4ADS — 2026**

---

## 1. Premissas de Custo

- Projeto acadêmico: equipe sem remuneração (custo de oportunidade estimado)
- Uso prioritário de ferramentas gratuitas e planos free-tier
- Custos calculados para cenário de produto real (pós-FECAP)

---

## 2. Estimativa de Custo — Desenvolvimento

### Custo de Oportunidade (Equipe Acadêmica)

| Papel | Horas Estimadas | Valor/hora (mercado SP) | Total |
|---|---|---|---|
| Backend Developer | 80h | R$ 80,00 | R$ 6.400,00 |
| Frontend Developer | 60h | R$ 75,00 | R$ 4.500,00 |
| Data Engineer | 40h | R$ 85,00 | R$ 3.400,00 |
| PM / Documentação | 30h | R$ 60,00 | R$ 1.800,00 |
| **Total** | **210h** | | **R$ 16.100,00** |

> Para fins acadêmicos, este custo é R$ 0,00 (trabalho da equipe). O valor acima representa o **custo de mercado equivalente**.

---

## 3. Estimativa de Custo — Infraestrutura (Plano Gratuito — MVP)

| Serviço | Plano | Custo Mensal | Observação |
|---|---|---|---|
| Vercel (Frontend) | Hobby (Free) | R$ 0,00 | Até 100GB de banda |
| Railway (Backend + DB) | Free Tier | R$ 0,00 | 500h/mês de execução |
| PostgreSQL (Railway) | Free Tier | R$ 0,00 | 1GB de armazenamento |
| GitHub | Free | R$ 0,00 | Repositório público |
| OpenAI API (IA) | Pay-per-use | ~R$ 25,00/mês | ~500 chamadas/mês |
| **Total MVP (mensal)** | | **~R$ 25,00** | |

---

## 4. Estimativa de Custo — Infraestrutura (Plano Pago — Escala)

| Serviço | Plano | Custo Mensal | Observação |
|---|---|---|---|
| Vercel (Frontend) | Pro | R$ 100,00 | Largura de banda ilimitada |
| Railway (Backend) | Pro | R$ 150,00 | CPU e memória dedicada |
| PostgreSQL (Supabase) | Pro | R$ 125,00 | 8GB + backups automáticos |
| OpenAI API | Pay-per-use | R$ 200,00 | ~4.000 chamadas/mês |
| Domínio (.com) | Anual | R$ 60,00/mês (pró-rata) | intelicareer.com |
| **Total Escala (mensal)** | | **~R$ 635,00** | |

---

## 5. Orçamento Total do Projeto (Acadêmico — 12 semanas)

| Categoria | Custo Real | Custo de Mercado |
|---|---|---|
| Equipe (custo de oportunidade) | R$ 0,00 | R$ 16.100,00 |
| Infraestrutura (3 meses) | R$ 75,00 | R$ 75,00 |
| Ferramentas e licenças | R$ 0,00 | R$ 0,00 |
| **Total** | **R$ 75,00** | **R$ 16.175,00** |

---

## 6. Ponto de Equilíbrio (Break-even)

Com modelo freemium — **Plano Pro: R$ 39,90/mês**:

| Métrica | Valor |
|---|---|
| Custo mensal de operação (escala) | R$ 635,00 |
| Receita necessária para break-even | R$ 635,00 |
| Usuários pagantes necessários | **16 usuários Pro** |
| Meta realista em 6 meses | 50–100 usuários Pro |
| MRR projetado (50 usuários) | R$ 1.995,00 |

---

## 7. Controle de Custo

| Gatilho | Ação |
|---|---|
| OpenAI ultrapassa R$ 50/mês | Ativar limite por usuário (10 chamadas/dia free) |
| Railway ultrapassa free tier | Migrar para plano Pro ou otimizar containers |
| Custo total > R$ 200/mês (MVP) | Revisão de arquitetura e provedores |

---

*Estimativas baseadas em preços de mercado brasileiros (março 2026). Valores sujeitos a variação cambial (USD/BRL).*
