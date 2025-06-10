import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { Subscription } from 'rxjs';

@Pipe({
    name: 'translate',
    pure: false // Make it impure so it updates when translations change
    ,
    standalone: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private subscription?: Subscription;
  private currentTranslations: { [key: string]: string } = {};

  constructor(private translationService: TranslationService) {
    this.subscription = this.translationService.currentTranslations$.subscribe(
      translations => {
        this.currentTranslations = translations;
      }
    );
  }

  transform(key: string): string {
    return this.currentTranslations[key] || key;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
