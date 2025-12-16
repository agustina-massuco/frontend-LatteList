import { TipoReaccion } from "./LikeReview";


export default interface Review {
  id: number;
  puntuacion: number;
  comentario: string;
  fecha: string;

  userId: number;
  userNombre?: string;
  userApellido?:string;
  userFotoPerfil?:string;
  
  cafeId: number;
  etiquetas: string[];
  costoPromedio: 'BARATO' | 'MEDIO' | 'CARO' | null;
  estado: string;
  fotos: string[];

  likes: number;
  dislikes: number;
  reaccionUsuario: TipoReaccion | null;
}
