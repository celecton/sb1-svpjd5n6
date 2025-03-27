import { openDB } from './db.js';

const dbPromise = openDB('bolt-database', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('notas')) {
      const notasStore = db.createObjectStore('notas', { keyPath: 'id' });
      notasStore.createIndex('status', 'status');
      notasStore.createIndex('perecivel', 'perecivel');
    }
    if (!db.objectStoreNames.contains('users')) {
      const usersStore = db.createObjectStore('users', { keyPath: 'cpf' });
      usersStore.createIndex('funcao', 'funcao');
    }
  }
});

export async function getAllNotas() {
  const db = await dbPromise;
  return db.getAll('notas');
}

export async function getNota(id) {
  const db = await dbPromise;
  return db.get('notas', id);
}

export async function updateNota(id, updates) {
  const db = await dbPromise;
  const nota = await getNota(id);
  const updatedNota = { ...nota, ...updates };
  await db.put('notas', updatedNota);
  return updatedNota;
}

export async function rejectNota(id, cpdResponsavelCPF, observacao) {
  return updateNota(id, {
    status: 'Rejeitada - CPD',
    cpdResponsavelCPF,
    observacaoCPD: observacao
  });
}

export async function findUserByCPF(cpf) {
  const db = await dbPromise;
  return db.get('users', cpf);
}

export async function getNotasByStatus(status) {
  const db = await dbPromise;
  const tx = db.transaction('notas', 'readonly');
  const index = tx.store.index('status');
  return index.getAll(status);
}

export async function prioritizeNotasPereciveis() {
  const db = await dbPromise;
  const notas = await db.getAll('notas');
  notas.sort((a, b) => {
    if (a.perecivel === 'Sim' && b.perecivel !== 'Sim') return -1;
    if (a.perecivel !== 'Sim' && b.perecivel === 'Sim') return 1;
    return 0;
  });
  return notas;
}