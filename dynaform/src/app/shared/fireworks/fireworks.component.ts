import { Component, Input, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-fireworks',
  template: `
    <div class="fireworks-container" *ngIf="show" [style.z-index]="zIndex">
      <div class="firework" 
           *ngFor="let firework of fireworks; trackBy: trackByIndex"
           [style.left.%]="firework.x"
           [style.top.%]="firework.y"
           [style.animation-delay.ms]="firework.delay">
        <div class="explosion">
          <span *ngFor="let particle of particles" 
                class="particle" 
                [style.background-color]="firework.color">
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fireworks-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
    }

    .firework {
      position: absolute;
      width: 4px;
      height: 4px;
    }

    .explosion {
      position: relative;
      width: 100%;
      height: 100%;
      animation: explode 2s ease-out forwards;
    }

    .particle {
      position: absolute;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      animation: particle-burst 2s ease-out forwards;
    }

    .particle:nth-child(1) { transform: rotate(0deg); }
    .particle:nth-child(2) { transform: rotate(30deg); }
    .particle:nth-child(3) { transform: rotate(60deg); }
    .particle:nth-child(4) { transform: rotate(90deg); }
    .particle:nth-child(5) { transform: rotate(120deg); }
    .particle:nth-child(6) { transform: rotate(150deg); }
    .particle:nth-child(7) { transform: rotate(180deg); }
    .particle:nth-child(8) { transform: rotate(210deg); }
    .particle:nth-child(9) { transform: rotate(240deg); }
    .particle:nth-child(10) { transform: rotate(270deg); }
    .particle:nth-child(11) { transform: rotate(300deg); }
    .particle:nth-child(12) { transform: rotate(330deg); }

    @keyframes explode {
      0% {
        transform: scale(0);
        opacity: 1;
      }
      50% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }

    @keyframes particle-burst {
      0% {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translateX(50px) scale(0);
        opacity: 0;
      }
    }
  `]
})
export class FireworksComponent implements OnInit, OnDestroy {
  @Input() show: boolean = false;
  @Input() duration: number = 3000; // Duration in milliseconds
  @Input() zIndex: number = 9999;

  fireworks: any[] = [];
  particles: number[] = Array.from({length: 12}, (_, i) => i); // 12 particles per firework
  private timeout: any;

  ngOnInit() {
    if (this.show) {
      this.generateFireworks();
      this.autoHide();
    }
  }

  ngOnDestroy() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  private generateFireworks() {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', 
      '#f0932b', '#eb4d4b', '#6c5ce7', '#fd79a8',
      '#00b894', '#fdcb6e', '#e17055', '#a29bfe'
    ];

    this.fireworks = [];
    
    // Generate 8-12 fireworks at random positions
    const numFireworks = Math.floor(Math.random() * 5) + 8;
    
    for (let i = 0; i < numFireworks; i++) {
      this.fireworks.push({
        x: Math.random() * 80 + 10, // 10% to 90% of screen width
        y: Math.random() * 60 + 20, // 20% to 80% of screen height
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 1000 // Random delay up to 1 second
      });
    }
  }

  private autoHide() {
    this.timeout = setTimeout(() => {
      this.show = false;
    }, this.duration);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
