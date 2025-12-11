export default interface List {
    id: number, 
    nombre: string,
    idUser: string,
    idCafes: string[],
    fechaCreacion?: string; 
    idCafesVisitados?: string[];
}