import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-fireworks',
    template: `
    <div class="fireworks-container" *ngIf="show" [style.z-index]="zIndex">
      <div class="firework" 
           *ngFor="let firework of fireworks; trackBy: trackByIndex"
           [style.left.%]="firework.x"
           [style.top.%]="firework.y"
           [style.animation-delay.ms]="firework.delay"
           [style.--color1]="firework.color1"
           [style.--color2]="firework.color2"
           [style.--color3]="firework.color3">
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
      --color1: #ff6b6b;
      --color2: #4ecdc4;
      --color3: #f9ca24;
      
      position: absolute;
      transform: translate(-50%, -50%);
      width: 0.5vmin;
      aspect-ratio: 1;
      background:
        radial-gradient(circle, var(--color1) 0.5vmin, #0000 0) 50% 0%,
        radial-gradient(circle, var(--color2) 0.5vmin, #0000 0) 100% 50%,
        radial-gradient(circle, var(--color3) 0.5vmin, #0000 0) 50% 100%,
        radial-gradient(circle, var(--color1) 0.5vmin, #0000 0) 0% 50%,
        radial-gradient(circle, var(--color2) 0.5vmin, #0000 0) 80% 90%,
        radial-gradient(circle, var(--color3) 0.5vmin, #0000 0) 95% 90%,
        radial-gradient(circle, var(--color1) 0.5vmin, #0000 0) 90% 70%,
        radial-gradient(circle, var(--color2) 0.5vmin, #0000 0) 100% 60%,
        radial-gradient(circle, var(--color3) 0.5vmin, #0000 0) 55% 80%,
        radial-gradient(circle, var(--color1) 0.5vmin, #0000 0) 70% 77%,
        radial-gradient(circle, var(--color2) 0.5vmin, #0000 0) 70% 40%,
        radial-gradient(circle, var(--color3) 0.5vmin, #0000 0) 80% 10%,
        radial-gradient(circle, var(--color1) 0.5vmin, #0000 0) 64% 20%,
        radial-gradient(circle, var(--color2) 0.5vmin, #0000 0) 74% 5%,
        radial-gradient(circle, var(--color3) 0.5vmin, #0000 0) 30% 20%,
        radial-gradient(circle, var(--color1) 0.5vmin, #0000 0) 20% 30%,
        radial-gradient(circle, var(--color2) 0.5vmin, #0000 0) 15% 70%,
        radial-gradient(circle, var(--color3) 0.5vmin, #0000 0) 28% 75%,
        radial-gradient(circle, var(--color1) 0.5vmin, #0000 0) 35% 91%,
        radial-gradient(circle, var(--color2) 0.5vmin, #0000 0) 20% 95%,
        radial-gradient(circle, var(--color3) 0.5vmin, #0000 0) 40% 60%,
        radial-gradient(circle, var(--color1) 0.5vmin, #0000 0) 29% 50%,
        radial-gradient(circle, var(--color2) 0.5vmin, #0000 0) 20% 40%,
        radial-gradient(circle, var(--color3) 0.5vmin, #0000 0) 15% 25%,
        radial-gradient(circle, var(--color1) 0.5vmin, #0000 0) 30% 15%,
        radial-gradient(circle, var(--color2) 0.5vmin, #0000 0) 45% 5%,
        radial-gradient(circle, var(--color3) 0.5vmin, #0000 0) 60% 7%,
        radial-gradient(circle, var(--color1) 0.5vmin, #0000 0) 85% 25%,
        radial-gradient(circle, var(--color2) 0.5vmin, #0000 0) 95% 35%,
        radial-gradient(circle, var(--color3) 0.5vmin, #0000 0) 92% 85%;
      background-size: 0.5vmin 0.5vmin;
      background-repeat: no-repeat;
      animation: firework 6s infinite;
    }

    .firework::before,
    .firework::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: inherit;
      background-size: inherit;
      background-repeat: inherit;
      animation: inherit;
    }

    .firework::before {
      transform: translate(-50%, -50%) rotate(25deg) !important;
    }

    .firework::after {
      transform: translate(-50%, -50%) rotate(-37deg) !important;
    }

    @keyframes firework {
      0% {
        transform: translate(-50%, 60vh);
        width: 0.5vmin;
        opacity: 1;
      }
      15% {
        width: 0.5vmin;
        opacity: 1;
      }
      100% {
        width: 45vmin;
        opacity: 0;
      }
    }
  `],
    standalone: false
})
export class FireworksComponent implements OnInit, OnDestroy, OnChanges {
  @Input() show: boolean = false;
  @Input() duration: number = 6000; // Duration in milliseconds (6 seconds)
  @Input() zIndex: number = 9999;

  fireworks: any[] = [];
  private timeout: any;

  ngOnInit() {
    if (this.show) {
      this.generateFireworks();
      this.autoHide();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['show'] && this.show && !changes['show'].isFirstChange()) {
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
    
    // Generate 10-15 fireworks at random positions
    const numFireworks = Math.floor(Math.random() * 6) + 10;
    
    for (let i = 0; i < numFireworks; i++) {
      // Select 3 random colors for each firework
      const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
      
      this.fireworks.push({
        x: Math.random() * 80 + 10, // 10% to 90% of screen width
        y: Math.random() * 60 + 20, // 20% to 80% of screen height
        color1: shuffledColors[0],
        color2: shuffledColors[1],
        color3: shuffledColors[2],
        delay: Math.random() * 2000 // Random delay up to 2 seconds
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
