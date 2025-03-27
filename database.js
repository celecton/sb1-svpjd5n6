import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function createUser(user) {
  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select();

  if (error) throw error;
  return data[0];
}

export async function findUserByCPF(cpf) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('cpf', cpf)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

export async function findCompanyByCNPJ(cnpj) {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('cnpj', cnpj)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error finding company:', error);
    return null;
  }
}

export async function createCompany(company) {
  const { data, error } = await supabase
    .from('companies')
    .insert([company])
    .select();

  if (error) throw error;
  return data[0];
}

export async function createNota(nota) {
  try {
    const { data, error } = await supabase
      .from('notas')
      .insert([{
        cnpj: nota.cnpj,
        nomeEmpresa: nota.nomeEmpresa,
        empresaDestino: nota.empresaDestino,
        numeroNota: nota.numeroNota,
        perecivel: nota.perecivel,
        observacao: nota.observacao,
        cpf: nota.cpf,
        status: 'Em Aberto - Motorista',
        timestampCadastro: new Date().toISOString(),
        fotos: nota.fotosBase64
      }])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating nota:', error);
    throw error;
  }
}

export async function updateNota(id, updates) {
  // Se estamos atualizando as fotos, garantimos que elas sejam salvas no campo correto
  const updatedData = { ...updates };
  
  if (updates.fotos) {
    updatedData.fotos = updates.fotos;
    delete updatedData.fotosBase64; // Remover para evitar duplicação
  }
  
  const { error } = await supabase
    .from('notas')
    .update(updatedData)
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function rejectNota(id, cpdCPF, observacao) {
  const { error } = await supabase
    .from('notas')
    .update({
      status: 'Rejeitada - CPD',
      cpdResponsavelCPF: cpdCPF,
      observacaoCPD: observacao,
      timestampRejeicao: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function getNota(id) {
  const { data, error } = await supabase
    .from('notas')
    .select(`
      *,
      motorista:cpf(nome, telefone),
      cpd:cpdResponsavelCPF(nome),
      conferente:finalizadaPorCPF(nome)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  return {
    ...data,
    fotosBase64: data.fotos
  };
}

export async function getAllNotas() {
  const { data, error } = await supabase
    .from('notas')
    .select(`
      *,
      motorista:cpf(nome, telefone),
      cpd:cpdResponsavelCPF(nome),
      conferente:finalizadaPorCPF(nome)
    `)
    .order('timestampCadastro', { ascending: false });

  if (error) throw error;

  return data.map(nota => ({
    ...nota,
    fotosBase64: nota.fotos
  }));
}

export async function getNotasByStatus(status) {
  const { data, error } = await supabase
    .from('notas')
    .select(`
      *,
      motorista:cpf(nome, telefone),
      cpd:cpdResponsavelCPF(nome),
      conferente:finalizadaPorCPF(nome)
    `)
    .eq('status', status)
    .order('timestampCadastro', { ascending: false });

  if (error) throw error;

  return data.map(nota => ({
    ...nota,
    fotosBase64: nota.fotos
  }));
}

export async function prioritizeNotasPereciveis() {
  const { data: notas, error } = await supabase
    .from('notas')
    .select('*')
    .order('perecivel', { ascending: false })
    .order('timestampCadastro', { ascending: true });

  if (error) throw error;
  return notas;
}