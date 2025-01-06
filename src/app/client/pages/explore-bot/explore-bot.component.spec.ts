import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExploreBotComponent } from './explore-bot.component';

describe('ExploreBotComponent', () => {
  let component: ExploreBotComponent;
  let fixture: ComponentFixture<ExploreBotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreBotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExploreBotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
