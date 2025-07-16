import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppFloatingconfiguratorComponent } from './floatingconfigurator.component';

describe('AppFloatingconfiguratorComponent', () => {
  let component: AppFloatingconfiguratorComponent;
  let fixture: ComponentFixture<AppFloatingconfiguratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppFloatingconfiguratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppFloatingconfiguratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
