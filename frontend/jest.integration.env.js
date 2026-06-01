// Ambiente de teste: jsdom (para renderizar React) + globais de rede do Node
// (fetch/Headers/Request/Response, TextEncoder/TextDecoder, etc.), que o jsdom
// do jest não expõe mas o viem precisa para falar com a rede Hardhat.
//
// O arquivo do environment roda no processo Node principal, então as globais
// do Node 20 estão disponíveis aqui e podem ser copiadas para o global do jsdom.
const JSDOMEnvironment = require('jest-environment-jsdom').default;

class IntegrationEnvironment extends JSDOMEnvironment {
  async setup() {
    await super.setup();
    const g = this.global;
    const { TextEncoder, TextDecoder } = require('util');

    g.TextEncoder ??= TextEncoder;
    g.TextDecoder ??= TextDecoder;
    g.structuredClone ??= structuredClone;

    // Conjunto de rede do Node: precisa vir TODO do mesmo realm, senão o
    // fetch do Node rejeita o AbortSignal criado pelo AbortController do jsdom
    // ("Expected signal to be an instance of AbortSignal"). Por isso sobrescreve
    // (não ??=) os globais que o jsdom já define.
    g.fetch = fetch;
    g.Headers = Headers;
    g.Request = Request;
    g.Response = Response;
    g.AbortController = AbortController;
    g.AbortSignal = AbortSignal;
    g.ReadableStream = ReadableStream;
  }
}

module.exports = IntegrationEnvironment;
