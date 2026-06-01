// Matchers do Testing Library (toBeInTheDocument, etc.)
import '@testing-library/jest-dom';

// jsdom não define TextEncoder/TextDecoder, mas o viem (importado pela camada
// de contrato) usa no carregamento do módulo. Polyfill via util do Node.
import { TextEncoder, TextDecoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}
