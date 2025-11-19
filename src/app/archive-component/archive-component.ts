// archive.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SocialCraftService } from '../services/SocialCraftService.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserStateService } from '../services/UserStateService.service';
import { User } from '../model/User.model';
import { AuthService } from '../services/AuthService.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-archive',
  imports: [CommonModule, FormsModule],
  templateUrl: 'archive-component.html',
  styleUrls: ['./archive-component.css']
})
export class ArchiveComponent implements OnInit {
  savedPosts: any[] = [];
  filteredPosts: any[] = [];
  selectedCategory: string = 'all';
  searchTerm: string = '';
  isLoading: boolean = false;
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  // ✅ PAGINAZIONE
  currentPage: number = 1;
  pageSize: number = 9; // 3x3 grid
  totalPages: number = 1;
  paginatedPosts: any[] = [];

  // Categorie
  categories = [
    { id: 'all', name: 'Tutti i contenuti', icon: '📁', color: '#6c757d' },
    { id: 'socialPostVersions', name: 'Social Posts', icon: '📱', color: '#007bff' },
    { id: 'headlineVersions', name: 'Headlines', icon: '📰', color: '#28a745' },
    { id: 'shortQuoteVersions', name: 'Short Quotes', icon: '💬', color: '#ffc107' },
    { id: 'callToActionVersions', name: 'Call to Action', icon: '👆', color: '#dc3545' }
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
  }

  loadCurrentUser() {
    this.userStateService.currentUser$.subscribe({
      next: (user) => {
        this.currentUser = user;
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
    if (this.authService.isLoggedIn()) {
      this.authService.getCurrentUser().subscribe({
        next: (user) => this.userStateService.setUser(user),
        error: () => this.redirectToLogin()
      });
    } else {
      this.redirectToLogin();
    }
  }

  private redirectToLogin() {
    this.router.navigate(['/login']);
  }

  loadSavedPosts() {
    if (!this.currentUser) return;
    
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

    this.updatePagination();
  }

  // ✅ METODI PAGINAZIONE
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredPosts.length / this.pageSize);
    this.currentPage = 1; // Reset alla prima pagina quando cambia il filtro
    this.updatePaginatedPosts();
  }

  updatePaginatedPosts() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedPosts = this.filteredPosts.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedPosts();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedPosts();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedPosts();
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
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
      // Potresti aggiungere un toast notification qui
      console.log('✅ Contenuto copiato!');
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

  getCategoryColor(tipo: string): string {
    const category = this.categories.find(cat => cat.id === tipo);
    return category?.color || '#6c757d';
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

  getCategoryCount(categoryId: string): number {
  if (categoryId === 'all') {
    return this.savedPosts.length;
  }
  return this.savedPosts.filter(post => post.tipo === categoryId).length;
}

getCategoryName(tipo: string): string {
  const category = this.categories.find(cat => cat.id === tipo);
  return category?.name || tipo;
}
}