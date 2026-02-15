import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  NgZone,
  HostListener,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Phaser from 'phaser';

interface GameFlags {
  talkedToLorenzo: boolean;
  talkedToFabrizio: boolean;
  talkedToSimone: boolean;
  gameComplete: boolean;
}

interface NPCMessage {
  id: string;
  name: string;
  emoji: string;
  messages: string[];
  area: 'cafe' | 'calvario' | 'svolta';
  x: number;
  y: number;
  avatar: string;
  requiredFlag?: keyof GameFlags;
  interacted?: boolean;
  color?: number;
  skinColor?: number;
  hat?: string;
  accessory?: string;
}

@Component({
  selector: 'app-birthday-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './birthday-map.html',
  styleUrls: ['./birthday-map.css']
})
export class BirthdayMap implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('gameContainer', { static: true }) gameContainer!: ElementRef;
  
  private game!: Phaser.Game;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private npcs: Map<string, Phaser.Types.Physics.Arcade.SpriteWithDynamicBody> = new Map();
  private walls: Phaser.Types.Physics.Arcade.SpriteWithStaticBody[] = [];
  private movingDirection: string | null = null;
  private npcInteractionCooldown: Map<string, number> = new Map();
  private readonly INTERACTION_COOLDOWN = 2000;
  private finalAnimation: Phaser.GameObjects.Group | null = null;
  private fireworks: Phaser.GameObjects.Group | null = null;
  
  // Stato del gioco
  currentMessage: string | null = null;
  messageEmoji: string = '🎉';
  currentSpeaker: string = '';
  showNextHint: boolean = false;
  totalMessages: number = 0;
  currentMessageIndex: number = 0;
  currentArea: string = 'home';
  playerX: number = 500;
  playerY: number = 325;
  isMobile: boolean = window.innerWidth <= 768;
  
  private messageQueue: string[] = [];
  public currentNPC: string | null = null;
  
  gameFlags: GameFlags = {
    talkedToLorenzo: false,
    talkedToFabrizio: false,
    talkedToSimone: false,
    gameComplete: false
  };

  private npcData: NPCMessage[] = [
    {
      id: 'Lorenzo',
      name: 'Lorenzo',
      emoji: '🍺',
      avatar: '🍺',
      messages: [
        'Ehi Broder! Finalmente sei arrivato! 🍺',
        'Senti, ti offro una bionda media, ma poi...',
        'Devi andare da Fabrizio al Calvario! È importante!',
      ],
      area: 'cafe',
      x: 280,
      y: 220,
      requiredFlag: undefined,
      interacted: false,
      color: 0x000000, // Nero
      skinColor: 0x8B4513, // Marrone scuro
      hat: '🧢',
      accessory: '🍺'
    },
    {
      id: 'Barista',
      name: 'Barista',
      emoji: '🍺',
      avatar: '👨‍🍳',
      messages: [
        '5 euro per la bionda media! 💶',
        '...ma per gli amici di Lorenzo è offerta! 🎉',
        'Buon compleanno broder! 🍻'
      ],
      area: 'cafe',
      x: 220,
      y: 180,
      requiredFlag: 'talkedToLorenzo',
      interacted: false,
      color: 0xFFFFFF, // Bianco
      skinColor: 0xFFE0BD, // Pelle chiara
      hat: '👨‍🍳',
      accessory: '🍺'
    },
    {
      id: 'Fabrizio',
      name: 'Fabrizio',
      emoji: '📈',
      avatar: '📈',
      messages: [
        'Oh broder! ti sto aspettando da 1 ora! ⏰',
        'A Lorenzo hai offerto la birra eh... 🍺',
        'Senti, ho un affare per te: BTP e birra, ci pensi? 📊',
        'Ora vai da Simone alla Svolta, ti aspetta!'
      ],
      area: 'calvario',
      x: 730,
      y: 220,
      requiredFlag: 'talkedToLorenzo',
      interacted: false,
      color: 0xCCCCCC, // Grigio chiaro
      skinColor: 0xFFE0BD,
      hat: '👔',
      accessory: '🚬' // Sigaretta
    },
    {
      id: 'Simone',
      name: 'Simone',
      emoji: '🎁',
      avatar: '🎁',
      messages: [
        'Hai superato la Svolta, vedo! 🎯',
        'Siamo tutti qui per te broder! ❤️',
        'Questo regalo è per i tuoi 30 anni! 🎁',
        'TANTISSIMI AUGURI ANTHONY! 🏆🎉'
      ],
      area: 'svolta',
      x: 1030,
      y: 350,
      requiredFlag: 'talkedToFabrizio',
      interacted: false,
      color: 0xFFFFFF, // Bianco
      skinColor: 0xFFE0BD,
      hat: '🎁',
      accessory: '✨'
    }
  ];

  private areas = [
    { id: 'home', x: [400, 600], y: [250, 400], color: 0x2E7D32, name: 'Casa', unlocked: true },
    { id: 'cafe', x: [150, 400], y: [100, 300], color: 0xCD853F, name: 'Caffè', unlocked: true },
    { id: 'calvario', x: [600, 850], y: [100, 300], color: 0x2F4F4F, name: 'Calvario', unlocked: false },
    { id: 'svolta', x: [900, 1150], y: [250, 450], color: 0xDAA520, name: 'Svolta', unlocked: false }
  ];

  constructor(private ngZone: NgZone) {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.initGame();
  }

  ngOnDestroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }

  private initGame() {
    this.ngZone.runOutsideAngular(() => {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: this.gameContainer.nativeElement,
        width: 1200,
        height: 675,
        backgroundColor: '#2a5a2a',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
          }
        },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 1200,
          height: 675
        },
        scene: {
          preload: this.preload.bind(this),
          create: this.create.bind(this),
          update: this.update.bind(this)
        }
      };
      
      this.game = new Phaser.Game(config);
    });
  }

  private preload() {
    const scene = this.game.scene.getScene('default');
    const graphics = scene.make.graphics({ x: 0, y: 0 });
    
    // Player texture - Anthony con coroncina
    graphics.clear();
    // Corpo
    graphics.fillStyle(0xFFD700);
    graphics.fillRect(10, 16, 12, 16); // Corpo
    graphics.fillStyle(0xFFE0BD);
    graphics.fillCircle(16, 12, 8); // Testa
    // Occhi
    graphics.fillStyle(0x000000);
    graphics.fillCircle(12, 10, 1);
    graphics.fillCircle(20, 10, 1);
    // Bocca
    graphics.fillStyle(0xFF6B6B);
    graphics.fillCircle(16, 14, 2);
    // Coroncina
    graphics.fillStyle(0xFFD700);
    graphics.fillCircle(16, 4, 4);
    graphics.fillCircle(12, 6, 2);
    graphics.fillCircle(20, 6, 2);
    graphics.generateTexture('player', 32, 32);
    
    // NPC textures personalizzate
    this.npcData.forEach(npc => {
      graphics.clear();
      
      // Colore del corpo (maglietta)
      graphics.fillStyle(npc.color || 0xCCCCCC);
      graphics.fillRect(10, 16, 12, 16);
      
      // Pelle del viso
      graphics.fillStyle(npc.skinColor || 0xFFE0BD);
      graphics.fillCircle(16, 12, 8);
      
      // Occhi
      graphics.fillStyle(0x000000);
      graphics.fillCircle(12, 10, 1);
      graphics.fillCircle(20, 10, 1);
      
      // Bocca (sorridente)
      graphics.fillStyle(0xFF6B6B);
      graphics.fillCircle(16, 14, 2);
      
      // Accessori speciali
      if (npc.id === 'Fabrizio') {
        // Sigaretta
        graphics.fillStyle(0xFFFFFF);
        graphics.fillRect(24, 10, 8, 2);
        graphics.fillStyle(0xFF0000);
        graphics.fillCircle(32, 11, 2);
      }
      
      // Cappello o accessorio in testa
      if (npc.hat) {
        if (npc.id === 'Barista') {
          graphics.fillStyle(0xFFFFFF);
          graphics.fillRect(12, 4, 8, 4);
        } else if (npc.id === 'Simone') {
          graphics.fillStyle(0xFFD700);
          graphics.fillCircle(16, 4, 4);
        }
      }
      
      graphics.generateTexture(`npc_${npc.id}`, 32, 32);
    });
    
    // Wall texture
    graphics.clear();
    graphics.fillStyle(0x8B4513);
    graphics.fillRect(0, 0, 48, 48);
    graphics.fillStyle(0xA0522D);
    graphics.fillRect(4, 4, 40, 40);
    graphics.fillStyle(0x654321);
    graphics.fillRect(8, 8, 32, 32);
    graphics.generateTexture('wall', 48, 48);
    
    // Alberi
    graphics.clear();
    graphics.fillStyle(0x228B22);
    graphics.fillCircle(24, 16, 12);
    graphics.fillStyle(0x8B4513);
    graphics.fillRect(22, 24, 4, 16);
    graphics.generateTexture('tree', 48, 48);
    
    // Fuochi d'artificio
    graphics.clear();
    graphics.fillStyle(0xFF0000);
    graphics.fillCircle(8, 8, 4);
    graphics.fillStyle(0xFFD700);
    graphics.fillCircle(16, 8, 4);
    graphics.fillStyle(0x00FF00);
    graphics.fillCircle(24, 8, 4);
    graphics.fillStyle(0x0000FF);
    graphics.fillCircle(32, 8, 4);
    graphics.generateTexture('firework', 40, 16);
  }

  private create() {
    const scene = this.game.scene.getScene('default');
    
    this.createTerrain(scene);
    this.createDecorations(scene);
    this.createBuildings(scene);
    this.createWalls(scene);
    this.createPlayer(scene);
    this.createNPCs(scene);
    
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
    }
    
    scene.cameras.main.setBounds(0, 0, 1200, 675);
    scene.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    scene.cameras.main.setZoom(1);
  }

  private update() {
    if (!this.currentMessage && this.player) {
      this.handlePlayerMovement();
    } else if (this.player) {
      this.player.setVelocity(0);
    }
    
    if (this.player) {
      this.playerX = this.player.x;
      this.playerY = this.player.y;
      this.updateCurrentArea();
      this.checkNPCInteractions();
      
      // Animazione finale se completato
      if (this.gameFlags.gameComplete && !this.finalAnimation) {
        this.startFinalAnimation();
      }
    }
  }

  private startFinalAnimation() {
    const scene = this.game.scene.getScene('default');
    
    // Crea fuochi d'artificio
    this.fireworks = scene.add.group();
    
    for (let i = 0; i < 5; i++) {
      scene.time.delayedCall(i * 500, () => {
        this.createFirework(scene, 400 + Math.random() * 400, 200 + Math.random() * 200);
      });
    }
    
    // Testo "BUON COMPLEANNO!" che fluttua
    const finalText = scene.add.text(500, 300, '🎉 BUON COMPLEANNO ANTHONY! 🎉', {
      fontSize: '48px',
      color: '#gold',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 10, fill: true }
    } as Phaser.Types.GameObjects.Text.TextStyle);
    finalText.setDepth(20);
    finalText.setScrollFactor(0);
    finalText.setPosition(400, 300);
    
    scene.tweens.add({
      targets: finalText,
      y: '+=20',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Palloncini che volano via
    for (let i = 0; i < 10; i++) {
      const balloon = scene.add.circle(200 + i * 100, 500, 15, Math.random() * 0xFFFFFF);
      scene.tweens.add({
        targets: balloon,
        y: '-=300',
        x: '+=50',
        duration: 3000,
        delay: i * 200,
        ease: 'Power1'
      });
    }
  }

  private createFirework(scene: Phaser.Scene, x: number, y: number) {
    const particles = [];
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const particle = scene.add.circle(x, y, 3, Math.random() * 0xFFFFFF);
      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 100,
        y: y + Math.sin(angle) * 100,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
      particles.push(particle);
    }
  }

  private createTerrain(scene: Phaser.Scene) {
    for (let x = 0; x < 1200; x += 48) {
      for (let y = 0; y < 675; y += 48) {
        let color = 0x2E7D32;
        let alpha = 1;
        
        for (let area of this.areas) {
          if (x >= area.x[0] && x <= area.x[1] && y >= area.y[0] && y <= area.y[1]) {
            if (area.unlocked) {
              color = area.color;
            } else {
              alpha = 0.2;
            }
            break;
          }
        }
        
        if ((x + y) % 96 === 0) {
          color = this.lightenColor(color, 20);
        }
        
        const rect = scene.add.rectangle(x + 24, y + 24, 46, 46, color, alpha);
        rect.setStrokeStyle(1, 0x000000, 0.1);
      }
    }
  }

  private lightenColor(color: number, percent: number): number {
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    
    const newR = Math.min(255, r + percent);
    const newG = Math.min(255, g + percent);
    const newB = Math.min(255, b + percent);
    
    return (newR << 16) | (newG << 8) | newB;
  }

  private createDecorations(scene: Phaser.Scene) {
    const treePositions = [
      [100, 400], [200, 450], [1100, 200], [1150, 500],
      [50, 100], [50, 600], [1150, 100], [1150, 600]
    ];
    
    treePositions.forEach(([x, y]) => {
      const tree = scene.add.sprite(x, y, 'tree');
      tree.setScale(1.2);
      tree.setDepth(1);
    });
  }

  private createBuildings(scene: Phaser.Scene) {
    // Casa di Anthony
    scene.add.rectangle(500, 325, 200, 150, 0x8B4513);
    scene.add.rectangle(500, 275, 220, 30, 0xA52A2A);
    scene.add.rectangle(500, 375, 40, 60, 0x654321);
    scene.add.rectangle(540, 290, 20, 20, 0x87CEEB);
    scene.add.text(430, 220, '🏠 CASA DI ANTHONY', {
      fontSize: '16px',
      color: '#gold',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, fill: true }
    } as Phaser.Types.GameObjects.Text.TextStyle);
    
    // Caffè delle Bugie
    scene.add.rectangle(250, 200, 250, 200, 0xDEB887);
    scene.add.rectangle(250, 125, 270, 30, 0xCD853F);
    scene.add.rectangle(250, 275, 40, 60, 0x654321);
    scene.add.rectangle(210, 190, 20, 20, 0x87CEEB);
    scene.add.rectangle(290, 190, 20, 20, 0x87CEEB);
    scene.add.rectangle(220, 190, 100, 20, 0x8B4513);
    scene.add.circle(200, 180, 5, 0xFFD700);
    scene.add.circle(240, 180, 5, 0xFFD700);
    scene.add.text(160, 80, '☕ CAFFÈ DELLE BUGIE', {
      fontSize: '18px',
      color: '#gold',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, fill: true }
    } as Phaser.Types.GameObjects.Text.TextStyle);
    
    // Calvario (se sbloccato)
    const calvarioArea = this.areas.find(a => a.id === 'calvario');
    if (calvarioArea?.unlocked) {
      scene.add.rectangle(700, 200, 250, 200, 0x696969);
      scene.add.rectangle(700, 125, 270, 30, 0x2F4F4F);
      scene.add.rectangle(700, 275, 40, 60, 0x654321);
      scene.add.rectangle(670, 190, 20, 20, 0x8B0000);
      scene.add.rectangle(730, 190, 20, 20, 0x8B0000);
      scene.add.text(620, 80, '⚰️ IL CALVARIO', {
        fontSize: '18px',
        color: '#gold',
        stroke: '#000000',
        strokeThickness: 4
      } as Phaser.Types.GameObjects.Text.TextStyle);
    }
    
    // Svolta (se sbloccata)
    const svoltaArea = this.areas.find(a => a.id === 'svolta');
    if (svoltaArea?.unlocked) {
      scene.add.rectangle(1000, 350, 250, 200, 0xDAA520);
      scene.add.rectangle(1000, 275, 270, 30, 0xB8860B);
      scene.add.rectangle(1000, 425, 40, 60, 0x654321);
      scene.add.text(920, 230, '🛣️ LA SVOLTA', {
        fontSize: '18px',
        color: '#gold',
        stroke: '#000000',
        strokeThickness: 4
      } as Phaser.Types.GameObjects.Text.TextStyle);
    }
  }

  private createWalls(scene: Phaser.Scene) {
    const calvarioArea = this.areas.find(a => a.id === 'calvario');
    if (!calvarioArea?.unlocked) {
      for (let y = 100; y <= 300; y += 48) {
        const wall = scene.physics.add.staticSprite(550, y, 'wall');
        this.walls.push(wall);
      }
    }
    
    const svoltaArea = this.areas.find(a => a.id === 'svolta');
    if (!svoltaArea?.unlocked) {
      for (let y = 100; y <= 300; y += 48) {
        const wall = scene.physics.add.staticSprite(850, y, 'wall');
        this.walls.push(wall);
      }
    }
  }

  private createPlayer(scene: Phaser.Scene) {
    this.player = scene.physics.add.sprite(500, 325, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(1.5);
    this.player.setDepth(10);
    this.player.setDrag(300);
    
    const playerEmoji = scene.add.text(490, 290, '👨‍🎤', {
      fontSize: '24px',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, fill: true }
    } as Phaser.Types.GameObjects.Text.TextStyle);
    playerEmoji.setDepth(11);
    
    scene.tweens.add({
      targets: playerEmoji,
      y: '+=5',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.walls.forEach(wall => {
      scene.physics.add.collider(this.player, wall);
    });
  }

  private createNPCs(scene: Phaser.Scene) {
    this.npcData.forEach(npc => {
      let showNPC = true;
      if (npc.requiredFlag) {
        const flag = npc.requiredFlag as keyof GameFlags;
        showNPC = this.gameFlags[flag] === true;
      }
      
      if (showNPC) {
        this.createSingleNPC(scene, npc);
      }
    });
  }

  private createSingleNPC(scene: Phaser.Scene, npc: NPCMessage) {
    const sprite = scene.physics.add.sprite(npc.x, npc.y, `npc_${npc.id}`);
    sprite.setScale(1.5);
    sprite.setImmovable(true);
    sprite.setDepth(5);
    
    const nameText = scene.add.text(npc.x - 30, npc.y - 40, npc.name, {
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 5, y: 2 },
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 3, fill: true }
    } as Phaser.Types.GameObjects.Text.TextStyle);
    nameText.setDepth(6);
    
    const avatarEmoji = scene.add.text(npc.x - 12, npc.y - 60, npc.avatar, {
      fontSize: '24px',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, fill: true }
    } as Phaser.Types.GameObjects.Text.TextStyle);
    avatarEmoji.setDepth(6);
    
    scene.tweens.add({
      targets: [sprite, nameText, avatarEmoji],
      y: '+=5',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    scene.physics.add.collider(this.player, sprite);
    this.npcs.set(npc.id, sprite);
  }

  private handlePlayerMovement() {
    const speed = 200;
    let moving = false;
    
    if (this.movingDirection) {
      switch(this.movingDirection) {
        case 'up': this.player.setVelocityY(-speed); moving = true; break;
        case 'down': this.player.setVelocityY(speed); moving = true; break;
        case 'left': this.player.setVelocityX(-speed); moving = true; break;
        case 'right': this.player.setVelocityX(speed); moving = true; break;
      }
    } else if (this.cursors) {
      if (this.cursors.left?.isDown) {
        this.player.setVelocityX(-speed);
        moving = true;
      } else if (this.cursors.right?.isDown) {
        this.player.setVelocityX(speed);
        moving = true;
      }
      
      if (this.cursors.up?.isDown) {
        this.player.setVelocityY(-speed);
        moving = true;
      } else if (this.cursors.down?.isDown) {
        this.player.setVelocityY(speed);
        moving = true;
      }
    }
    
    if (!moving) {
      this.player.setVelocity(0);
    }
  }

  private updateCurrentArea() {
    for (let area of this.areas) {
      if (this.player.x >= area.x[0] && this.player.x <= area.x[1] &&
          this.player.y >= area.y[0] && this.player.y <= area.y[1]) {
        this.currentArea = area.id;
        break;
      }
    }
  }

  private checkNPCInteractions() {
    const now = Date.now();
    
    this.npcs.forEach((sprite, id) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        sprite.x, sprite.y
      );
      
      if (distance < 60) {
        const npc = this.npcData.find(n => n.id === id);
        if (npc) {
          if (npc.requiredFlag) {
            const flag = npc.requiredFlag as keyof GameFlags;
            if (!this.gameFlags[flag]) {
              return;
            }
          }
          
          const lastInteraction = this.npcInteractionCooldown.get(id) || 0;
          const canInteract = now - lastInteraction > this.INTERACTION_COOLDOWN;
          
          if (canInteract && this.currentNPC !== npc.id && !this.currentMessage && !npc.interacted) {
            this.npcInteractionCooldown.set(id, now);
            this.showMessages(npc.id, npc.name, npc.messages, npc.emoji);
          }
        }
      }
    });
  }

  showMessages(npcId: string, npcName: string, messages: string[], emoji: string) {
    this.ngZone.run(() => {
      this.messageQueue = [...messages];
      this.currentNPC = npcId;
      this.currentSpeaker = npcName;
      this.messageEmoji = emoji;
      this.totalMessages = messages.length;
      this.currentMessageIndex = 0;
      this.showNextMessage();
    });
  }

  nextMessage() {
    if (!this.currentMessage) return;
    
    if (this.currentMessageIndex < this.totalMessages - 1) {
      this.currentMessageIndex++;
      this.showNextMessage();
    } else {
      this.hideMessage();
      if (this.currentNPC) {
        this.completeNPC(this.currentNPC);
        this.currentNPC = null;
      }
    }
  }

  private showNextMessage() {
    if (this.messageQueue.length > 0) {
      this.currentMessage = this.messageQueue.shift()!;
      this.showNextHint = true;
    }
  }

  private hideMessage() {
    this.currentMessage = null;
    this.showNextHint = false;
    this.currentMessageIndex = 0;
    this.totalMessages = 0;
  }

  private completeNPC(npcId: string) {
    const npc = this.npcData.find(n => n.id === npcId);
    if (npc) {
      npc.interacted = true;
    }
    
    switch(npcId) {
      case 'Lorenzo':
        this.gameFlags.talkedToLorenzo = true;
        this.unlockArea('calvario');
        setTimeout(() => this.createBarista(), 100);
        break;
      case 'Fabrizio':
        this.gameFlags.talkedToFabrizio = true;
        this.unlockArea('svolta');
        break;
      case 'Simone':
        this.gameFlags.talkedToSimone = true;
        this.gameFlags.gameComplete = true;
        break;
    }
  }

  startMove(direction: 'up' | 'down' | 'left' | 'right') {
    if (this.player && !this.currentMessage) {
      this.movingDirection = direction;
    }
  }

  stopMove() {
    this.movingDirection = null;
  }

  resetGame() {
    this.gameFlags = {
      talkedToLorenzo: false,
      talkedToFabrizio: false,
      talkedToSimone: false,
      gameComplete: false
    };
    
    this.npcData.forEach(npc => {
      npc.interacted = false;
    });
    
    this.currentMessage = null;
    this.messageQueue = [];
    this.currentNPC = null;
    this.currentMessageIndex = 0;
    this.totalMessages = 0;
    this.npcInteractionCooldown.clear();
    this.finalAnimation = null;
    
    this.areas.forEach(area => {
      if (area.id === 'calvario' || area.id === 'svolta') {
        area.unlocked = false;
      }
    });
    
    if (this.game) {
      this.game.destroy(true);
      setTimeout(() => this.initGame(), 100);
    }
  }

  unlockArea(areaId: string) {
    const area = this.areas.find(a => a.id === areaId);
    if (area) {
      area.unlocked = true;
      setTimeout(() => {
        if (this.game) {
          this.game.destroy(true);
          this.initGame();
        }
      }, 500);
    }
  }

  createBarista() {
    const scene = this.game.scene.getScene('default');
    const barista = this.npcData.find(n => n.id === 'Barista');
    if (barista && scene) {
      this.createSingleNPC(scene, barista);
    }
  }

  getAreaIcon(areaId: string): string {
    const icons: {[key: string]: string} = {
      'home': '🏠',
      'cafe': '☕',
      'calvario': '⚰️',
      'svolta': '🛣️'
    };
    return icons[areaId] || '📍';
  }

  getAreaName(areaId: string): string {
    const names: {[key: string]: string} = {
      'home': 'Casa Anthony',
      'cafe': 'Caffè delle Bugie',
      'calvario': 'Il Calvario',
      'svolta': 'La Svolta'
    };
    return names[areaId] || areaId;
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
    if (event.key === 'r' || event.key === 'R') {
      this.resetGame();
    }
    if (event.key === ' ' && this.currentMessage) {
      this.nextMessage();
    }
  }
}