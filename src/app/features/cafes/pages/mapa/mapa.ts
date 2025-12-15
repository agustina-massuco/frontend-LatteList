import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import * as maplibregl from 'maplibre-gl';
import { CafeService } from '../../service/cafeService';
import Cafe from '../../model/CafeModel';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.html',
  styleUrls: ['./mapa.css'],
})
export class Mapa implements AfterViewInit,OnDestroy {
@ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  private map!: maplibregl.Map;
  private cafes: Cafe[] = [];
  private sub?: Subscription;

  constructor(private cafeService: CafeService,
    private router: Router) {}

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

  this.initMap(initialCenter);

  this.sub = this.cafeService.getAllCafes().subscribe({
    next: (data) => {
      this.cafes = data;

      this.addMarkers();
    },
    error: (err) => {
      console.error("Error cargando cafés:", err);
    }
  });
}


private addMarkers() :void{
  this.cafes.forEach(cafe => {
    if (cafe.latitud == null || cafe.longitud == null) return;

    const initial = cafe.nombre?.charAt(0).toUpperCase() ?? '?';

    const el = document.createElement('div');
    el.innerHTML = initial;

    el.style.width = '40px';
    el.style.height = '40px';
    el.style.borderRadius = '50%';
    el.style.background = 'linear-gradient(135deg, #8B4513 0%, #5C3317 100%)';
    el.style.color = '#FFF8DC';
    el.style.fontWeight = '700';
    el.style.fontSize = '20px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.border = '3px solid #3d2515';
    el.style.boxShadow = '0 2px 8px rgba(61, 37, 21, 0.5)';
    el.style.cursor = 'pointer';
    el.style.transition = 'transform 0.2s';

    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.15)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
    });

    const popupContent = this.createPopupContent(cafe);

    const popup = new maplibregl.Popup({ 
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      maxWidth: '320px'
    }).setHTML(popupContent);

    const marker = new maplibregl.Marker({ 
      element: el,
      anchor: 'center' 
    })
      .setLngLat([cafe.longitud, cafe.latitud])
      .setPopup(popup)
      .addTo(this.map);

    popup.on('open', () => {
const detailBtn = document.getElementById(`cafe-detail-${cafe.id}`);
      if (detailBtn) {
        detailBtn.addEventListener('click', () => this.navigateToCafeDetail(cafe.id));
      }
    });
  });
}

private createPopupContent(cafe: Cafe): string {
  const features = [];
  if (cafe.delivery) features.push('🚚 Delivery');
  if (cafe.takeaway) features.push('🥤 Para llevar');
  if (cafe.internet_access) features.push('📶 WiFi');
  if (cafe.outdoor_seating) features.push('🪑 Terraza');

  return `
    <div style="font-family: Arial, sans-serif; color: #3d2515;">
      <div style="background: linear-gradient(135deg, #8B4513 0%, #5C3317 100%);
                  padding: 12px; margin: -15px -15px 12px -15px; border-radius: 3px 3px 0 0;">
        <h3 style="margin: 0; color: #FFF8DC; font-size: 16px; font-weight: bold;">
          ☕ ${cafe.nombre}
        </h3>
      </div>

      <div style="padding: 0 4px;">
        ${cafe.direccion ? `<p style="margin: 8px 0; font-size: 13px;"><strong>📍</strong> ${cafe.direccion}</p>` : ''}
        ${cafe.telefono ? `<p style="margin: 8px 0; font-size: 13px;"><strong>📞</strong> ${cafe.telefono}</p>` : ''}
        ${cafe.openingHours ? `<p style="margin: 8px 0; font-size: 13px;"><strong>🕒</strong> ${cafe.openingHours}</p>` : ''}

        ${features.length > 0 ? `
          <div style="margin: 10px 0; padding: 8px; background: #FFF8DC; border-radius: 4px; font-size: 12px;">
            ${features.join(' • ')}
          </div>
        ` : ''}

        ${cafe.website ? `<p style="margin: 8px 0; font-size: 12px;">
            <a href="${cafe.website}" target="_blank" style="color: #8B4513;">🌐 Sitio web</a>
          </p>` : ''}

        <button 
          id="cafe-detail-${cafe.id}"
          style="
            width: 100%;
            margin-top: 12px;
            padding: 10px;
            background: linear-gradient(135deg, #D2691E 0%, #8B4513 100%);
            color: white;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
          "
        >
          Ver Detalles ➜
        </button>
      </div>
    </div>
  `;
}


private navigateToCafeDetail(cafeId?: number | string): void {
  this.router.navigate(['/cafes', cafeId]);
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
userMarkerEl.style.width = '24px';
userMarkerEl.style.height = '24px';
userMarkerEl.style.background = 'radial-gradient(circle, #1E90FF 0%, #0066ff 100%)';
userMarkerEl.style.borderRadius = '50%';
userMarkerEl.style.border = '3px solid white';
userMarkerEl.style.boxShadow = '0 0 0 4px rgba(30, 144, 255, 0.3), 0 2px 10px rgba(0,0,0,0.4)';
userMarkerEl.style.position = 'relative';
userMarkerEl.style.zIndex = '9999';

const userPopup = new maplibregl.Popup({ 
  offset: 25,
  closeButton: false 
}).setHTML(`
  <div style="text-align: center; font-family: Arial, sans-serif; color: #0066ff;">
    <strong style="font-size: 16px;">📍 Estás Aquí</strong>
    <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Tu ubicación actual</p>
  </div>
`);

new maplibregl.Marker({ element: userMarkerEl, anchor: 'center' })
  .setLngLat(center)
  .setPopup(userPopup)
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