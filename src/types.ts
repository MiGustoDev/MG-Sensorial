export interface SensorialFormAnswers {
  // Encabezado
  fecha: string;
  hora: string;
  evaluador: string;
  loteBatea: string;
  gusto: string;
  codigoMuestra?: string;

  // 1. VISTA - empanada cortada al medio
  v1_color: 'Sí' | 'Más claro' | 'Más oscuro' | '';
  v2_cantidad: 'Poco' | 'Justo' | 'Mucho' | '';
  v3_mezclado: 'Parejo' | 'Desparejo' | 'Sin mezclar' | '';
  v4_ingredientesReceta: 'Sí' | 'Falta alguno' | '';
  v5_ingredienteExtrano: 'No' | 'Sí' | '';
  v6_selladoCarne: 'Gris o hervida' | 'Dorada y jugosa' | 'Seca o quemada' | 'N/A' | '';
  v7_rehogadoVegetales: 'Crudos' | 'Justo' | 'Quemados' | 'N/A' | '';
  v8_caramelizacion: 'Poca' | 'Justa' | 'Excesiva' | 'N/A' | '';
  obs_vista?: string;

  // 2. OLFATO - relleno recién cortado
  o1_intensidadAroma: 'Débil' | 'Justa' | 'Fuerte' | '';
  o2_aromaCaracteristico: 'Sí' | 'Poco' | 'No' | '';
  o3_olorExtrano: Array<'No' | 'Quemado' | 'Rancio' | 'Aceite viejo' | 'Ácido' | 'Otro'>;
  obs_olfato?: string;

  // 3. BOCA - primer bocado, masa y relleno juntos
  b1_primerImpacto: Array<'Masa' | 'Carne / proteína' | 'Queso' | 'Cebolla' | 'Especias' | 'Picante' | 'Sal' | 'Dulce' | 'Grasa'>;
  b2_texturaMasa: 'Cruda' | 'Tierna' | 'Crocante' | 'Dura' | '';
  b3_jugosidadRelleno: 'Seco' | 'Jugoso' | 'Muy húmedo' | '';
  b4_texturaCarne: 'Tierna' | 'Dura' | 'Fibrosa' | 'N/A' | '';
  b5_sal: 'Poca' | 'Justa' | 'Mucha' | '';
  b6_dulce: 'Poco' | 'Justo' | 'Mucho' | '';
  b7_picante: 'Poco' | 'Justo' | 'Mucho' | 'No debería picar' | '';
  b8_saborCaracteristico: 'Débil' | 'Justo' | 'Intenso' | '';
  b9_ingredienteTapa: 'No' | 'Sí' | '';
  b10_saborExtrano: Array<'No' | 'Quemado' | 'Rancio' | 'Aceite viejo' | 'Ácido' | 'Otro'>;
  b11_retrogusto: 'Agradable' | 'Neutro' | 'Desagradable' | '';
  obs_boca?: string;

  // 4. EVALUACIÓN GLOBAL
  g1_estandarGusto: 'Igual' | 'Leve diferencia' | 'Muy diferente' | '';
  g2_gustoGeneral: number; // 1 a 5
  g3_aprobacion: 'Sí' | 'Sí con observaciones' | 'No' | '';
  obs_global?: string;

  // Firma / Evidencia
  firmaEvaluador?: string; // Firma dibujada en canvas o nombre formal
  fotos?: string[];
}

export interface SensorialEvaluationRecord extends SensorialFormAnswers {
  id?: string;
  created_at?: string;
  saved_by_email?: string;
}

export const EMPANADAS_GUSTOS = [
  'American Chicken',
  'Big Burger',
  'Doble Bacon Cheese Burger',
  'La Sagrada',
  'Matambre a la Pizza',
  'Mexican Pibil Pork',
  'Vacío y Provoleta',
  'Carne al Cuchillo',
  'Carne con Aceituna',
  'Carne Picante',
  'Carne Suave',
  'Choclo',
  'Cuatro Quesos',
  'Jamón y Queso',
  'Jamón, Huevo y Queso',
  'Pollo',
  'Pollo al Champignon',
  'Queso y Cebolla',
  'Roquefort con Jamón',
  'Verdura'
];
