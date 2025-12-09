export default class Cafe {
  id?: string;           
  osmId?: number;         
  nombre!: string;
  direccion!: string;
  latitud!: number;
  longitud!: number;

  telefono?: string;
  email?: string;
  website?: string;
  cuisine?: string;         
  openingHours?: string;   
  takeaway?: boolean;
  delivery?: boolean;
  internet_access?: boolean;
  outdoor_seating?: boolean;


  constructor(init?: Partial<Cafe>) {
    Object.assign(this, init);
  }
}