type NamedService = { name: string };

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Encontra o serviço cadastrado que corresponde ao nome vindo do site público
 * (ex.: `/agendar?servico=Corte + barba`), ignorando acentos, caixa e pontuação.
 */
export function findServiceByName<T extends NamedService>(list: T[], name: string) {
  const target = normalizeName(name);
  if (!target) return undefined;
  return (
    list.find((item) => normalizeName(item.name) === target) ??
    list.find((item) => {
      const candidate = normalizeName(item.name);
      return candidate.length > 2 && (candidate.includes(target) || target.includes(candidate));
    })
  );
}
