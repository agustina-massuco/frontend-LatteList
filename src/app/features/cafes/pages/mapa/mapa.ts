import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import * as maplibregl from 'maplibre-gl';
import { CafeService } from '../../service/cafeService';
import Cafe from '../../model/CafeModel';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.html',
  styleUrls: ['./mapa.css'],
  encapsulation: ViewEncapsulation.None // 🔧 Desactivar encapsulación para estilos dinámicos
})
export class Mapa implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  private map!: maplibregl.Map;
  private cafes: Cafe[] = [];
  private sub?: Subscription;

  constructor(private cafeService: CafeService, private router: Router) {}

  private getUserLocation(): Promise<[number, number]> {
    return new Promise((resolve) => {
      const MAR_DEL_PLATA_CENTER: [number, number] = [-57.5575, -38.0003];

      if (!navigator.geolocation) {
        resolve(MAR_DEL_PLATA_CENTER);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.error('Error geolocalización:', error);
          resolve(MAR_DEL_PLATA_CENTER);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    });
  }

  private addMarkers(): void {
    this.cafes.forEach((cafe) => {
      if (cafe.latitud == null || cafe.longitud == null) return;

      const el = document.createElement('div');
      el.className = 'cafe-marker';
      el.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M3.37892 10.2236L8 16L12.6211 10.2236C13.5137 9.10788 14 7.72154 14 6.29266V6C14 2.68629 11.3137 0 8 0C4.68629 0 2 2.68629 2 6V6.29266C2 7.72154 2.4863 9.10788 3.37892 10.2236ZM8 8C9.10457 8 10 7.10457 10 6C10 4.89543 9.10457 4 8 4C6.89543 4 6 4.89543 6 6C6 7.10457 6.89543 8 8 8Z" fill="#8B4513"/>
        </svg>
      `;

      const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div class="popup-content">
          <h3 class="popup-title">${cafe.nombre}</h3>
          <p class="popup-description">${cafe.direccion || 'Sin dirección disponible'}</p>
          <div class="popup-buttons">
            <button class="popup-btn popup-btn-primary" onclick="window.location.href='/cafes/${cafe.id}'">Conocer café</button>
          </div>
        </div>
      `);

      new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([cafe.longitud, cafe.latitud])
        .setPopup(popup)
        .addTo(this.map);
    });
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.mapContainer) return;

    const initialCenter = await this.getUserLocation();
    this.initMap(initialCenter);

    this.sub = this.cafeService.getAllCafes().subscribe({
      next: (data) => {
        this.cafes = data;
        this.addMarkers();
      },
      error: (err) => {
        console.error('Error cargando cafés:', err);
      },
    });
  }

  // Ajustar el marcador "¡Estás aquí!" para que sea un círculo fijo en la ubicación del usuario
  initMap(center: [number, number]) {
    const INITIAL_ZOOM = 15;

    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: center,
      zoom: INITIAL_ZOOM,
    });

    this.map.scrollZoom.disable();
    this.map.boxZoom.disable();
    this.map.doubleClickZoom.disable();
    this.map.touchZoomRotate.disable();
    this.map.dragRotate.disable();

    this.map.addControl(new maplibregl.NavigationControl());
    this.map.addControl(new maplibregl.FullscreenControl());

    // Crear marcador para "¡Estás aquí!" en la ubicación del usuario
    const userMarkerEl = document.createElement('div');
    userMarkerEl.className = 'user-location-marker'; // Usar clase CSS definida

    new maplibregl.Marker({ element: userMarkerEl, anchor: 'center' })
      .setLngLat(center) // Fijar el marcador en las coordenadas del usuario
      .addTo(this.map);

    this.map.on('load', () => {
      this.addMarkers(); // Asegurar que los marcadores de cafés se carguen
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    if (this.map) this.map.remove();
  }
}

/*import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import * as maplibregl from 'maplibre-gl';
import Cafe from '../../model/CafeModel';
import { CafeService } from '../../service/cafeService';


@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class Mapa implements AfterViewInit, OnDestroy {
@ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  private map!: maplibregl.Map;
  private cafes: Cafe[] = [];
  private sub?: Subscription;

  constructor(private cafeService: CafeService) {}

  private getUserLocation(): Promise<[number, number]> {
    return new Promise((resolve) => {

      const MAR_DEL_PLATA_CENTER: [number, number] = [-57.5575, -38.0003];

      if (!navigator.geolocation) {
        resolve(MAR_DEL_PLATA_CENTER);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([
            position.coords.longitude,
            position.coords.latitude,
          ]);
        },
        (error) => {
          console.error('Error geolocalización:', error);
          resolve(MAR_DEL_PLATA_CENTER);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    });
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.mapContainer) return;

    const initialCenter = await this.getUserLocation();
    console.log("Ubicación detectada:", initialCenter);

    this.sub = this.cafeService.getAllCafes().subscribe({
      next: (cafes) => {
        this.cafes = cafes;
        this.initMap(initialCenter);
      },
      error: (err) => {
        console.error('Error al cargar cafés:', err);
        this.initMap(initialCenter);
      }
    });
  }

private addMarkers() {
  this.cafes.forEach(cafe => {
    if (cafe.latitud == null || cafe.longitud == null) return;

    const initial = cafe.nombre?.charAt(0).toUpperCase() ?? '?';

    const el = document.createElement('div');
    el.innerHTML = initial;

    el.style.width = '36px';
    el.style.height = '36px';
    el.style.borderRadius = '50%';
    el.style.background = '#6B3E26';
    el.style.color = 'white';
    el.style.fontWeight = '700';
    el.style.fontSize = '20px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.border = '2px solid #3d2515';
    el.style.boxShadow = '0px 0px 4px rgba(0,0,0,0.35)';
    el.style.cursor = 'pointer';

    const popup = new maplibregl.Popup({ offset: 25 })
      .setHTML(`
        <strong>${cafe.nombre}</strong><br>
        ${cafe.direccion ?? ''}
      `);

    new maplibregl.Marker({ element: el,
      anchor: 'center' 
     })   // 👈 KEY FIX
      .setLngLat([cafe.longitud, cafe.latitud])
      .setPopup(popup)
      .addTo(this.map);
  });
}

  initMap(center: [number, number]) {
    const INITIAL_ZOOM = 15;

    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: center,
      zoom: INITIAL_ZOOM,
    });

    this.map.scrollZoom.disable();
this.map.boxZoom.disable();
this.map.doubleClickZoom.disable();
this.map.touchZoomRotate.disable();
this.map.dragRotate.disable();

    this.map.addControl(new maplibregl.NavigationControl());
    this.map.addControl(new maplibregl.FullscreenControl());

   const userMarkerEl = document.createElement('div');
userMarkerEl.style.width = '20px';
userMarkerEl.style.height = '20px';
userMarkerEl.style.background = '#0066ff';
userMarkerEl.style.borderRadius = '50%';
userMarkerEl.style.border = '2px solid white';
userMarkerEl.style.boxShadow = '0 0 10px rgba(0,0,0,0.4)';
userMarkerEl.style.position = 'relative';  // 👈 CLAVE
userMarkerEl.style.zIndex = '9999';         // 👈 para que se vea encima de capas

new maplibregl.Marker({ element: userMarkerEl, anchor: 'center' })
  .setLngLat(center)
  .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<strong>📍 Estás Aquí</strong>'))
  .addTo(this.map);


    this.map.on('load', () => {
      this.addMarkers();
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    if (this.map) this.map.remove();
  }
}

*/