# Análise de Stakeholders
## InteliCareer — Career Intelligence Dashboard
**Projeto Interdisciplinar | FECAP | 4ADS — 2026**

---

## 1. Identificação dos Stakeholders

| # | Stakeholder | Tipo | Papel |
|---|---|---|---|
| 1 | Equipe de Desenvolvimento | Interno | Construção e entrega do sistema |
| 2 | Professores / Banca FECAP | Externo | Avaliação e orientação acadêmica |
| 3 | Usuários Finais — Desenvolvedores | Externo | Usuários primários da plataforma |
| 4 | Usuários Finais — Profissionais de TI | Externo | Usuários primários da plataforma |
| 5 | Profissionais em busca de trabalho remoto | Externo | Usuários secundários |
| 6 | Fontes de Dados (Adzuna, Remotive) | Externo | Provedores de dados de mercado |
| 7 | Investidores / Aceleradores (futuro) | Externo | Financiamento e escala |

---

## 2. Matriz de Interesse × Poder

```
ALTO PODER
    │
    │  [4] Professores/Banca      [1] Equipe Dev
    │  [7] Investidores            [3] Usuários
    │
    │──────────────────────────────────────────── ALTO INTERESSE
    │
    │  [6] APIs / Fontes          [5] Busca Remota
    │
BAIXO PODER
```

| Quadrante | Estratégia |
|---|---|
| Alto Poder + Alto Interesse | Gerenciar de perto — atualizações frequentes |
| Alto Poder + Baixo Interesse | Manter satisfeitos — comunicações pontuais |
| Baixo Poder + Alto Interesse | Manter informados — feedback contínuo |
| Baixo Poder + Baixo Interesse | Monitorar — baixo esforço |

---

## 3. Perfil Detalhado dos Stakeholders

### Equipe de Desenvolvimento
- **Interesse:** Entregar projeto funcional e obter aprovação acadêmica
- **Poder:** Alto — controla todas as decisões técnicas
- **Expectativas:** Cronograma cumprido, tecnologias dominadas, boas notas
- **Estratégia:** Reuniões semanais de alinhamento, controle de tarefas via backlog

### Professores / Banca FECAP
- **Interesse:** Avaliação acadêmica alinhada ao currículo de 4ADS
- **Poder:** Alto — definem critérios de aprovação
- **Expectativas:** Documentação completa, sistema funcional, cumprimento das entregas
- **Estratégia:** Entregas pontuais, comunicação proativa, seguir template de documentos

### Usuários Finais — Desenvolvedores e Profissionais de TI
- **Interesse:** Ferramenta útil para gerenciar carreira e candidaturas
- **Poder:** Médio — aceitação define sucesso do produto
- **Expectativas:** Interface intuitiva, dados confiáveis, insights úteis
- **Estratégia:** Testes de usabilidade, coleta de feedback, iterações rápidas

### Fontes de Dados (APIs externas)
- **Interesse:** Uso responsável e dentro dos limites de uso gratuito
- **Poder:** Médio — podem revogar acesso se termos violados
- **Expectativas:** Conformidade com termos de uso, rate limits respeitados
- **Estratégia:** Cache de requisições, uso de múltiplas fontes como fallback

---

## 4. Plano de Comunicação

| Stakeholder | Canal | Frequência | Responsável |
|---|---|---|---|
| Professores / Banca | Entrega de documentos + apresentação | Por entrega | Equipe |
| Equipe Dev | GitHub + reuniões | Semanal | Equipe |
| Usuários | Formulário de feedback (Google Forms) | Por sprint | Equipe |
| APIs externas | Monitoramento de quota | Automatizado | Sistema |

---

*Análise elaborada conforme PMBOK 6ª Edição — Gestão de Stakeholders.*
