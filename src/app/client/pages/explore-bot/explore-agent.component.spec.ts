import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExploreAgentComponent } from './explore-agent.component';

describe('ExploreBotComponent', () => {
  let component: ExploreAgentComponent;
  let fixture: ComponentFixture<ExploreAgentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreAgentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExploreAgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
