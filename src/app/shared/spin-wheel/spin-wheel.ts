import { Component, Input, Output, EventEmitter } from '@angular/core';

interface Cafe {
  id: string;
  nombre: string;
}

interface WheelSlice {
  cafe: Cafe;
  color: string;
  startAngle: number;
  endAngle: number;
}

@Component({
  selector: 'app-spin-wheel',
  templateUrl: './spin-wheel.html',
  styleUrls: ['./spin-wheel.css']
})
export class SpinWheelComponent {
  @Input() set cafeterias(value: Cafe[]) {
    this.allCafeterias = value;
    this._cafeterias = this.getRandomCafeterias(value, 10);
    this.generateSlices();
  }

  get cafeterias(): Cafe[] {
    return this._cafeterias;
  }

  @Output() selected = new EventEmitter<Cafe>();

  private _cafeterias: Cafe[] = [];
  private allCafeterias: Cafe[] = [];

  slices: WheelSlice[] = [];
  isSpinning = false;
  rotation = 0;

  private colors = [
    '#79462d', '#8f5a3f', '#a66f53', '#c98f6f',
    '#e0b48d', '#eedbb6', '#dcbfa1', '#b27c52',
    '#996040', '#63311f'
  ];

  private getRandomCafeterias(lista: Cafe[], cantidad: number): Cafe[] {
    if (lista.length <= cantidad) return [...lista];
    const mezclada = [...lista].sort(() => Math.random() - 0.5);
    return mezclada.slice(0, cantidad);
  }

  generateSlices() {
    this.slices = [];
    const count = this._cafeterias.length;
    if (count === 0) return;

    const anglePerSlice = 360 / count;
    for (let i = 0; i < count; i++) {
      this.slices.push({
        cafe: this._cafeterias[i],
        color: this.colors[i % this.colors.length],
        startAngle: i * anglePerSlice,
        endAngle: (i + 1) * anglePerSlice
      });
    }
  }

  getSlicePath(slice: WheelSlice): string {
    const radius = 140;
    const center = 150;

    const start = (slice.startAngle - 90) * (Math.PI / 180);
    const end = (slice.endAngle - 90) * (Math.PI / 180);

    const x1 = center + radius * Math.cos(start);
    const y1 = center + radius * Math.sin(start);
    const x2 = center + radius * Math.cos(end);
    const y2 = center + radius * Math.sin(end);

    const largeArc = slice.endAngle - slice.startAngle > 180 ? 1 : 0;
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

 getTextPosition(slice: WheelSlice): { x: number, y: number, rotation: number } {
    const radius = 95;
    const centerX = 150;
    const centerY = 150;
    const midAngle = (slice.startAngle + slice.endAngle) / 2;
    const midAngleRad = (midAngle - 90) * (Math.PI / 180);

    return {
      x: centerX + radius * Math.cos(midAngleRad),
      y: centerY + radius * Math.sin(midAngleRad),
      rotation: midAngle + 90  // <--- aquí está el giro
    };
}


  getDisplayText(nombre: string): string {
    if (nombre.length > 12) {
      return nombre.split(' ').map(p => p[0]).join('').toUpperCase();
    }
    return nombre;
  }

  spin() {
    if (this.isSpinning || this.slices.length === 0) return;

    this._cafeterias = this.getRandomCafeterias(this.allCafeterias, 10);
    this.generateSlices();

    this.isSpinning = true;

    const fullRotations = 5 + Math.random() * 3;
    const randomAngle = Math.random() * 360;
    const totalRotation = fullRotations * 360 + randomAngle;

    this.rotation += totalRotation;

    setTimeout(() => {
      const normalized = this.rotation % 360;
      const target = (270 - normalized + 90 + 360) % 360;

      for (const slice of this.slices) {
        if (target >= slice.startAngle && target < slice.endAngle) {
          this.selected.emit(slice.cafe); // ✅ solo emite
          break;
        }
      }

      this.isSpinning = false;
    }, 4000);
  }
}
