// Validação de endereço Ethereum no formato 0x + 40 hexadecimais (TRIAX-5).
// Não checa checksum EIP-55 — só o formato. Aceita maiúsculas e minúsculas.

const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export function isValidEthereumAddress(value: string | null | undefined): boolean {
  if (typeof value !== 'string') return false;
  return ETH_ADDRESS_RE.test(value);
}
