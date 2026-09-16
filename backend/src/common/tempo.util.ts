/**
 * `Aula.horaInicio`/`horaFim` são armazenados em UTC "de mentira": os dígitos UTC representam a
 * hora de Brasília (ver horario.util.ts). Pra comparar com o instante real ("agora"), é preciso
 * converter o agora real pro mesmo esquema — pegar a hora de Brasília e representá-la como se
 * fosse UTC — nunca comparar `new Date()` direto com esses campos.
 */
export function agoraComoBrasiliaFake(agoraReal: Date = new Date()): Date {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(agoraReal);

  const valor = (tipo: string) =>
    Number(partes.find((p) => p.type === tipo)?.value ?? '0');

  return new Date(
    Date.UTC(
      valor('year'),
      valor('month') - 1,
      valor('day'),
      valor('hour') % 24,
      valor('minute'),
      valor('second'),
    ),
  );
}
