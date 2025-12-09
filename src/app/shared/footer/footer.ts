import { Component } from '@angular/core';



/** Define la estructura de cada columna del footer. */
interface FooterColumn {
  title: string;
  items: string[];
}

interface SocialLink {
  icon: string;
  url: string;
  name: string;
}
interface ContactInfo {
  company: string;
  address: string;
  phone: string;
  email: string;
}

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})

export class Footer {
  columns: FooterColumn[] = [
    {
      title: '¿QUÉ HACEMOS?',
      items: [
        'Recomendamos cafes!',
        'Ayudamos a la comunidad barista',
        'Mejoramos tu experiencia gastronomica',
        'Creamos tus listas personalizadas'
      ]
    }
    // Puedes añadir más objetos de columna aquí
  ];

  /** Datos para la sección de redes sociales (usado con @if (socialLinks.length > 0)) */
  socialLinks: SocialLink[] = [
    { icon: '𝕏', url: 'https://twitter.com', name: 'Twitter' },
    { icon: 'G+', url: 'https://plus.google.com', name: 'Google Plus' },
    { icon: 'in', url: 'https://www.linkedin.com/in/cecilia-novelli-93a4bb247', name: 'LinkedIn' },
    { icon: 'in', url: 'https://www.linkedin.com/in/agustina-massuco/', name: 'LinkedIn' }

  ];

  /** Datos para la sección de contacto (usado con @if (contactInfo)) */
  contactInfo: ContactInfo = {
    company: 'Caffe List',
    address: 'Av. Dorrego 281, Mar del Plata, Buenos Aires, Argentina',
    phone: '(0223) 480-5049',
    email: 'consultoria@caffeList.com'
  };
}