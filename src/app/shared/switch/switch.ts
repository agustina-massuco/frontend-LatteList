import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './switch.html',
  styleUrls: ['./switch.css']
})
export class SwitchComponent {
  @Input() label = '';
  @Output() change = new EventEmitter<string>();

  checked = false;

  toggle() {
    this.checked = !this.checked;
    this.change.emit(this.label);
  }
}
