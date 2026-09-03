/**
 * Gera o payload do Pix estatico (BR Code, padrao EMV do Banco Central).
 * Cobranca sem integracao com gateway: o membro paga e a diretoria da a baixa manual.
 */

function campo(id: string, valor: string) {
  return `${id}${String(valor.length).padStart(2, "0")}${valor}`;
}

const DIACRITICOS = /[̀-ͯ]/g;
const NAO_ASCII = /[^ -~]/g;

function semAcento(texto: string) {
  return texto.normalize("NFD").replace(DIACRITICOS, "").replace(NAO_ASCII, "").trim();
}

/** CRC16-CCITT (polinomio 0x1021), exigido pelo padrao. */
function crc16(payload: string) {
  let resultado = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    resultado ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      resultado =
        resultado & 0x8000 ? ((resultado << 1) ^ 0x1021) & 0xffff : (resultado << 1) & 0xffff;
    }
  }
  return resultado.toString(16).toUpperCase().padStart(4, "0");
}

export type DadosPix = {
  chave: string;
  nomeRecebedor: string;
  cidade: string;
  valor?: number;
  identificador?: string;
};

export function gerarPayloadPix({
  chave,
  nomeRecebedor,
  cidade,
  valor,
  identificador,
}: DadosPix) {
  const merchant = campo("00", "BR.GOV.BCB.PIX") + campo("01", semAcento(chave).slice(0, 77));

  const txid =
    semAcento(identificador ?? "***")
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 25) || "***";

  const payloadSemCrc =
    campo("00", "01") +
    campo("26", merchant) +
    campo("52", "0000") +
    campo("53", "986") +
    (valor && valor > 0 ? campo("54", valor.toFixed(2)) : "") +
    campo("58", "BR") +
    campo("59", semAcento(nomeRecebedor).slice(0, 25).toUpperCase()) +
    campo("60", semAcento(cidade).slice(0, 15).toUpperCase()) +
    campo("62", campo("05", txid)) +
    "6304";

  return payloadSemCrc + crc16(payloadSemCrc);
}
