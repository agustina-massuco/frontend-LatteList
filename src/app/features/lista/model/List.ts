export default interface List {
    id: string, 
    nombre: string,
    idUser: string,
    idCafes: string[],
    fechaCreacion?: string; 
    idCafesVisitados?: string[];
}