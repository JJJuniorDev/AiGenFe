// archive.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SocialCraftService } from '../services/SocialCraftService.service';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserStateService } from '../services/UserStateService.service';
import { User } from '../model/User.model';
import { AuthService } from '../services/AuthService.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-archive',
  imports: [CommonModule, 
    FormsModule],
  templateUrl: 'archive-component.html',
  styleUrls: ['./archive-component.css']
})
export class ArchiveComponent implements OnInit {
  savedPosts: any[] = [];
  filteredPosts: any[] = [];
  selectedCategory: string = 'all';
  searchTerm: string = '';
  isLoading: boolean = false;
currentUser: User | null= null;
private destroy$ = new Subject<void>();


  // Categorie corrispondenti ai tipi di output
  categories = [
    { id: 'all', name: 'Tutti i contenuti', icon: '📁' },
    { id: 'social_post', name: 'socialPostVersions', icon: '📱' },
    { id: 'short_quote', name: 'Short Quote', icon: '💬' },
    { id: 'cta', name: 'Call to Action', icon: '👆' },
    { id: 'headline', name: 'headlineVersions', icon: '📰' }
  ];

  constructor(
    private socialCraftService: SocialCraftService,
    private router: Router,
    private userStateService: UserStateService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    console.log('🔴 ArchiveComponent - Componente distrutto, unsubscribe effettuato');
  }


   loadCurrentUser() {
    // 👇 SOTTOSCRIVI ALL'OBSERVABLE DELLO USER STATE
    this.userStateService.currentUser$.subscribe({
      next: (user) => {
        this.currentUser = user;
        console.log('👤 Archive - User aggiornato:', user?.email);
        
        if (user) {
          this.loadSavedPosts();
        } else {
          this.handleNoUser();
        }
      },
      error: (error) => {
        console.error('❌ Errore nello user state:', error);
        this.handleNoUser();
      }
    });
  }

  private handleNoUser() {
    console.log('🔒 Nessun utente in Archive, verifica autenticazione...');
    
    // Se c'è il token ma non l'user nello state, prova a ricaricare
    if (this.authService.isLoggedIn()) {
      console.log('🔄 Token presente, ricarico user...');
      this.authService.getCurrentUser().subscribe({
        next: (user) => {
          this.userStateService.setUser(user);
        },
        error: (error) => {
          console.error('❌ Errore ricaricamento user:', error);
          this.redirectToLogin();
        }
      });
    } else {
      this.redirectToLogin();
    }
  }

   private redirectToLogin() {
    console.log('🚨 Reindirizzamento a login...');
    this.router.navigate(['/login']);
  }

  loadSavedPosts() {
     if (!this.currentUser) {
      console.error('❌ Impossibile caricare posts: utente nullo');
      return;
    }
    this.isLoading = true;
    this.socialCraftService.getPostSalvati().subscribe({
      next: (posts) => {
        this.savedPosts = posts;
        this.filterPosts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento archivio:', error);
        this.isLoading = false;
      }
    });
  }

  filterPosts() {
    this.filteredPosts = this.savedPosts.filter(post => {
      const categoryMatch = this.selectedCategory === 'all' || post.tipo === this.selectedCategory;
      const searchMatch = !this.searchTerm || 
        post.contenuto.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        post.brandName?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return categoryMatch && searchMatch;
    });
  }

  onCategoryChange(category: string) {
    this.selectedCategory = category;
    this.filterPosts();
  }

  onSearchChange() {
    this.filterPosts();
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Mostra feedback visivo
    });
  }

  deletePost(postId: number) {
    if (confirm('Sei sicuro di voler eliminare questo contenuto?')) {
      this.socialCraftService.eliminaPostSalvato(postId).subscribe({
        next: () => {
          this.savedPosts = this.savedPosts.filter(post => post.id !== postId);
          this.filterPosts();
        },
        error: (error) => {
          console.error('Errore nell\'eliminazione:', error);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/generator']);
  }

  getCategoryIcon(tipo: string): string {
    const category = this.categories.find(cat => cat.id === tipo);
    return category?.icon || '📄';
  }

  getPlatformIcon(platform: string): string {
    const platformIcons: { [key: string]: string } = {
      'instagram': '📷',
      'facebook': '👥',
      'twitter': '🐦',
      'linkedin': '💼',
      'tiktok': '🎵'
    };
    return platformIcons[platform] || '📱';
  }
}