# Banner — Especificação e Conteúdo
## InteliCareer — Career Intelligence Dashboard
**Projeto Interdisciplinar | FECAP | 4ADS — 2026**

---

## 1. Especificações Técnicas

| Item | Especificação |
|---|---|
| Formato | Banner vertical (roll-up) ou horizontal (painel) |
| Dimensões sugeridas | 60cm × 90cm (vertical) ou 90cm × 60cm (horizontal) |
| Resolução | Mínimo 150 DPI para impressão |
| Formato de arquivo | PDF vetorial ou PNG 300 DPI |
| Ferramenta de criação | Canva, Figma ou Adobe Express |
| Cores principais | Violeta `#7c3aed`, Branco `#ffffff`, Slate `#0f172a` |
| Fonte principal | Inter (Bold para títulos, Regular para corpo) |

---

## 2. Estrutura Visual do Banner

```
┌────────────────────────────────────────────┐
│                                            │
│   [LOGO INTELICAREER]                      │
│   Career Intelligence Dashboard           │
│                                            │
│   ─────────────────────────────────────   │
│                                            │
│   "Organize sua carreira.                  │
│    Entenda o mercado.                      │
│    Alcance seu próximo nível."             │
│                                            │
│   ─────────────────────────────────────   │
│                                            │
│   [SCREENSHOT 1]      [SCREENSHOT 2]       │
│   Kanban Tracker      Market Dashboard     │
│                                            │
│   [SCREENSHOT 3]      [SCREENSHOT 4]       │
│   Skill Gap           AI Insights          │
│                                            │
│   ─────────────────────────────────────   │
│                                            │
│   TECNOLOGIAS                              │
│   Next.js · Node.js · PostgreSQL           │
│   Python · FastAPI · OpenAI                │
│                                            │
│   ─────────────────────────────────────   │
│                                            │
│   EQUIPE                                   │
│   [Nome 1] · [Nome 2] · [Nome 3]           │
│   [Nome 4] · [Nome 5]                      │
│                                            │
│   FECAP · 4ADS · 2026                      │
│   [QR CODE → link do sistema]              │
│                                            │
└────────────────────────────────────────────┘
```

---

## 3. Conteúdo Textual do Banner

### Cabeçalho
```
InteliCareer
Career Intelligence Dashboard
```

### Tagline
```
Organize sua carreira. Entenda o mercado. Alcance seu próximo nível.
```

### Subtítulo / Descrição (máximo 2 linhas)
```
Plataforma inteligente para profissionais de tecnologia rastrearem candidaturas,
analisarem o mercado e receberem insights personalizados com IA.
```

### Funcionalidades em destaque (4 cards visuais)
| Card | Título | Descrição curta |
|---|---|---|
| 1 | Tracker de Candidaturas | Kanban board para gerenciar todos os processos seletivos |
| 2 | Market Intelligence | Dados em tempo real sobre skills e salários do mercado |
| 3 | Skill Gap Analyzer | Compare seu perfil com as exigências do mercado |
| 4 | AI Career Insights | Plano de ação personalizado gerado por inteligência artificial |

### Stack Tecnológica
```
Next.js · TypeScript · Node.js · PostgreSQL · Python · FastAPI · OpenAI
```

### Informações institucionais
```
Projeto Interdisciplinar — 4° Semestre ADS
FECAP — Fundação Escola de Comércio Álvares Penteado
2026
```

---

## 4. Paleta de Cores

| Elemento | Cor | Hex |
|---|---|---|
| Fundo principal | Slate escuro | `#0f172a` |
| Fundo cards | Slate médio | `#1e293b` |
| Cor de destaque / Accent | Violeta | `#7c3aed` |
| Texto principal | Branco | `#ffffff` |
| Texto secundário | Cinza claro | `#94a3b8` |
| Bordas e separadores | Slate borda | `#334155` |

---

## 5. Screenshots para o Banner

Capturar as seguintes telas do sistema para usar no banner:

| # | Tela | URL | Área de foco |
|---|---|---|---|
| 1 | Dashboard Overview | `/dashboard` | KPI cards no topo |
| 2 | Kanban Tracker | `/tracker` | Board com os 5 estágios |
| 3 | Market Dashboard | `/market` | Gráfico de skills em alta |
| 4 | Skill Gap | `/skills` | Score de compatibilidade circular |

**Configuração para screenshot:**
- Resolução: 1440 × 900px
- Zoom do browser: 100%
- Tema: Dark (padrão do sistema)
- Dados: conta demo populada (`demo@intelicareer.com`)

---

## 6. QR Code

Gerar QR Code apontando para:
- **Durante apresentação:** `http://localhost:3000` (rede local)
- **Pós-deploy:** `https://intelicareer.vercel.app` (deploy Vercel)

Ferramentas gratuitas para gerar QR Code:
- qr-code-generator.com
- qrcode.tec-it.com

---

*Especificação do banner para apresentação FECAP (novembro 2026). Design final a ser executado no Canva ou Figma.*
