export default interface ReviewRequest { userId: number; 
  
  cafeId: number; 
  puntuacion: number;
   comentario: string; 
  costoPromedio: 'BARATO' | 'MEDIO' | 'CARO' | null;
   etiquetas: string[];
    fotos: string[]; }