import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paginator.html',
  styleUrls: ['./paginator.css']
})
export class PaginatorComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Output() pageChange = new EventEmitter<'next' | 'previous'>();

  onPrevious() {
    if (this.currentPage > 1) {
      this.pageChange.emit('previous');
    }
  }

  onNext() {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit('next');
    }
  }

  get isFirstPage(): boolean {
    return this.currentPage === 1;
  }

  get isLastPage(): boolean {
    return this.currentPage >= this.totalPages;
  }
}
