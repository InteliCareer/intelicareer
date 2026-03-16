# Modelo de Machine Learning
## InteliCareer — Career Intelligence Dashboard
**Projeto Interdisciplinar | FECAP | 4ADS — 2026**

---

## 1. Objetivo do Modelo

O InteliCareer utiliza modelos de ML e NLP para entregar três funcionalidades inteligentes:

| Funcionalidade | Tipo de Modelo | Input | Output |
|---|---|---|---|
| **Resume Parser** | NLP — NER (Named Entity Recognition) | Texto do currículo (PDF/TXT) | Lista de skills extraídas |
| **Skill Gap Analyzer** | Similaridade Vetorial + Regras | Skills do usuário + Skills da vaga | Score de compatibilidade (%) |
| **Career Insights** | LLM com Prompt Engineering | Perfil do usuário + dados de mercado | Plano de ação personalizado |

---

## 2. Modelo 1 — Resume Parser (NLP/NER)

### 2.1 Problema
Dado um texto de currículo, identificar automaticamente as habilidades técnicas e comportamentais mencionadas.

### 2.2 Abordagem
```
Texto bruto do currículo
        ↓
  Pré-processamento
  (limpeza, tokenização)
        ↓
  Matching por Taxonomia
  (lista de 300+ skills conhecidas)
        ↓
  NER com spaCy (en_core_web_sm)
  (extração de entidades não mapeadas)
        ↓
  Normalização (alias → canonical)
  ex: "React.js" → "React"
        ↓
  Lista de skills com score de confiança
```

### 2.3 Tecnologias
- **spaCy** — modelo `en_core_web_sm` para NER
- **Taxonomia própria** — 300+ skills tecnológicas com aliases
- **PyMuPDF** — extração de texto de PDFs

### 2.4 Métricas de Avaliação
| Métrica | Valor Alvo | Descrição |
|---|---|---|
| Precision | ≥ 85% | Skills identificadas que são realmente válidas |
| Recall | ≥ 80% | Skills reais que o modelo consegue identificar |
| F1-Score | ≥ 82% | Média harmônica de Precision e Recall |

### 2.5 Exemplo

**Input:**
```
"5 anos de experiência com Node.js, Express e PostgreSQL.
Familiaridade com Docker, Kubernetes e pipelines CI/CD.
Inglês fluente. Scrum Master certificado."
```

**Output:**
```json
{
  "skills": [
    { "name": "Node.js", "category": "Backend", "confidence": 0.99 },
    { "name": "Express", "category": "Backend", "confidence": 0.97 },
    { "name": "PostgreSQL", "category": "Database", "confidence": 0.98 },
    { "name": "Docker", "category": "DevOps", "confidence": 0.99 },
    { "name": "Kubernetes", "category": "DevOps", "confidence": 0.98 },
    { "name": "Scrum", "category": "Methodology", "confidence": 0.95 }
  ]
}
```

---

## 3. Modelo 2 — Skill Gap Analyzer

### 3.1 Problema
Dado o conjunto de skills de um usuário e uma vaga-alvo (ou perfil de cargo), calcular o percentual de compatibilidade e identificar os gaps mais críticos.

### 3.2 Abordagem

**Fórmula do Score de Compatibilidade:**
```
Score = (|Skills_usuário ∩ Skills_vaga| / |Skills_vaga|) × 100
```

**Ponderação por criticidade da skill:**
```python
score_ponderado = sum(peso[skill] for skill in matches) / sum(peso[skill] for skill in required)
```

Onde `peso` é definido pela frequência de aparição da skill nas vagas dos últimos 90 dias (extraído do pipeline ETL).

### 3.3 Classificação dos Gaps

| Tipo de Gap | Critério | Ação Recomendada |
|---|---|---|
| Gap Crítico | Skill presente em >60% das vagas, ausente no perfil | Prioridade máxima de estudo |
| Gap Importante | Skill presente em 30–60% das vagas | Estudo no próximo mês |
| Gap Opcional | Skill presente em <30% das vagas | Diferencial competitivo |
| Skill Extra | Skill do usuário não exigida pela vaga | Destacar se relevante |

### 3.4 Exemplo

**Perfil do usuário:** Node.js, Express, PostgreSQL, Git
**Vaga-alvo:** Senior Backend Engineer

**Skills exigidas pela vaga:**
| Skill | Frequência nas vagas | Tem no perfil? | Peso |
|---|---|---|---|
| Node.js | 85% | ✅ | 0.85 |
| TypeScript | 75% | ❌ | 0.75 |
| PostgreSQL | 70% | ✅ | 0.70 |
| Docker | 65% | ❌ | 0.65 |
| Redis | 50% | ❌ | 0.50 |
| Git | 90% | ✅ | 0.90 |

