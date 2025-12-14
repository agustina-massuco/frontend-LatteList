export default interface List {
    id: number, 
    nombre: string,
    idUser: string,
    idCafes: number[],
    fechaCreacion: string; 
    idCafesVisitados?: string[];
    cafeTotal?: number; 
    cafeNombres?: string; 
}

