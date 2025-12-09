export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'DESACTIVADO' | 'ELIMINADO';


export default interface LoginResponseJava {
  token: string,
  id: number,
  nombre: string,
  apellido: string,
  email: string,
  tipoDeUsuario: string,
  fotoPerfil?: string,
  estado: EstadoUsuario
}