**Score = (0.85 + 0.70 + 0.90) / (0.85 + 0.75 + 0.70 + 0.65 + 0.50 + 0.90) = 2.45 / 4.35 = 56%**

---

## 4. Modelo 3 — Career Insights (LLM)

### 4.1 Problema
Gerar recomendações personalizadas de carreira com base no perfil do usuário e tendências do mercado.

### 4.2 Abordagem — Prompt Engineering com RAG simplificado

```
Dados do usuário (perfil, skills, aplicações)
        +
Dados de mercado (top skills, salários, volume de vagas)
        ↓
  Montagem do Prompt Estruturado
        ↓
  OpenAI GPT-4o-mini
  (temperatura: 0.3 — respostas consistentes)
        ↓
  Resposta em JSON estruturado
        ↓
  Renderização no frontend
```

### 4.3 Estrutura do Prompt

```
Você é um career coach especializado em tecnologia.

PERFIL DO USUÁRIO:
- Cargo alvo: {target_role}
- Skills atuais: {user_skills}
- Aplicações nos últimos 30 dias: {applications_count}
- Taxa de resposta: {response_rate}%

DADOS DE MERCADO (últimos 90 dias):
- Top 5 skills mais demandadas para {target_role}: {market_top_skills}
- Faixa salarial média: {salary_range}
- Score de compatibilidade atual: {gap_score}%

TAREFA:
Gere um plano de ação personalizado com:
1. 3 ações prioritárias para os próximos 30 dias
2. 3 skills para aprender (com estimativa de tempo)
3. 2 pontos fortes do perfil atual
4. 1 sugestão de caminho de carreira alternativo

Responda em JSON com as chaves: priority_actions, skills_to_learn, strengths, career_path.
```

### 4.4 Exemplo de Output

```json
{
  "priority_actions": [
    "Completar curso de TypeScript (estimativa: 2 semanas)",
    "Construir projeto Docker no GitHub para demonstrar experiência prática",
    "Revisar e atualizar LinkedIn com keywords de Senior Backend"
  ],
  "skills_to_learn": [
    { "skill": "TypeScript", "time": "2 semanas", "resource": "TypeScript Handbook" },
    { "skill": "Docker", "time": "1 semana", "resource": "Docker Getting Started" },
    { "skill": "Redis", "time": "3 dias", "resource": "Redis University" }
  ],
  "strengths": [
    "Sólida base em Node.js + PostgreSQL — stack mais demandada do mercado",
    "Consistência nas candidaturas: 6 aplicações no mês"
  ],
  "career_path": "Com TypeScript e Docker, você estará qualificado para vagas de Tech Lead em 6 meses"
}
```

---

## 5. Arquitetura do Serviço de IA

```
Frontend (Next.js)
      │
      │ POST /api/ai/parse-resume
      │ POST /api/ai/insights
      ▼
Backend (Node.js)
      │
      │ HTTP interno
      ▼
AI Microservice (Python FastAPI)
      │
      ├─── spaCy NER (Resume Parser)
      ├─── Skill Matcher (Taxonomia)
      └─── OpenAI GPT-4o-mini (Insights)
```

### Endpoints da FastAPI

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/parse` | Recebe texto do currículo, retorna skills extraídas |
| POST | `/gap` | Recebe skills do usuário e cargo-alvo, retorna score e gaps |
| POST | `/insights` | Recebe perfil completo, retorna plano de ação |
| GET | `/health` | Health check do serviço |

---

## 6. Dataset e Treinamento

### 6.1 Taxonomia de Skills
- **Fonte:** Agregação manual + extração automática das APIs Adzuna e Remotive
- **Volume:** ~300 skills tecnológicas + 100 soft skills
- **Formato:** JSON com nome canônico, aliases, categoria e frequência

### 6.2 Dados para Frequência de Skills
- Coletados pelo pipeline ETL (Python) a cada 12 horas
- Armazenados na tabela `jobs` e `job_skills` no PostgreSQL
- Agregados diariamente em view materializada `market_skill_demand`

### 6.3 Validação do Modelo
- Conjunto de teste: 50 currículos fictícios com anotações manuais
- Avaliação mensal das métricas de Precision/Recall
- A/B testing das respostas de Insights com grupo piloto de usuários

---

## 7. Considerações Éticas e de Privacidade

| Aspecto | Decisão |
|---|---|
| Retenção de dados de currículo | Texto processado em memória; não armazenado no banco |
| Logs de IA | Apenas metadados (tempo, tokens usados); sem conteúdo |
| Bias de gênero/etnia | Modelo não recebe nome, foto ou dados demográficos |
| Transparência | Usuário pode ver quais skills foram extraídas e corrigir |
| Opt-in | Funcionalidades de IA são opcionais e explicitamente ativadas |

---

*Documentação técnica do componente de IA/ML. Implementação planejada para Sprint 3 (serviço FastAPI) com integração ao backend Node.js.*
