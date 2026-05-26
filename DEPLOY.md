# Guia de Deploy no Render com MongoDB Atlas 🚀

Este guia detalha o passo a passo completo para colocar a sua plataforma **EventFlow (eventos-saas)** no ar usando o **Render** e o **MongoDB Atlas** (banco de dados em nuvem gratuito).

---

## Passo 1: Criar o Banco de Dados Gratuito no MongoDB Atlas

1. Acesse [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas) e crie uma conta gratuita.
2. Crie um novo projeto e clique em **Create a Deployment**.
3. Selecione a opção **M0** (Cluster gratuito / Shared).
4. Escolha o provedor de nuvem (AWS ou Google Cloud) e a região mais próxima de você (ex: `us-east-1` ou `sa-east-1` em São Paulo).
5. Defina um **usuário** e **senha** para o banco de dados. *Guarde bem essa senha!*
6. Na aba **Network Access**, adicione uma regra de IP: selecione **Allow Access from Anywhere** (`0.0.0.0/0`) para permitir que o Render se conecte ao seu banco.
7. Vá em **Database** -> **Connect** -> Escolha **Drivers** (Node.js).
8. Copie a sua **String de Conexão** (Connection String). Ela será parecida com esta:
   ```text
   mongodb+srv://<usuario>:<senha>@cluster0.xxxx.mongodb.net/eventflow?retryWrites=true&w=majority
   ```
   *Substitua `<usuario>` e `<senha>` com os dados que você criou no item 5.*

---

## Passo 2: Criar e Configurar o Serviço no Render

1. Acesse [render.com](https://render.com) e conecte com sua conta do GitHub.
2. Clique no botão **New +** no canto superior direito e selecione **Web Service**.
3. Conecte o repositório do GitHub onde o código do seu projeto está localizado.
4. Preencha as configurações principais:
   - **Name**: `eventos-saas` (ou o nome que preferir)
   - **Language**: `Node`
   - **Branch**: `main` (ou a branch que você usa para deploy)
   - **Root Directory**: Deixe em branco se o repositório já contiver o projeto diretamente na raiz, ou preencha com a pasta correspondente.
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: **Free**

---

## Passo 3: Cadastrar as Variáveis de Ambiente no Render

No menu lateral esquerdo do seu serviço no Render, clique em **Environment** e adicione as seguintes variáveis clicando em **Add Environment Variable**:

| Key | Value | Descrição |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://...` | A string de conexão obtida no Passo 1. |
| `JWT_SECRET` | `uma_chave_secreta_longa_e_segura` | Qualquer frase ou código longo para criptografar as sessões. |
| `NEXT_PUBLIC_APP_URL` | `https://sua-url.onrender.com` | A URL pública que o Render te der para o projeto (exibida no topo da página do Render). |

*Nota: Não é necessário cadastrar variáveis do Supabase, pois o sistema detectará automaticamente o `MONGODB_URI` e priorizará o MongoDB!*

---

## Passo 4: Concluir e Acompanhar o Deploy

1. Clique em **Save Changes** na página de Environment.
2. O Render iniciará a compilação do seu projeto automaticamente.
3. Acompanhe os logs em **Logs**.
4. Assim que a build terminar, você verá a mensagem: `Running next start...` e depois `[MongoDB] Conectado ao banco de dados com sucesso!`.
5. Pronto! O link da sua plataforma estará disponível no topo do painel do Render (ex: `https://eventos-saas.onrender.com`).

---

### Dica Premium de Performance 💡
Como você está usando o plano gratuito do Render, o servidor entra em modo de suspensão (*sleep*) após 15 minutos de inatividade. Quando um usuário acessar o site após esse tempo, a primeira requisição demorará cerca de 30-50 segundos para carregar o servidor. 
*Isso é um comportamento normal do plano gratuito. Nos acessos seguintes, a velocidade será instantânea.*
