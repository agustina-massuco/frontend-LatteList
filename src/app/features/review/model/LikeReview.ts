export type TipoReaccion = 'LIKE' | 'DISLIKE' ;

export interface LikeReview {
  id: number;
  usuarioId: number; 
  reviewId: number;  
  tipo: TipoReaccion;
}