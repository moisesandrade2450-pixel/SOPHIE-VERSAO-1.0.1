// Este arquivo mostra como expandir para 12 salas

export const SALAS_12 = [
  // Turmas do Ensino Fundamental
  { id: 'sala1', nome: 'Sala 1 - Matemática', andar: 1, bloco: 'A' },
  { id: 'sala2', nome: 'Sala 2 - Português', andar: 1, bloco: 'A' },
  { id: 'sala3', nome: 'Sala 3 - Inglês', andar: 1, bloco: 'B' },
  { id: 'sala4', nome: 'Sala 4 - Ciências', andar: 2, bloco: 'A' },
  { id: 'sala5', nome: 'Sala 5 - História', andar: 2, bloco: 'B' },
  { id: 'sala6', nome: 'Sala 6 - Geografia', andar: 2, bloco: 'C' },
  
  // Turmas do Ensino Médio
  { id: 'sala7', nome: 'Sala 7 - Física', andar: 3, bloco: 'A' },
  { id: 'sala8', nome: 'Sala 8 - Química', andar: 3, bloco: 'B' },
  { id: 'sala9', nome: 'Sala 9 - Biologia', andar: 3, bloco: 'C' },
  { id: 'sala10', nome: 'Sala 10 - Filosofia', andar: 4, bloco: 'A' },
  { id: 'sala11', nome: 'Sala 11 - Sociologia', andar: 4, bloco: 'B' },
  { id: 'sala12', nome: 'Sala 12 - Educação Física', andar: 4, bloco: 'C' },
];

/*
Para usar 12 salas ao invés de 3, siga estes passos:

1. Em constants.js, troque:
   export const SALAS = SALAS_12;

2. Em LoginScreen.js, atualize o salaGrid para mostrar mais salas:
   - Considere usar ScrollView ou grid maior
   - Ou criar um modal de seleção para melhor UX

3. Adicione cores diferentes para cada sala se desejar:
   const CORES_SALAS = {
     sala1: '#9C27B0',
     sala2: '#BA68C8',
     // ... etc
   }

4. Teste o funcionamento com múltiplas salas
*/
