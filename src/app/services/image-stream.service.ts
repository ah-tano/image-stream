import { inject, Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { PacketFormat } from '../interfaces/packet-format.interface';
import { fetchEventSource } from '@microsoft/fetch-event-source';


@Injectable({
  providedIn: 'root'
})
export class ImageStreamService {
  private baseUrl = 'https://dev-file.maks.systems:8443/download/stream/sse/test';
  private zone = inject(NgZone);

  getImage(testNumber: number): Observable<Blob> {
    return new Observable((observer) => {
      const imageUrl = `${this.baseUrl}?testNumber=${testNumber}`;
      const imageByteArrays: Uint8Array[] = [];
      const abortController = new AbortController();

      fetchEventSource(imageUrl, {
        signal: abortController.signal,

        async onopen(response) {
          if (response.ok) {
            return;
          }
          if (response.status === 404) {
            observer.error({ notFound: true });
          }
          abortController.abort();
        },
        onmessage: (event) => {
          this.zone.run(() => {
            const data: PacketFormat = JSON.parse(event.data);
            const chunkByteArrays = this.b64toUint8Arrays(data.frameData);
            imageByteArrays.push(...chunkByteArrays);
            const blob = new Blob(imageByteArrays, {type: 'image/jpeg'});
            observer.next(blob);
          });
        },
        onerror: () => {
          this.zone.run(() => {
            abortController.abort();
            observer.complete();
          });
        }
      });
    });
  }

  private b64toUint8Arrays(b64Data: string, sliceSize: number = 512): Uint8Array[] {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return byteArrays;
  }
}
