<div align="center">

# RESET SENHA CORPORATIVO
**Portal de Autoatendimento para Redefinição de Senha Corporativa com Autenticação Multi-Fator**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Oracle DB](https://img.shields.io/badge/Oracle-Thick_Mode-F80000?logo=oracle&logoColor=white)](https://www.oracle.com/database/)
[![Active Directory](https://img.shields.io/badge/Active_Directory-ADSI_Native-0078D4?logo=microsoft&logoColor=white)](https://learn.microsoft.com/en-us/windows/win32/adsi/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Audit_Trail-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

*"A segurança da identidade digital é o pilar inegociável de qualquer infraestrutura corporativa."*

</div>

---

## 📋 Índice

- [💎 Visão Estratégica](#-visão-estratégica)
- [🏛️ Arquitetura de Segurança](#%EF%B8%8F-arquitetura-de-segurança)
- [🚀 Stack Tecnológica de Elite](#-stack-tecnológica-de-elite)
- [🔐 Fluxo de Autenticação Multi-Fator](#-fluxo-de-autenticação-multi-fator)
- [🔒 Segurança & Governança](#-segurança--governança)
- [🏗 Estrutura do Projeto](#-estrutura-do-projeto)
- [📊 Engenharia de Dados (Auditoria)](#-engenharia-de-dados-auditoria)
- [⚙️ Configuração de Ambiente](#%EF%B8%8F-configuração-de-ambiente)
- [🛠 Instalação & Deployment](#-instalação--deployment)

---

## 💎 Visão Estratégica

O **Reset-Senha-Corporativo** é um gateway de identidade de alta segurança projetado para permitir que colaboradores redefinam suas senhas de rede (Active Directory) de forma autônoma, sem intervenção do time de TI. Desenvolvido integralmente por **Christyan Silva**, o sistema integra três pilares corporativos em um único fluxo blindado:

- **Oracle ERP** — Validação de identidade contra a base oficial de colaboradores.
- **Active Directory** — Redefinição direta da senha via chamadas nativas ADSI/PowerShell.
- **WhatsApp OTP (Z-API)** — Verificação em duas etapas com código temporário enviado ao dispositivo pessoal do colaborador.

O resultado é uma solução que **elimina tickets de suporte** para reset de senha, **reduz o tempo de resolução de minutos para segundos** e garante **trilha de auditoria forense** completa em cada operação.

---

## 🏛️ Arquitetura de Segurança

O sistema opera sob um modelo de **Segurança em Camadas Concêntricas**, onde cada etapa do fluxo é um checkpoint independente:

```
┌─────────────────────────────────────────────────────┐
│                  CAMADA 1 — IDENTIDADE              │
│        Oracle ERP (Thick Mode) → Valida CPF/Mat.    │
├─────────────────────────────────────────────────────┤
│                  CAMADA 2 — POSSE                   │
│        Z-API (WhatsApp) → OTP 6 dígitos com TTL     │
├─────────────────────────────────────────────────────┤
│                  CAMADA 3 — CONHECIMENTO            │
│        Política de Senha → Validação Client+Server  │
├─────────────────────────────────────────────────────┤
│                  CAMADA 4 — EXECUÇÃO                │
│        Active Directory (ADSI Nativo) → Reset       │
├─────────────────────────────────────────────────────┤
│                  CAMADA 5 — REGISTRO                │
│        PostgreSQL → Log Forense (IP, User-Agent)    │
└─────────────────────────────────────────────────────┘
```

**Zero dependência de módulos RSAT.** O sistema utiliza chamadas nativas `[adsisearcher]` e `[adsi]` via PowerShell, permitindo operação em ambientes VPN sem necessidade de ferramentas administrativas instaladas no servidor.

---

## 🚀 Stack Tecnológica de Elite

### Frontend & Design System
- **Next.js 15 (App Router):** Renderização de servidor e roteamento avançado para performance máxima.
- **Tailwind CSS 4.2:** Estilização atômica com sistema de design Chrome & Glassmorphism.
- **Framer Motion:** Animações de transição entre steps com efeito de blur e spring physics.
- **Lucide React:** Iconografia vetorial premium de alta resolução.
- **Design Premium:** Interface com textura de metal escovado (fundo) e painéis de vidro embaçado (glassmorphism) para impacto visual corporativo.

### Backend & Core Services
- **Oracle Database (Thick Mode):** Conexão direta ao ERP corporativo para consulta de dados de colaboradores (matrícula, telefone, nome completo).
- **Active Directory (ADSI Nativo):** Reset de senha via PowerShell sem dependência do módulo RSAT, utilizando `[adsi]` e codificação Base64 para transmissão segura de credenciais.
- **PostgreSQL:** Banco de auditoria para OTPs, tentativas de login e logs de segurança com persistência imutável.
- **Z-API (WhatsApp Gateway):** Disparo de códigos OTP via WhatsApp para verificação de posse do dispositivo móvel.

### Infraestrutura
- **PM2 Process Manager:** Gerenciamento de processos Node.js em produção com reinicialização automática.
- **Oracle Instant Client (Thick Mode):** Driver nativo para conexão estável com Oracle Database via VPN corporativa.

---

## 🔐 Fluxo de Autenticação Multi-Fator

O processo de redefinição de senha segue um fluxo de **4 etapas sequenciais**, onde cada etapa só é acessível após a validação da anterior:

| Etapa | Ação | Serviço Backend | Validação |
|:---:|---|---|---|
| **1** | Colaborador insere seu username de rede | `oracle-service.ts` | Consulta o ERP Oracle para localizar matrícula e telefone cadastrado |
| **2** | Sistema envia OTP de 6 dígitos via WhatsApp | `zapi-service.ts` + `db-service.ts` | Código armazenado no PostgreSQL com TTL de expiração |
| **3** | Colaborador digita o OTP recebido | `db-service.ts` | Comparação via hash SHA-256 do código com registro no banco |
| **4** | Colaborador define nova senha | `ad-service.ts` | Reset via ADSI + política de complexidade (maiúsculas, minúsculas, números, símbolos) |

---

## 🔒 Segurança & Governança

Segurança enterprise implementada em múltiplas camadas:

- **OTP com Hash SHA-256:** Códigos OTP são armazenados como hash criptográfico — nunca em texto plano no banco.
- **Geração Criptograficamente Segura:** OTPs gerados via `crypto.randomInt()` (CSPRNG) — não `Math.random()`.
- **Rate Limiting:** Proteção contra brute-force em todas as rotas API (por IP e por usuário).
- **Validação de Origem (CSRF):** Verificação do header `Origin` contra o `Host` para bloquear requisições cross-origin.
- **Validação Server-Side de Senha:** Política de complexidade (3 de 4 critérios) validada no backend, impossibilitando bypass.
- **Codificação Base64:** Senhas transmitidas entre Node.js e PowerShell em Base64, prevenindo injeção de caracteres especiais.
- **Sanitização PowerShell:** Variáveis de ambiente interpoladas em single-quotes no PowerShell + `EncodedCommand` (Base64 UTF-16LE).
- **Trilha Forense Completa:** Cada operação registra IP real, User-Agent, timestamp e resultado no PostgreSQL.
- **Headers de Segurança:** CSP, HSTS, X-Frame-Options, Permissions-Policy e Referrer-Policy configurados.
- **OTP com TTL + Limite de Tentativas:** Códigos expiram em 10 min e são invalidados após 5 tentativas falhas.
- **Logger Estruturado:** Dados sensíveis e stack traces nunca expostos em produção.
- **Política de Senha AD:** Configuração `pwdLastSet = -1` aplicada para desabilitar a obrigatoriedade de troca no próximo logon.

---

## 🏗 Estrutura do Projeto

Arquitetura limpa e enxuta, sem código morto ou dependências desnecessárias:

```
Reset-Senha-Corporativo/
├── app/
│   ├── api/
│   │   ├── identify/route.ts    # Step 1: Consulta Oracle ERP + Rate Limit
│   │   ├── verify/route.ts      # Step 2: Validação OTP + Brute-Force Protection
│   │   └── reset/route.ts       # Step 3: Reset AD + Validação Server-Side
│   ├── globals.css              # Design System (Chrome & Glass)
│   ├── layout.tsx               # Layout com fundo metálico
│   └── page.tsx                 # Interface principal (4 steps)
├── lib/
│   ├── oracle-service.ts        # Conexão Oracle Thick Mode
│   ├── ad-service.ts            # ADSI/PowerShell Service (sanitizado)
│   ├── db-service.ts            # PostgreSQL Pool + OTP Hash SHA-256
│   ├── zapi-service.ts          # WhatsApp OTP Gateway
│   ├── security.ts              # Módulo central de segurança (OTP, CSRF, validação)
│   ├── rate-limiter.ts          # Rate Limiting em memória (anti brute-force)
│   └── logger.ts                # Logger estruturado (seguro em produção)
├── public/
│   └── bg-metal.png             # Textura de metal escovado
├── next.config.js               # Security Headers + Oracle packages
├── postcss.config.js            # Tailwind v4 PostCSS
└── tsconfig.json                # TypeScript strict mode
```

---

## 📊 Engenharia de Dados (Auditoria)

O sistema de auditoria utiliza PostgreSQL com tabelas otimizadas para rastreabilidade forense:

### Tabela `OTPS_RDS`
| Coluna | Tipo | Função |
|---|---|---|
| `USERNAME` | `VARCHAR` | Username de rede do colaborador |
| `CODE` | `VARCHAR(64)` | Hash SHA-256 do código OTP (nunca texto plano) |
| `EXPI_AT` | `BIGINT` | Timestamp Unix de expiração do código |

### Tabela `LOG_RDS`
| Coluna | Tipo | Função |
|---|---|---|
| `USUARIO` | `VARCHAR` | Username alvo da operação |
| `ACAO` | `VARCHAR` | Tipo de ação (`BUSCA_ORACLE`, `ENVIO_OTP`, `VALIDACAO_OTP`, `RESET_SENHA`) |
| `IP_ORIG` | `VARCHAR` | IP real do solicitante |
| `STATUS` | `VARCHAR` | Resultado (`SUCESSO`, `FALHA`, `BLOQUEADO`) |
| `DETALHES` | `TEXT` | Descrição detalhada + User-Agent truncado |

---

## ⚙️ Configuração de Ambiente

A operação do sistema depende de um arquivo `.env.local` rigorosamente configurado:

```env
# Oracle ERP (Thick Mode)
ORACLE_USER=usuario_oracle
ORACLE_PASSWORD=senha_oracle
ORACLE_CONNECT_STRING=host:port/service_name

# Active Directory (ADSI)
AD_LDAP_PATH=LDAP://IP_DO_DC/DC=dominio,DC=com,DC=br
AD_USER=usuario_de_servico
AD_PASSWORD=senha_do_usuario

# PostgreSQL (Auditoria)
DB_USER=postgres
DB_HOST=host_do_banco
DB_DATABASE=nome_do_banco
DB_PASSWORD=senha_do_banco
DB_PORT=5432

# Z-API (WhatsApp Gateway)
ZAPI_INSTANCE_ID=id_da_instancia
ZAPI_TOKEN=token_de_acesso
ZAPI_CLIENT_TOKEN=client_token
```

---

## 🛠 Instalação & Deployment

### Pré-requisitos
- Node.js 18+ com **Oracle Instant Client** instalado no sistema.
- Conectividade VPN com o Domain Controller e Oracle Database.
- Instância Z-API configurada com número WhatsApp corporativo.

### Ambiente de Desenvolvimento
```bash
npm install
npm run dev
```

### Build de Produção
```bash
npm run build
npm run start
```

### Deployment com PM2
```bash
pm2 start npm --name "reset-senha" -- start
pm2 save
```

---

## 👤 Autor & Arquiteto

**Christyan Silva**
