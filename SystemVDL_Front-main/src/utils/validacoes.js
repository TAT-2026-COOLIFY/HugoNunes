// ==================== Validações simples (sem API) ====================

export const somenteNumeros = (valor) => (valor || "").replace(/\D/g, "");

// ---------- CPF / CNPJ ----------

export function validarCpf(valor) {
    const cpf = somenteNumeros(valor);
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false; // 111.111.111-11, 000..., etc.

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
    let dv1 = (soma * 10) % 11;
    if (dv1 === 10) dv1 = 0;
    if (dv1 !== Number(cpf[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
    let dv2 = (soma * 10) % 11;
    if (dv2 === 10) dv2 = 0;
    return dv2 === Number(cpf[10]);
}

export function validarCnpj(valor) {
    const cnpj = somenteNumeros(valor);
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpj)) return false; // 11.111.111/1111-11, etc.

    const calcularDv = (base, pesos) => {
        const soma = base.split("").reduce((acc, n, i) => acc + Number(n) * pesos[i], 0);
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };

    const dv1 = calcularDv(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const dv2 = calcularDv(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return dv1 === Number(cnpj[12]) && dv2 === Number(cnpj[13]);
}

/** Retorna a mensagem de erro, ou "" se estiver válido. */
export function erroCpfCnpj(valor) {
    const doc = somenteNumeros(valor);
    if (!doc) return "Informe o CPF ou CNPJ";
    if (doc.length <= 11) {
        if (doc.length < 11) return "CPF incompleto (11 números)";
        return validarCpf(doc) ? "" : "CPF inválido";
    }
    if (doc.length < 14) return "CNPJ incompleto (14 números)";
    return validarCnpj(doc) ? "" : "CNPJ inválido";
}

// ---------- E-mail ----------

/** Aceita nome@dominio.com, nome@dominio.com.br, etc. Vazio é permitido. */
export function erroEmail(valor) {
    const email = (valor || "").trim();
    if (!email) return "";
    const ok = /^[^\s@]+@[^\s@]+\.[a-z]{2,}(\.[a-z]{2,})?$/i.test(email);
    return ok ? "" : "E-mail inválido (ex: nome@gmail.com)";
}

// ---------- CEP ----------

export function formatarCep(valor) {
    const cep = somenteNumeros(valor).slice(0, 8);
    return cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}

export function erroCep(valor) {
    const cep = somenteNumeros(valor);
    if (!cep) return "";
    return cep.length === 8 ? "" : "CEP incompleto (8 números)";
}

/**
 * Busca o endereço pelo CEP no ViaCEP (gratuito, sem cadastro e sem chave).
 * Retorna { rua, bairro, municipio, uf } ou null se o CEP não existir / der erro.
 */
export async function buscarEnderecoPorCep(valor) {
    const cep = somenteNumeros(valor);
    if (cep.length !== 8) return null;
    try {
        const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!resp.ok) return null;
        const dados = await resp.json();
        if (dados.erro) return null;
        return {
            rua: dados.logradouro || "",
            bairro: dados.bairro || "",
            municipio: dados.localidade || "",
            uf: dados.uf || "",
        };
    } catch {
        return null; // sem internet ou ViaCEP fora do ar: o usuário digita na mão
    }
}

// ---------- CNPJ -> endereço ----------

// "RUA JOSE BOMQUEMBIZO" -> "Rua Jose Bomquembizo"
const capitalizar = (txt) =>
    (txt || "").toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase()).replace(/\s(De|Da|Do|Das|Dos|E)\s/g, (m) => m.toLowerCase());

/**
 * Organiza os dados que vêm do backend (/consulta-cnpj) para o formulário.
 * Retorna { rua, bairro, cep, municipio, uf, email, inscricaoEstadual }.
 */
export function formatarDadosCnpj(d) {
    if (!d) return null;
    const tipo = d.tipoLogradouro ? `${d.tipoLogradouro} ` : "";
    let rua = capitalizar(`${tipo}${d.logradouro || ""}`.trim());
    // O cadastro ainda não tem campo "número": por enquanto ele vai junto da rua
    if (rua && d.numero && d.numero.toUpperCase() !== "S/N") rua = `${rua}, ${d.numero}`;

    return {
        rua,
        bairro: capitalizar(d.bairro),
        cep: formatarCep(d.cep),
        municipio: capitalizar(d.municipio),
        uf: d.uf || "",
        email: (d.email || "").toLowerCase(),
        inscricaoEstadual: somenteNumeros(d.inscricaoEstadual),
    };
}