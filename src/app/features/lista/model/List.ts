export default interface List {
    id: number;
    nombre: string;
    idUser?: number; 
    idCafes: number[];
    idCafesVisitados?: number[]; 
    fechaCreacion: string;
    cafeTotal?: number;
    cafeNamesPreview?: string; 
    publica: boolean;
    userNombre?: string;
}



