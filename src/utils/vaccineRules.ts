export interface Vaccine {
  id: number;
  nome: string;
  doses_por_frasco: number;
  prazo_uso_horas: number;
  grupo_alvo: string;
  total_doses_esquema: number;
}

export interface Patient {
  id: number;
  nome: string;
  data_nascimento: string;
  sexo: 'M' | 'F';
  gravida: boolean;
  mulher_idade_fertil: boolean;
  puerpera: boolean;
  data_parto?: string;
  localidade?: string;
  contacto_responsavel?: string;
  numero_identificacao?: string;
  criado_em: string;
}

export interface Administration {
  id: number;
  paciente_id: number;
  vacina_id: number;
  frasco_id: number;
  numero_dose: number;
  data_administracao: string;
  responsavel: string;
  observacoes?: string;
  vacina_nome?: string;
}

export function calculateAge(birthDate: string): { years: number; months: number; days: number } {
  const birth = new Date(birthDate);
  const now = new Date();
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

export function getVaccineStatus(patient: Patient, vaccine: Vaccine, history: Administration[]) {
  const age = calculateAge(patient.data_nascimento);
  const totalMonths = age.years * 12 + age.months;
  const totalDays = totalMonths * 30 + age.days; // Rough estimate for days
  
  const dosesTaken = history.filter(h => h.vacina_id === vaccine.id).length;
  
  if (dosesTaken >= vaccine.total_doses_esquema) {
    return { status: 'complete', label: 'Completo' };
  }

  // BCG Rules
  if (vaccine.nome === 'BCG') {
    if (age.years >= 1) return { status: 'blocked', label: 'Bloqueado (>1 ano)' };
    return { status: dosesTaken === 0 ? 'due' : 'complete', label: dosesTaken === 0 ? 'Pendente' : 'Completo' };
  }

  // HepB0 and Polio 0
  if (vaccine.nome === 'HepB0' || vaccine.nome === 'Polio 0') {
    if (totalDays > 1) return { status: 'blocked', label: 'Bloqueado (>24h)' };
    return { status: dosesTaken === 0 ? 'due' : 'complete', label: dosesTaken === 0 ? 'Pendente' : 'Completo' };
  }

  // Rotavirus
  if (vaccine.nome.includes('Rotavirus')) {
    if (dosesTaken === 0 && totalMonths > 4) return { status: 'blocked', label: 'Bloqueado (>4 meses)' };
  }

  // Penta and Pneumo
  if (vaccine.nome.includes('Penta') || vaccine.nome.includes('Pneumo')) {
    if (dosesTaken === 0 && age.years >= 2) return { status: 'blocked', label: 'Bloqueado (>2 anos)' };
  }

  // HPV
  if (vaccine.nome === 'HPV') {
    if (patient.sexo !== 'F' || age.years < 9 || age.years > 12) return { status: 'blocked', label: 'Apenas meninas 9-12 anos' };
  }

  // Td for Gravidas
  if (vaccine.nome === 'Toxoide Td' && vaccine.grupo_alvo === 'gravida') {
    if (patient.puerpera) return { status: 'blocked', label: 'Bloqueado (Pós-parto)' };
  }

  // Vitamin A
  if (vaccine.nome === 'Vitamina A') {
    if (!patient.puerpera) return { status: 'blocked', label: 'Apenas Puérperas' };
    if (patient.data_parto) {
      const partumAge = calculateAge(patient.data_parto);
      const weeks = partumAge.years * 52 + partumAge.months * 4 + Math.floor(partumAge.days / 7);
      if (weeks > 8) return { status: 'blocked', label: 'Bloqueado (>8 semanas)' };
    }
  }

  // Default logic based on target group
  if (vaccine.grupo_alvo === 'crianca' && age.years >= 5) return { status: 'blocked', label: 'Bloqueado (>5 anos)' };

  return { status: 'due', label: 'Pendente' };
}
