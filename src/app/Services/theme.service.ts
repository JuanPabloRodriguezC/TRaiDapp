import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  public isDarkMode$ = this.isDarkModeSubject.asObservable();

  constructor() {
    this.loadThemeFromStorage();
  }

  get isDarkMode(): boolean {
    return this.isDarkModeSubject.value;
  }

  toggleTheme(): void {
    const newTheme = !this.isDarkModeSubject.value;
    this.isDarkModeSubject.next(newTheme);
    this.saveThemeToStorage(newTheme);
    this.applyTheme(newTheme);
  }

  private loadThemeFromStorage(): void {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    this.isDarkModeSubject.next(isDark);
    this.applyTheme(isDark);
  }

  private saveThemeToStorage(isDark: boolean): void {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  private applyTheme(isDark: boolean): void {
    const body = document.body;
    if (isDark) {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
    } else {
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
    }
  }
}