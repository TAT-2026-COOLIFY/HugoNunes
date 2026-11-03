# Robô de avisos por WhatsApp — SystemVDL

O sistema agora manda mensagem automática pro cliente em 3 momentos:

1. **Orçamento aprovado** → quando você clica em "Aprovar" no orçamento.
2. **Pedido em produção** → quando a Ordem de Serviço é gerada a partir da Ordem de Compra.
3. **Pronto para retirada** → quando você clica em "Concluir Produção" (endpoint `/ordemServicos/concluirProducao`).

As mensagens são enviadas em background (não travam a tela nem a API caso o
WhatsApp esteja fora do ar — se falhar, só fica registrado no log).

## Como funciona por baixo dos panos

Usamos a **Evolution API** (open-source, grátis, roda local no seu computador/servidor
via Docker) para controlar um número de WhatsApp normal (o número da loja) e mandar
mensagens automaticamente. Não precisa de conta paga nem de aprovação do Meta.

## Passo a passo para colocar pra rodar

### 1. Suba a Evolution API

Na raiz do projeto (`SystemVDL/`), rode:

```bash
docker compose -f docker-compose.whatsapp.yml up -d
```

Isso vai baixar a imagem e subir a Evolution API na porta **8081** (o backend do
SystemVDL continua na 8080, sem conflito).

> Se ainda não tem Docker instalado, baixe em https://docs.docker.com/get-docker/

### 2. Crie a instância e escaneie o QR Code

1. Abra `http://localhost:8081/manager` no navegador.
2. Faça login com a API Key (por padrão `troque-esta-chave` — troque isso!).
3. Crie uma instância chamada **vdl** (tem que ser exatamente esse nome, ou você
   ajusta em `application.properties`).
4. Escaneie o QR Code com o WhatsApp da loja (Configurações → Aparelhos conectados
   → Conectar um aparelho).

Pronto — a partir daqui esse WhatsApp vira o "robô" que manda os avisos.

### 3. Configure a chave no backend

No arquivo `src/main/resources/application.properties`, ajuste (se tiver mudado
algo no passo 1 ou 2):

```properties
evolution.api.url=http://localhost:8081
evolution.api.key=troque-esta-chave
evolution.api.instance=vdl
```

**Importante:** troque `troque-esta-chave` tanto no `docker-compose.whatsapp.yml`
quanto no `application.properties` — precisa ser a mesma chave nos dois lugares,
e não use a chave de exemplo em produção.

### 4. Rode o backend normalmente

```bash
./mvnw spring-boot:run
```

Pronto! Agora, ao aprovar um orçamento, gerar uma OS ou concluir a produção,
o cliente recebe a mensagem automaticamente no WhatsApp cadastrado.

## Desligar temporariamente sem remover o código

Se precisar desligar o envio de mensagens (ex: WhatsApp desconectado, testes),
basta mudar no `application.properties`:

```properties
evolution.api.enabled=false
```

## Personalizando o texto das mensagens

Os textos ficam em `src/main/java/com/vdl/system/services/WhatsAppService.java`,
nos métodos `notificarOrcamentoAprovado`, `notificarPedidoEmProducao` e
`notificarPedidoProntoParaRetirada`.

## Observação sobre "concluir item único"

Quando um pedido tem vários itens (várias caixas diferentes no mesmo orçamento),
o aviso de "pronto para retirada" é enviado **uma única vez**, quando o pedido
inteiro é concluído via `/ordemServicos/concluirProducao` — e não a cada item
individual concluído (`concluirItem/{id}`), pra não mandar várias mensagens
picadas pro mesmo cliente.
