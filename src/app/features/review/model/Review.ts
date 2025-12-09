export type EstadoReview = 'ACTIVO' | 'INACTIVO' | 'ELIMINADO';


export default interface Review {
    id: string, 
    puntuacion: number,
    comentario: string, 
    fecha?: string, 
    userId: string, 
    cafeId: string, 
    etiquetas: string[],
    costoPromedio: string,
    estado: EstadoReview,
    fotos?: string[]; 
}