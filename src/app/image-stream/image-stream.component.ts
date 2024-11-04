import { Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ImageStreamService } from '../services/image-stream.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-image-stream',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './image-stream.component.html',
  styleUrl: './image-stream.component.scss'
})
export class ImageStreamComponent {
  testNumber: number | null = null;
  imageUrl = '';
  imageWidth: number | null = null;
  imageHeight: number | null = null;
  private toastr = inject(ToastrService);
  private imageStreamService = inject(ImageStreamService);
  private destroyRef = inject(DestroyRef);

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.testNumber && this.testNumber > 0) {
      this.loadImage(this.testNumber);
    } else {
      this.toastr.error('Invalid test number.');
    }
  }

  loadImage(testNumber: number): void {
    this.imageStreamService.getImage(testNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => this.imageUrl = URL.createObjectURL(blob),
        error: (error) => {
          if (error.notFound) {
            this.toastr.error('Image not found. Please, enter another test number.');
          }
        },
      });
  }

  onImageLoad(event: Event): void {
    const imageElement = event.target as HTMLImageElement;
    this.imageWidth = imageElement.naturalWidth;
    this.imageHeight = imageElement.naturalHeight;
    URL.revokeObjectURL(imageElement.src);
  }
}
