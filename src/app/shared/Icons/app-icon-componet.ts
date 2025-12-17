import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AppIcons } from './app-icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `<span [innerHTML]="svgContent" class="icon-wrapper"></span>`,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; }
    .icon-wrapper { display: flex; line-height: 0; }
  `]
})
export class IconComponent implements OnChanges {
  @Input() name!: keyof typeof AppIcons; 
  @Input() size: string = '16px';        
  
  svgContent: SafeHtml | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    const rawSvg = AppIcons[this.name];
    if (rawSvg) {
      this.svgContent = this.sanitizer.bypassSecurityTrustHtml(rawSvg);
    }
  }
}