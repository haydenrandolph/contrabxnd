/**
 * Minimal Bitcoin Script decoder — turns a scriptPubKey/scriptSig hex string
 * into human-readable ASM and classifies the standard output types. Used by the
 * `decode_script` MCP tool. Pure function, no node calls.
 */

// Opcodes we name explicitly; everything else is rendered as OP_<n> or push data.
const OPCODES: Record<number, string> = {
  0x00: 'OP_0',
  0x4c: 'OP_PUSHDATA1',
  0x4d: 'OP_PUSHDATA2',
  0x4e: 'OP_PUSHDATA4',
  0x4f: 'OP_1NEGATE',
  0x51: 'OP_1', 0x52: 'OP_2', 0x53: 'OP_3', 0x54: 'OP_4', 0x55: 'OP_5',
  0x56: 'OP_6', 0x57: 'OP_7', 0x58: 'OP_8', 0x59: 'OP_9', 0x5a: 'OP_10',
  0x5b: 'OP_11', 0x5c: 'OP_12', 0x5d: 'OP_13', 0x5e: 'OP_14', 0x5f: 'OP_15', 0x60: 'OP_16',
  0x61: 'OP_NOP', 0x63: 'OP_IF', 0x64: 'OP_NOTIF', 0x67: 'OP_ELSE', 0x68: 'OP_ENDIF',
  0x69: 'OP_VERIFY', 0x6a: 'OP_RETURN',
  0x76: 'OP_DUP', 0x87: 'OP_EQUAL', 0x88: 'OP_EQUALVERIFY',
  0xa9: 'OP_HASH160', 0xaa: 'OP_HASH256',
  0xac: 'OP_CHECKSIG', 0xad: 'OP_CHECKSIGVERIFY', 0xae: 'OP_CHECKMULTISIG', 0xaf: 'OP_CHECKMULTISIGVERIFY',
  0xb1: 'OP_CHECKLOCKTIMEVERIFY', 0xb2: 'OP_CHECKSEQUENCEVERIFY',
  0xba: 'OP_CHECKSIGADD',
};

export interface DecodedScript {
  hex: string;
  asm: string;
  type: string;
  description: string;
}

function classify(bytes: number[], asm: string): { type: string; description: string } {
  const n = bytes.length;
  const b = bytes;
  // P2PKH: OP_DUP OP_HASH160 <20> OP_EQUALVERIFY OP_CHECKSIG
  if (n === 25 && b[0] === 0x76 && b[1] === 0xa9 && b[2] === 0x14 && b[23] === 0x88 && b[24] === 0xac)
    return { type: 'p2pkh', description: 'Pay-to-Public-Key-Hash — a standard legacy "1..." address. Spendable by the holder of the key whose hash160 is embedded.' };
  // P2SH: OP_HASH160 <20> OP_EQUAL
  if (n === 23 && b[0] === 0xa9 && b[1] === 0x14 && b[22] === 0x87)
    return { type: 'p2sh', description: 'Pay-to-Script-Hash — a "3..." address. Locks funds to the hash of a redeem script revealed at spend time (multisig, wrapped SegWit, etc.).' };
  // P2WPKH: OP_0 <20>
  if (n === 22 && b[0] === 0x00 && b[1] === 0x14)
    return { type: 'v0_p2wpkh', description: 'Native SegWit v0 Pay-to-Witness-Public-Key-Hash — a "bc1q..." address (20-byte program). Cheaper to spend than legacy.' };
  // P2WSH: OP_0 <32>
  if (n === 34 && b[0] === 0x00 && b[1] === 0x20)
    return { type: 'v0_p2wsh', description: 'Native SegWit v0 Pay-to-Witness-Script-Hash — a "bc1q..." address (32-byte program) committing to a witness script.' };
  // P2TR: OP_1 <32>
  if (n === 34 && b[0] === 0x51 && b[1] === 0x20)
    return { type: 'v1_p2tr', description: 'Taproot (SegWit v1) — a "bc1p..." address. Holds a 32-byte x-only key supporting key-path and script-path spends.' };
  // P2PK: <33|65> OP_CHECKSIG
  if ((n === 35 || n === 67) && (b[0] === 0x21 || b[0] === 0x41) && b[n - 1] === 0xac)
    return { type: 'p2pk', description: 'Pay-to-Public-Key — pays directly to a raw public key. Common in very early coinbase outputs.' };
  // OP_RETURN data carrier
  if (b[0] === 0x6a)
    return { type: 'op_return', description: 'OP_RETURN data output — provably unspendable, used to embed arbitrary data on-chain. Carries no value.' };
  // Bare multisig: OP_m ... OP_n OP_CHECKMULTISIG
  if (b[n - 1] === 0xae && b[0] >= 0x51 && b[0] <= 0x60)
    return { type: 'multisig', description: `Bare ${b[0] - 0x50}-of-${b[n - 2] - 0x50} multisig — requires multiple signatures to spend.` };
  return { type: 'nonstandard', description: 'Non-standard or custom script. ASM is shown above for manual inspection.' };
}

export function decodeScript(hexInput: string): DecodedScript | null {
  const hex = hexInput.trim().toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]*$/.test(hex) || hex.length === 0 || hex.length % 2 !== 0) return null;

  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));

  const parts: string[] = [];
  let i = 0;
  while (i < bytes.length) {
    const op = bytes[i++];
    if (op >= 0x01 && op <= 0x4b) {
      // direct push of `op` bytes
      const data = hex.slice(i * 2, (i + op) * 2);
      parts.push(`OP_PUSHBYTES_${op} ${data}`);
      i += op;
    } else if (op === 0x4c || op === 0x4d || op === 0x4e) {
      const lenBytes = op === 0x4c ? 1 : op === 0x4d ? 2 : 4;
      let len = 0;
      for (let k = 0; k < lenBytes; k++) len |= bytes[i + k] << (8 * k); // little-endian
      i += lenBytes;
      const data = hex.slice(i * 2, (i + len) * 2);
      parts.push(`${OPCODES[op]} ${data}`);
      i += len;
    } else {
      parts.push(OPCODES[op] ?? `OP_UNKNOWN(0x${op.toString(16)})`);
    }
  }

  const asm = parts.join(' ');
  const { type, description } = classify(bytes, asm);
  return { hex, asm, type, description };
}
